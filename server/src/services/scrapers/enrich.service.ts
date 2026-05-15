import { query } from '../../db/pool';
import { scrapeArbkSearch, scrapeArbkCompany } from './arbk.scraper';
import { scrapeProcurementByCompany } from './procurement.scraper';
import { scrapeNewsForCompany } from './news.scraper';
import { normalizeCompanyName, hashPII } from '../../utils/normalize';

export interface EnrichmentResult {
  company_id?: number;
  arbk: boolean;
  procurement_count: number;
  news_count: number;
  errors: string[];
}

export async function enrichCompany(companyName: string, arbkId?: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = { arbk: false, procurement_count: 0, news_count: 0, errors: [] };
  const jobResult = await query<{ id: number }>(
    `INSERT INTO scrape_jobs (job_type, target, status, started_at, triggered_by)
     VALUES ('full_company_enrich', $1, 'running', NOW(), 'analyst') RETURNING id`,
    [companyName]
  );
  const jobId = jobResult.rows[0].id;

  try {
    let companyData = null;
    if (arbkId) {
      companyData = await scrapeArbkCompany(arbkId);
    } else {
      const search = await scrapeArbkSearch(companyName);
      if (search[0]?.arbk_id) {
        companyData = await scrapeArbkCompany(search[0].arbk_id);
      }
    }

    let companyId: number | undefined;
    if (companyData?.name) {
      result.arbk = true;
      const upsert = await query<{ id: number }>(
        `INSERT INTO companies (arbk_id, registration_number, name, name_normalized, legal_form, status,
                                municipality, address, share_capital_eur, source_url, scraped_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
         ON CONFLICT (arbk_id) DO UPDATE SET
           name = EXCLUDED.name, status = EXCLUDED.status, scraped_at = NOW()
         RETURNING id`,
        [
          companyData.arbk_id,
          companyData.registration_number,
          companyData.name,
          normalizeCompanyName(companyData.name),
          companyData.legal_form,
          companyData.status,
          companyData.municipality,
          companyData.address,
          companyData.share_capital_eur,
          companyData.source_url,
        ]
      );
      companyId = upsert.rows[0].id;
      result.company_id = companyId;

      if (companyData.persons) {
        await query('DELETE FROM company_persons WHERE company_id = $1', [companyId]);
        for (const p of companyData.persons) {
          await query(
            `INSERT INTO company_persons (company_id, full_name, role, ownership_percent, id_number_hash)
             VALUES ($1,$2,$3,$4,$5)`,
            [companyId, p.full_name, p.role, p.ownership_percent, hashPII(p.full_name)]
          );
        }
      }
    }

    const [procRes, newsRes] = await Promise.allSettled([
      scrapeProcurementByCompany(companyName),
      scrapeNewsForCompany(companyName),
    ]);

    if (procRes.status === 'fulfilled') {
      for (const p of procRes.value) {
        await query(
          `INSERT INTO procurement_records
           (company_id, company_name_raw, tender_title, contracting_authority, contract_value_eur, source_url, scraped_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW())
           ON CONFLICT (ocid) DO NOTHING`,
          [companyId, companyName, p.tender_title, p.contracting_authority, p.contract_value_eur, p.source_url]
        );
      }
      result.procurement_count = procRes.value.length;
    } else result.errors.push(`procurement: ${procRes.reason}`);

    if (newsRes.status === 'fulfilled') {
      for (const n of newsRes.value) {
        await query(
          `INSERT INTO news_mentions (company_id, search_term, headline, summary, source_name, source_url, sentiment, scraped_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
          [companyId, companyName, n.headline, n.summary, n.source_name, n.source_url, n.sentiment]
        );
      }
      result.news_count = newsRes.value.length;
    } else result.errors.push(`news: ${newsRes.reason}`);

    await query(
      `UPDATE scrape_jobs SET status='completed', completed_at=NOW(), records_processed=$1 WHERE id=$2`,
      [result.procurement_count + result.news_count + (result.arbk ? 1 : 0), jobId]
    );
  } catch (err: any) {
    await query(`UPDATE scrape_jobs SET status='failed', completed_at=NOW(), error_message=$1 WHERE id=$2`, [
      err.message,
      jobId,
    ]);
    result.errors.push(err.message);
  }

  return result;
}
