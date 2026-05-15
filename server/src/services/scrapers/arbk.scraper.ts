import axios from 'axios';
import * as cheerio from 'cheerio';

const UA = 'KosovaIntel-DataCollector/1.0 (business intelligence; contact@kosovaintel.com)';
const BASE = 'https://arbk.rks-gov.net';

export interface ArbkCompany {
  arbk_id?: string;
  registration_number?: string;
  name?: string;
  legal_form?: string;
  status?: string;
  registration_date?: string;
  municipality?: string;
  address?: string;
  primary_activity_code?: string;
  primary_activity_description?: string;
  share_capital_eur?: number;
  source_url?: string;
  persons?: Array<{ full_name: string; role?: string; ownership_percent?: number }>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function scrapeArbkSearch(name: string): Promise<ArbkCompany[]> {
  try {
    const url = `${BASE}/page.aspx?id=1,38`;
    const resp = await axios.get(url, {
      headers: { 'User-Agent': UA },
      params: { search: name },
      timeout: 15000,
    });
    const $ = cheerio.load(resp.data);
    const results: ArbkCompany[] = [];
    $('table.search-results tr, .company-row').each((_, el) => {
      const $row = $(el);
      const link = $row.find('a').attr('href');
      const text = $row.text().trim();
      if (link) {
        results.push({
          name: $row.find('a').first().text().trim() || text,
          source_url: link.startsWith('http') ? link : `${BASE}/${link}`,
          arbk_id: (link.match(/id=1,38,(\d+)/) || [])[1],
        });
      }
    });
    await delay(1000);
    return results;
  } catch (err) {
    console.error('ARBK search failed:', (err as Error).message);
    return [];
  }
}

export async function scrapeArbkCompany(arbkId: string): Promise<ArbkCompany | null> {
  try {
    const url = `${BASE}/page.aspx?id=1,38,${arbkId}`;
    const resp = await axios.get(url, { headers: { 'User-Agent': UA }, timeout: 15000 });
    const $ = cheerio.load(resp.data);
    const company: ArbkCompany = { arbk_id: arbkId, source_url: url, persons: [] };

    $('td, .field-row').each((_, el) => {
      const text = $(el).text().trim();
      const labelMatch = text.match(/^(Emri|Numri|Forma|Statusi|Adresa|Komuna|Kapitali)[:\s]+(.+)$/i);
      if (labelMatch) {
        const [, label, value] = labelMatch;
        const v = value.trim();
        switch (label.toLowerCase()) {
          case 'emri': company.name = v; break;
          case 'numri': company.registration_number = v; break;
          case 'forma': company.legal_form = v; break;
          case 'statusi': company.status = v; break;
          case 'adresa': company.address = v; break;
          case 'komuna': company.municipality = v; break;
          case 'kapitali': company.share_capital_eur = parseFloat(v.replace(/[^0-9.]/g, '')); break;
        }
      }
    });

    $('table.persons tr, .authorized-person').each((_, el) => {
      const name = $(el).find('.name, td').first().text().trim();
      const role = $(el).find('.role, td').eq(1).text().trim();
      if (name) company.persons!.push({ full_name: name, role });
    });

    await delay(1500);
    return company;
  } catch (err) {
    console.error('ARBK company scrape failed:', (err as Error).message);
    return null;
  }
}
