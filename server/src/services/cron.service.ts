import cron from 'node-cron';
import { query } from '../db/pool';
import { enrichCompany } from './scrapers/enrich.service';

export function startCronJobs() {
  if (process.env.DISABLE_CRON === 'true') {
    console.log('[cron] Disabled via DISABLE_CRON env var');
    return;
  }

  // Nightly ARBK sync — pick 5 random active companies and refresh
  // 02:00 every day (Europe/Tirana)
  cron.schedule(
    '0 2 * * *',
    async () => {
      console.log('[cron] Nightly ARBK sync starting...');
      try {
        const result = await query<any>(
          `SELECT id, name, arbk_id FROM companies WHERE status = 'active' ORDER BY RANDOM() LIMIT 5`
        );
        for (const c of result.rows) {
          try {
            const res = await enrichCompany(c.name, c.arbk_id);
            console.log(`[cron] Refreshed ${c.name}:`, res);
          } catch (err) {
            console.error(`[cron] Failed for ${c.name}:`, (err as Error).message);
          }
        }
        console.log('[cron] Nightly ARBK sync complete');
      } catch (err) {
        console.error('[cron] Nightly sync errored:', err);
      }
    },
    { timezone: 'Europe/Tirana' }
  );

  console.log('[cron] Scheduled jobs registered');
}
