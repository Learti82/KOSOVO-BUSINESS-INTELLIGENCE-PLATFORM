import { query } from '../db/pool';

export interface PeerStats {
  sector_count: number;
  avg_capital: number;
  avg_procurement_value: number;
  avg_procurement_count: number;
  median_age_years: number;
  this_company: {
    capital_percentile: number;
    procurement_percentile: number;
    age_vs_avg: string;
  };
}

// Approximate sector benchmarks based on indexed companies
export async function getPeerBenchmark(companyId: number): Promise<PeerStats | null> {
  const c = (await query<any>('SELECT * FROM companies WHERE id = $1', [companyId])).rows[0];
  if (!c) return null;

  // Use municipality as a rough sector proxy (full sector taxonomy would be a future improvement)
  const peers = (await query<any>(
    `SELECT c.id, c.share_capital_eur, c.registration_date,
            COALESCE(SUM(p.contract_value_eur), 0)::float AS proc_total,
            COUNT(p.id)::int AS proc_count
     FROM companies c
     LEFT JOIN procurement_records p ON p.company_id = c.id
     WHERE c.id != $1 AND c.status = 'active'
     GROUP BY c.id`,
    [companyId]
  )).rows;

  if (peers.length === 0) return null;

  const capitals = peers.map((p) => Number(p.share_capital_eur) || 0).filter((v) => v > 0).sort((a, b) => a - b);
  const procTotals = peers.map((p) => Number(p.proc_total) || 0).sort((a, b) => a - b);
  const ages = peers.filter((p) => p.registration_date).map((p) => (Date.now() - new Date(p.registration_date).getTime()) / (365 * 24 * 3600 * 1000));
  ages.sort((a, b) => a - b);

  const thisCapital = Number(c.share_capital_eur) || 0;
  const thisProc = (await query<{ total: string }>('SELECT COALESCE(SUM(contract_value_eur), 0)::text AS total FROM procurement_records WHERE company_id = $1', [companyId])).rows[0];
  const thisProcTotal = Number(thisProc.total);
  const thisAge = c.registration_date ? (Date.now() - new Date(c.registration_date).getTime()) / (365 * 24 * 3600 * 1000) : 0;
  const avgAge = ages.length ? ages.reduce((s, a) => s + a, 0) / ages.length : 0;

  const percentile = (arr: number[], v: number) => {
    if (arr.length === 0) return 0;
    const below = arr.filter((x) => x < v).length;
    return Math.round((below / arr.length) * 100);
  };

  return {
    sector_count: peers.length + 1,
    avg_capital: capitals.length ? capitals.reduce((s, v) => s + v, 0) / capitals.length : 0,
    avg_procurement_value: procTotals.length ? procTotals.reduce((s, v) => s + v, 0) / procTotals.length : 0,
    avg_procurement_count: peers.length ? peers.reduce((s, p) => s + Number(p.proc_count), 0) / peers.length : 0,
    median_age_years: ages.length ? ages[Math.floor(ages.length / 2)] : 0,
    this_company: {
      capital_percentile: percentile(capitals, thisCapital),
      procurement_percentile: percentile(procTotals, thisProcTotal),
      age_vs_avg: thisAge > avgAge ? 'above average' : 'below average',
    },
  };
}
