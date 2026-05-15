import { Router } from 'express';
import { query } from '../db/pool';
import { authRequired, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { calculatePrice, URGENCY_HOURS, PRICING } from '../config/pricing';
import { generateOrderNumber } from '../utils/normalize';
import { sendEmail, orderReceivedEmail } from '../services/email.service';

const router = Router();

// Public — submit order
router.post('/request', async (req, res) => {
  try {
    const {
      target_company_name,
      company_id,
      report_type = 'standard',
      urgency = 'standard',
      client_id,
      client_notes,
    } = req.body;
    if (!target_company_name) return res.status(400).json({ error: 'target_company_name required' });
    const price = calculatePrice(report_type, urgency);
    const dueAt = new Date(Date.now() + (URGENCY_HOURS[urgency as keyof typeof URGENCY_HOURS] || 48) * 3600 * 1000);
    const seqResult = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM report_orders');
    const orderNumber = generateOrderNumber(parseInt(seqResult.rows[0].count) + 1);
    const result = await query<any>(
      `INSERT INTO report_orders
       (order_number, client_id, company_id, target_company_name, report_type, urgency, price_eur, due_at, client_notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING *`,
      [orderNumber, client_id || null, company_id || null, target_company_name, report_type, urgency, price, dueAt, client_notes]
    );
    const order = result.rows[0];
    // best-effort email
    if (client_id) {
      try {
        const u = await query<any>('SELECT email, full_name FROM users WHERE id = $1', [client_id]);
        if (u.rows[0]) {
          await sendEmail(u.rows[0].email, `Order ${orderNumber} received`, orderReceivedEmail(orderNumber, target_company_name));
        }
      } catch {}
    }
    res.json({ order });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/pricing', (_req, res) => {
  res.json({ tiers: PRICING });
});

// Client routes
router.get('/client/orders', authRequired, requireRole('client'), async (req: AuthRequest, res) => {
  const result = await query(
    'SELECT * FROM report_orders WHERE client_id = $1 ORDER BY created_at DESC',
    [req.user!.id]
  );
  res.json({ orders: result.rows });
});

router.get('/client/orders/:id', authRequired, requireRole('client'), async (req: AuthRequest, res) => {
  const result = await query(
    'SELECT * FROM report_orders WHERE id = $1 AND client_id = $2',
    [req.params.id, req.user!.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ order: result.rows[0] });
});

router.post('/client/orders/:id/pay', authRequired, requireRole('client'), async (req: AuthRequest, res) => {
  const { payment_method = 'manual' } = req.body;
  await query(
    `UPDATE report_orders SET paid = true, paid_at = NOW(), payment_method = $1
     WHERE id = $2 AND client_id = $3`,
    [payment_method, req.params.id, req.user!.id]
  );
  res.json({ ok: true });
});

export default router;
