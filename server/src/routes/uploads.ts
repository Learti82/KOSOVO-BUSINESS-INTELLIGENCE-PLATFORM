import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db/pool';
import { authRequired, AuthRequest } from '../middleware/auth.middleware';

const UPLOAD_DIR = path.resolve(process.env.UPLOADS_PATH || './uploads', 'documents');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

const router = Router();

router.post('/orders/:orderId/document', authRequired, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const order = await query<{ client_id: number }>(
      'SELECT client_id FROM report_orders WHERE id = $1', [req.params.orderId]
    );
    if (!order.rows[0] || order.rows[0].client_id !== req.user!.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Not your order' });
    }
    const doc = await query<any>(
      `INSERT INTO uploaded_documents (order_id, client_id, original_name, stored_path, mime_type, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, original_name, uploaded_at`,
      [req.params.orderId, req.user!.id, req.file.originalname, req.file.path, req.file.mimetype, req.file.size]
    );
    res.json({ document: doc.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:orderId/documents', authRequired, async (req: AuthRequest, res) => {
  const r = await query<any>(
    `SELECT id, original_name, mime_type, size_bytes, uploaded_at FROM uploaded_documents
     WHERE order_id = $1 AND (client_id = $2 OR $3 = 'analyst' OR $3 = 'admin')`,
    [req.params.orderId, req.user!.id, req.user!.role]
  );
  res.json({ documents: r.rows });
});

export default router;
