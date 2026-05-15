import { Router } from 'express';
import { query } from '../db/pool';
import { normalizeCompanyName } from '../utils/normalize';

const router = Router();

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
