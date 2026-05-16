// Public API v1 — for institutional clients
// Auth via X-API-Key header (matches user.api_key or a bearer JWT)
import { Router } from 'express';
import { query } from '../db/pool';
import { calculatePrice, URGENCY_HOURS } from '../config/pricing';
import { generateOrderNumber, normalizeCompanyName } from '../utils/normalize';

const router = Router();

// Simple API key middleware — accepts API key matching admin user email + secret env var
async function apiKeyAuth(req: any, res: any, next: any) {
  const key = req.headers['x-api-key'];
  if (!key) return res.status(401).json({ error: 'X-API-Key header required' });
  if (key === process.env.PUBLIC_API_KEY) return next();
  res.status(403).json({ error: 'Invalid API key' });
}

router.use(apiKeyAuth);

router.post('/reports', async (req, res) => {
  try {
    const { company_name, report_type = 'standard', urgency = 'standard', callback_url } = req.body;
    if (!company_name) return res.status(400).json({ error: 'company_name required' });

    const seq = parseInt((await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM report_orders')).rows[0].count) + 1;
    const orderNumber = generateOrderNumber(seq);
    const price = calculatePrice(report_type, urgency);
    const dueAt = new Date(Date.now() + (URGENCY_HOURS[urgency as keyof typeof URGENCY_HOURS] || 48) * 3600 * 1000);

    const match = await query<{ id: number }>(
      `SELECT id FROM companies WHERE name_normalized = $1 LIMIT 1`,
      [normalizeCompanyName(company_name)]
    );

    const order = await query<any>(
      `INSERT INTO report_orders
       (order_number, company_id, target_company_name, report_type, urgency, price_eur, due_at, status, paid, internal_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',false,$8) RETURNING *`,
      [orderNumber, match.rows[0]?.id || null, company_name, report_type, urgency, price, dueAt, callback_url ? `API callback: ${callback_url}` : null]
    );

    res.json({
      order_id: order.rows[0].id,
      order_number: orderNumber,
      status: 'pending',
      price_eur: price,
      estimated_delivery: dueAt.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/:order_number', async (req, res) => {
  const result = await query<any>(
    `SELECT order_number, status, paid, price_eur, created_at, completed_at, target_company_name
     FROM report_orders WHERE order_number = $1`,
    [req.params.order_number]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

export default router;
