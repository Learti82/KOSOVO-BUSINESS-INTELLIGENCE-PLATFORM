import axios from 'axios';
import * as cheerio from 'cheerio';

const UA = 'KosovaIntel-DataCollector/1.0 (business intelligence; contact@kosovaintel.com)';

export interface ProcurementRecord {
  ocid?: string;
  tender_title?: string;
  contracting_authority?: string;
  municipality?: string;
  contract_value_eur?: number;
  award_date?: string;
  procedure_type?: string;
  cpv_code?: string;
  cpv_description?: string;
  source_url?: string;
  company_name_raw?: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function scrapeProcurementByCompany(companyName: string): Promise<ProcurementRecord[]> {
  const records: ProcurementRecord[] = [];
  try {
    const url = `https://www.prokurimihapur.org/searchcontracts`;
    const resp = await axios.get(url, {
      headers: { 'User-Agent': UA },
      params: { q: companyName },
      timeout: 20000,
    });
    const $ = cheerio.load(resp.data);
    $('.contract-row, tr.result').each((_, el) => {
      const $r = $(el);
      records.push({
        tender_title: $r.find('.title, td.title').text().trim(),
        contracting_authority: $r.find('.authority').text().trim(),
        contract_value_eur: parseFloat($r.find('.value').text().replace(/[^0-9.]/g, '')) || undefined,
        award_date: $r.find('.date').text().trim(),
        source_url: $r.find('a').attr('href'),
        company_name_raw: companyName,
      });
    });
    await delay(1500);
  } catch (err) {
    console.error('Procurement scrape failed:', (err as Error).message);
  }
  return records;
}
