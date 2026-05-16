import { Router } from 'express';
import { query } from '../db/pool';

const router = Router();

router.get('/company/:id', async (req, res) => {
  const result = await query<any>(
    `SELECT risk_score, risk_rating, flags_count, source, created_at
     FROM risk_score_history WHERE company_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  res.json({ history: result.rows });
});

export default router;
