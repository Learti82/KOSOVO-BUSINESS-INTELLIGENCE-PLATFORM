import { Router } from 'express';
import fs from 'fs';
import { query } from '../db/pool';
import { authRequired, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/client/orders/:id/report', authRequired, requireRole('client'), async (req: AuthRequest, res) => {
  const result = await query<any>(
    `SELECT r.pdf_path, o.order_number FROM reports r
     JOIN report_orders o ON r.order_id = o.id
     WHERE o.id = $1 AND o.client_id = $2 AND r.published_at IS NOT NULL`,
    [req.params.id, req.user!.id]
  );
  const row = result.rows[0];
  if (!row?.pdf_path || !fs.existsSync(row.pdf_path)) {
    return res.status(404).json({ error: 'Report not available' });
  }
  res.download(row.pdf_path, `${row.order_number}.pdf`);
});

export default router;
