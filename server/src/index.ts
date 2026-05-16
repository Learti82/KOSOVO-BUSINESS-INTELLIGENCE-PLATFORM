import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import orderRoutes from './routes/orders';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import bulkRoutes from './routes/bulk';
import historyRoutes from './routes/history';
import apiV1Routes from './routes/api_v1';
import uploadRoutes from './routes/uploads';
import { startCronJobs } from './services/cron.service';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const publicLimiter = rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true });
const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'KosovaIntel API' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/companies', publicLimiter, companyRoutes);
app.use('/api/orders', publicLimiter, orderRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/v1', apiV1Routes);
app.use('/api/uploads', uploadRoutes);
app.use('/api', reportRoutes);
app.use('/api/analyst', adminRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

const PORT = parseInt(process.env.PORT || '3001');
app.listen(PORT, () => {
  console.log(`KosovaIntel API listening on http://localhost:${PORT}`);
  startCronJobs();
});
