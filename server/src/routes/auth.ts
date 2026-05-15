import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db/pool';
import { signToken } from '../middleware/auth.middleware';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  use_case: z.string().optional(),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hash = await bcrypt.hash(data.password, 10);
    const result = await query<{ id: number; email: string; role: string }>(
      `INSERT INTO users (email, password_hash, full_name, company_name, phone, use_case, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'client') RETURNING id, email, role`,
      [data.email, hash, data.full_name, data.company_name, data.phone, data.use_case]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query<any>(
      'SELECT id, email, role, password_hash, full_name, company_name FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name, company_name: user.company_name },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
