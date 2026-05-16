import { Router } from 'express';
import { query } from '../db/pool';
import { authRequired, AuthRequest } from '../middleware/auth.middleware';
import { calculatePrice, URGENCY_HOURS } from '../config/pricing';
import { generateOrderNumber, normalizeCompanyName } from '../utils/normalize';

const router = Router();

// POST /api/bulk/orders — body: { items: [{ company_name, report_type, urgency }] }
router.post('/orders', authRequired, async (req: AuthRequest, res) => {
  try {
    const items = (req.body?.items || []) as Array<{ company_name: string; report_type?: string; urgency?: string }>;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }
    if (items.length > 200) {
      return res.status(400).json({ error: 'Max 200 orders per batch' });
    }

    const batch = await query<{ id: number }>(
      `INSERT INTO bulk_batches (client_id, total_orders) VALUES ($1, $2) RETURNING id`,
      [req.user!.id, items.length]
    );

    const startSeq = (await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM report_orders')).rows[0];
    const startIdx = parseInt(startSeq.count) + 1;

    const created: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const reportType = (it.report_type || 'standard') as any;
      const urgency = (it.urgency || 'standard') as any;
      const price = calculatePrice(reportType, urgency);
      const dueAt = new Date(Date.now() + (URGENCY_HOURS[urgency as keyof typeof URGENCY_HOURS] || 48) * 3600 * 1000);
      const orderNumber = generateOrderNumber(startIdx + i);

      // Try to match company
      const match = await query<{ id: number }>(
        `SELECT id FROM companies WHERE name_normalized = $1 LIMIT 1`,
        [normalizeCompanyName(it.company_name)]
      );

      const order = await query<any>(
        `INSERT INTO report_orders
         (order_number, client_id, company_id, target_company_name, report_type, urgency, price_eur, due_at, status, paid)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',false) RETURNING id, order_number, target_company_name, price_eur`,
        [orderNumber, req.user!.id, match.rows[0]?.id || null, it.company_name, reportType, urgency, price, dueAt]
      );
      created.push(order.rows[0]);
    }

    res.json({ batch_id: batch.rows[0].id, count: created.length, orders: created });
  } catch (err: any) {
    console.error('Bulk order failed:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
