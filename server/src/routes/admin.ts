import { Router } from 'express';
import { query } from '../db/pool';
import { authRequired, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { enrichCompany } from '../services/scrapers/enrich.service';
import { generateRiskAssessment } from '../services/ai.service';
import { sendEmail, reportReadyEmail } from '../services/email.service';

const router = Router();

router.use(authRequired, requireRole('analyst', 'admin'));

// Orders
router.get('/orders', async (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const params: any[] = [];
  let sql = `SELECT o.*, u.email AS client_email, u.full_name AS client_name, u.company_name AS client_company,
                    c.name AS company_name
             FROM report_orders o
             LEFT JOIN users u ON o.client_id = u.id
             LEFT JOIN companies c ON o.company_id = c.id`;
  if (status) {
    params.push(status);
    sql += ` WHERE o.status = $1`;
  }
  sql += ` ORDER BY o.created_at DESC LIMIT 200`;
  const result = await query(sql, params);
  res.json({ orders: result.rows });
});

router.get('/orders/:id', async (req, res) => {
  const order = await query<any>(
    `SELECT o.*, u.email AS client_email, u.full_name AS client_name, u.company_name AS client_company
     FROM report_orders o LEFT JOIN users u ON o.client_id = u.id WHERE o.id = $1`,
    [req.params.id]
  );
  if (!order.rows[0]) return res.status(404).json({ error: 'Not found' });
  const report = await query('SELECT * FROM reports WHERE order_id = $1', [req.params.id]);
  let company = null, persons: any[] = [], procurement: any[] = [], news: any[] = [];
  if (order.rows[0].company_id) {
    const c = await query('SELECT * FROM companies WHERE id = $1', [order.rows[0].company_id]);
    company = c.rows[0];
    persons = (await query('SELECT * FROM company_persons WHERE company_id = $1', [order.rows[0].company_id])).rows;
    procurement = (await query('SELECT * FROM procurement_records WHERE company_id = $1 ORDER BY award_date DESC', [order.rows[0].company_id])).rows;
    news = (await query('SELECT * FROM news_mentions WHERE company_id = $1 ORDER BY published_at DESC NULLS LAST', [order.rows[0].company_id])).rows;
  }
  res.json({ order: order.rows[0], report: report.rows[0], company, persons, procurement, news });
});

router.patch('/orders/:id/assign', async (req: AuthRequest, res) => {
  await query('UPDATE report_orders SET assigned_analyst_id = $1, status = $2 WHERE id = $3',
    [req.user!.id, 'in_progress', req.params.id]);
  res.json({ ok: true });
});

router.patch('/orders/:id/status', async (req, res) => {
  await query('UPDATE report_orders SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
  res.json({ ok: true });
});

// Companies
router.get('/companies/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const result = await query(
    `SELECT * FROM companies WHERE name ILIKE $1 OR name_normalized ILIKE $1 ORDER BY name LIMIT 50`,
    [`%${q}%`]
  );
  res.json({ results: result.rows });
});

router.get('/companies/:id', async (req, res) => {
  const c = await query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
  if (!c.rows[0]) return res.status(404).json({ error: 'Not found' });
  const persons = (await query('SELECT * FROM company_persons WHERE company_id = $1', [req.params.id])).rows;
  const procurement = (await query('SELECT * FROM procurement_records WHERE company_id = $1', [req.params.id])).rows;
  const news = (await query('SELECT * FROM news_mentions WHERE company_id = $1', [req.params.id])).rows;
  res.json({ company: c.rows[0], persons, procurement, news });
});

router.post('/companies/:id/scrape', async (req, res) => {
  const c = await query<any>('SELECT name, arbk_id FROM companies WHERE id = $1', [req.params.id]);
  if (!c.rows[0]) return res.status(404).json({ error: 'Not found' });
  const result = await enrichCompany(c.rows[0].name, c.rows[0].arbk_id);
  res.json(result);
});

// Scrape
router.post('/scrape/company', async (req, res) => {
  const { name, arbk_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const result = await enrichCompany(name, arbk_id);
  res.json(result);
});

router.get('/scrape/jobs', async (_req, res) => {
  const result = await query('SELECT * FROM scrape_jobs ORDER BY started_at DESC NULLS LAST LIMIT 100');
  res.json({ jobs: result.rows });
});

// Reports
router.get('/reports/:order_id', async (req, res) => {
  const result = await query('SELECT * FROM reports WHERE order_id = $1', [req.params.order_id]);
  res.json({ report: result.rows[0] || null });
});

router.put('/reports/:order_id', async (req, res) => {
  const orderId = req.params.order_id;
  const order = await query<any>('SELECT company_id FROM report_orders WHERE id = $1', [orderId]);
  if (!order.rows[0]) return res.status(404).json({ error: 'Order not found' });
  const fields = req.body || {};
  const existing = await query('SELECT id FROM reports WHERE order_id = $1', [orderId]);
  if (existing.rows[0]) {
    await query(
      `UPDATE reports SET
        analyst_summary = COALESCE($1, analyst_summary),
        analyst_risk_rating = COALESCE($2, analyst_risk_rating),
        analyst_flags = COALESCE($3, analyst_flags),
        analyst_recommendations = COALESCE($4, analyst_recommendations),
        ai_risk_narrative = COALESCE($5, ai_risk_narrative),
        ai_risk_score = COALESCE($6, ai_risk_score),
        updated_at = NOW()
       WHERE order_id = $7`,
      [fields.analyst_summary, fields.analyst_risk_rating, JSON.stringify(fields.analyst_flags || null),
       fields.analyst_recommendations, fields.ai_risk_narrative, fields.ai_risk_score, orderId]
    );
  } else {
    await query(
      `INSERT INTO reports (order_id, company_id, analyst_summary, analyst_risk_rating, analyst_flags, analyst_recommendations)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [orderId, order.rows[0].company_id, fields.analyst_summary, fields.analyst_risk_rating,
       JSON.stringify(fields.analyst_flags || null), fields.analyst_recommendations]
    );
  }
  res.json({ ok: true });
});

router.post('/reports/:order_id/generate-ai', async (req, res) => {
  try {
    const orderId = req.params.order_id;
    const order = await query<any>('SELECT company_id FROM report_orders WHERE id = $1', [orderId]);
    if (!order.rows[0]?.company_id) return res.status(400).json({ error: 'Order has no linked company' });
    const cid = order.rows[0].company_id;
    const company = (await query('SELECT * FROM companies WHERE id = $1', [cid])).rows[0];
    const persons = (await query('SELECT * FROM company_persons WHERE company_id = $1', [cid])).rows;
    const procurement = (await query('SELECT * FROM procurement_records WHERE company_id = $1', [cid])).rows;
    const news = (await query('SELECT * FROM news_mentions WHERE company_id = $1', [cid])).rows;
    const assessment = await generateRiskAssessment({ company, persons, procurement, news });
    await query(
      `INSERT INTO reports (order_id, company_id, ai_risk_narrative, ai_risk_score, analyst_risk_rating, analyst_flags)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (order_id) DO UPDATE SET
         ai_risk_narrative = EXCLUDED.ai_risk_narrative,
         ai_risk_score = EXCLUDED.ai_risk_score,
         analyst_risk_rating = COALESCE(reports.analyst_risk_rating, EXCLUDED.analyst_risk_rating),
         analyst_flags = COALESCE(reports.analyst_flags, EXCLUDED.analyst_flags),
         updated_at = NOW()`,
      [orderId, cid, assessment.executive_summary, assessment.risk_score, assessment.risk_rating,
       JSON.stringify(assessment.risk_flags)]
    );
    res.json({ assessment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reports/:order_id/generate-pdf', async (req, res) => {
  try {
    const { buildAndSavePDF } = await import('./reports');
    const pdfPath = await buildAndSavePDF(parseInt(req.params.order_id));
    res.json({ pdf_path: pdfPath });
  } catch (err: any) {
    console.error('PDF generation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/reports/:order_id/publish', async (req, res) => {
  const orderId = req.params.order_id;
  await query(
    `UPDATE report_orders SET status = 'completed', completed_at = NOW() WHERE id = $1`,
    [orderId]
  );
  await query(`UPDATE reports SET published_at = NOW() WHERE order_id = $1`, [orderId]);
  const o = (await query<any>(
    `SELECT o.order_number, o.id, u.email FROM report_orders o LEFT JOIN users u ON o.client_id = u.id WHERE o.id = $1`,
    [orderId]
  )).rows[0];
  if (o?.email) {
    const url = `${process.env.BASE_URL || 'http://localhost:5173'}/dashboard/orders/${o.id}`;
    try { await sendEmail(o.email, `Report ${o.order_number} ready`, reportReadyEmail(o.order_number, '', url)); } catch {}
  }
  res.json({ ok: true });
});

// Admin
router.get('/users', requireRole('admin'), async (_req, res) => {
  const result = await query('SELECT id, email, full_name, role, company_name, created_at FROM users ORDER BY id');
  res.json({ users: result.rows });
});

router.get('/stats', async (_req, res) => {
  const [orders, revenue, companies] = await Promise.all([
    query<any>(`SELECT status, COUNT(*)::int AS count FROM report_orders GROUP BY status`),
    query<any>(`SELECT COALESCE(SUM(price_eur),0)::float AS total FROM report_orders WHERE paid = true`),
    query<any>(`SELECT COUNT(*)::int AS count FROM companies`),
  ]);
  res.json({
    orders_by_status: orders.rows,
    total_revenue_eur: revenue.rows[0].total,
    indexed_companies: companies.rows[0].count,
  });
});

export default router;
