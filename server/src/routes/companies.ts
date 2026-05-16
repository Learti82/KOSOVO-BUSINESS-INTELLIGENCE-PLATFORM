import { Router } from 'express';
import { query } from '../db/pool';
import { normalizeCompanyName } from '../utils/normalize';

const router = Router();

// Public list — browse all
router.get('/', async (req, res) => {
  const sector = req.query.sector ? String(req.query.sector) : null;
  const municipality = req.query.municipality ? String(req.query.municipality) : null;
  const params: any[] = [];
  let sql = `SELECT id, name, legal_form, status, municipality, registration_date,
                    primary_activity_description, share_capital_eur, source_url
             FROM companies WHERE 1=1`;
  if (municipality) { params.push(municipality); sql += ` AND municipality = $${params.length}`; }
  sql += ' ORDER BY name LIMIT 200';
  const result = await query(sql, params);
  res.json({ companies: result.rows });
});

router.get('/:id/public', async (req, res) => {
  const c = await query<any>('SELECT * FROM companies WHERE id = $1', [req.params.id]);
  if (!c.rows[0]) return res.status(404).json({ error: 'Not found' });
  const persons = (await query('SELECT full_name, role, ownership_percent FROM company_persons WHERE company_id = $1', [req.params.id])).rows;
  const procurement = (await query(
    'SELECT tender_title, contracting_authority, contract_value_eur, award_date FROM procurement_records WHERE company_id = $1 ORDER BY award_date DESC LIMIT 50',
    [req.params.id]
  )).rows;
  const news = (await query(
    'SELECT headline, summary, source_name, source_url, published_at, sentiment FROM news_mentions WHERE company_id = $1 ORDER BY published_at DESC NULLS LAST LIMIT 30',
    [req.params.id]
  )).rows;
  res.json({ company: c.rows[0], persons, procurement, news });
});

// Public search — basic info only
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const municipality = req.query.municipality ? String(req.query.municipality) : null;
  if (q.length < 2) return res.json({ results: [] });
  const normalized = normalizeCompanyName(q);
  const params: any[] = [`%${normalized}%`];
  let sql = `SELECT id, name, legal_form, status, municipality, registration_date
             FROM companies WHERE name_normalized ILIKE $1`;
  if (municipality) {
    params.push(municipality);
    sql += ` AND municipality = $${params.length}`;
  }
  sql += ' ORDER BY name LIMIT 20';
  const result = await query(sql, params);
  res.json({ results: result.rows });
});

// Public preview
router.get('/:id/preview', async (req, res) => {
  const result = await query(
    `SELECT id, name, legal_form, status, municipality, registration_date,
            primary_activity_description FROM companies WHERE id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

export default router;
