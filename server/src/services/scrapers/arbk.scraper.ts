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
    // ARBK uses ASP.NET WebForms — POST to the search page
    const searchUrl = `${BASE}/page.aspx?id=1,38`;
    // First GET to get viewstate
    const getResp = await axios.get(searchUrl, { headers: { 'User-Agent': UA }, timeout: 15000 });
    const $get = cheerio.load(getResp.data);
    const viewstate = $get('#__VIEWSTATE').val() || '';
    const eventvalidation = $get('#__EVENTVALIDATION').val() || '';
    const viewstategenerator = $get('#__VIEWSTATEGENERATOR').val() || '';

    await delay(800);

    // POST the search form
    const params = new URLSearchParams();
    params.append('__VIEWSTATE', String(viewstate));
    params.append('__EVENTVALIDATION', String(eventvalidation));
    params.append('__VIEWSTATEGENERATOR', String(viewstategenerator));
    params.append('ctl00$ContentPlaceHolder1$txtEmri', name);
    params.append('ctl00$ContentPlaceHolder1$btnKerko', 'Kërko');

    const resp = await axios.post(searchUrl, params.toString(), {
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': searchUrl,
      },
      timeout: 20000,
    });

    const $ = cheerio.load(resp.data);
    const results: ArbkCompany[] = [];

    // Parse results table — ARBK shows results in a GridView
    $('table[id*="GridView"] tr, table.gridview tr').each((i, el) => {
      if (i === 0) return; // skip header
      const $row = $(el);
      const cells = $row.find('td');
      if (cells.length < 2) return;
      const link = $row.find('a').attr('href') || '';
      const arbkId = (link.match(/id=1,38,(\d+)/) || link.match(/Id=(\d+)/) || [])[1];
      const companyName = cells.eq(0).text().trim() || $row.find('a').text().trim();
      if (companyName) {
        results.push({
          name: companyName,
          registration_number: cells.eq(1)?.text().trim(),
          municipality: cells.eq(2)?.text().trim(),
          status: cells.eq(3)?.text().trim(),
          source_url: link ? `${BASE}/${link.replace(/^\//, '')}` : searchUrl,
          arbk_id: arbkId,
        });
      }
    });

    // Fallback: try any link that contains company search pattern
    if (results.length === 0) {
      $('a[href*="id=1,38,"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const arbkId = (href.match(/id=1,38,(\d+)/) || [])[1];
        const companyName = $(el).text().trim();
        if (companyName && arbkId) {
          results.push({ name: companyName, arbk_id: arbkId, source_url: `${BASE}/page.aspx?${href}` });
        }
      });
    }

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
    const resp = await axios.get(url, {
      headers: { 'User-Agent': UA },
      timeout: 15000,
    });
    const $ = cheerio.load(resp.data);
    const company: ArbkCompany = { arbk_id: arbkId, source_url: url, persons: [] };

    // ARBK detail page uses label/value pairs in tables
    // Try to find labelled fields — works across ARBK page layouts
    $('tr').each((_, el) => {
      const cells = $(el).find('td');
      if (cells.length < 2) return;
      const label = cells.eq(0).text().trim().replace(/:$/, '').toLowerCase();
      const value = cells.eq(1).text().trim();
      if (!value) return;

      if (label.includes('emri') || label.includes('name')) company.name = value;
      else if (label.includes('numri') || label.includes('number') || label.includes('reg')) company.registration_number = value;
      else if (label.includes('forma') || label.includes('form') || label.includes('lloji')) company.legal_form = value;
      else if (label.includes('statusi') || label.includes('status')) company.status = normalizeStatus(value);
      else if (label.includes('adresa') || label.includes('address')) company.address = value;
      else if (label.includes('komuna') || label.includes('munici')) company.municipality = value;
      else if (label.includes('data') && label.includes('regj')) company.registration_date = value;
      else if (label.includes('kapital')) company.share_capital_eur = parseFloat(value.replace(/[^0-9.]/g, '')) || undefined;
      else if (label.includes('aktivit')) company.primary_activity_description = value;
    });

    // Authorized persons table
    $('table').each((_, table) => {
      const headers = $(table).find('th').map((_, th) => $(th).text().toLowerCase()).get();
      const hasPersonHeaders = headers.some(h => h.includes('emri') || h.includes('rol') || h.includes('person'));
      if (!hasPersonHeaders) return;
      $(table).find('tr').each((i, row) => {
        if (i === 0) return;
        const cells = $(row).find('td');
        const personName = cells.eq(0).text().trim();
        const role = cells.eq(1).text().trim();
        const pct = parseFloat(cells.eq(2).text().replace(/[^0-9.]/g, '')) || undefined;
        if (personName) company.persons!.push({ full_name: personName, role, ownership_percent: pct });
      });
    });

    await delay(1500);
    return company;
  } catch (err) {
    console.error('ARBK company scrape failed:', (err as Error).message);
    return null;
  }
}

function normalizeStatus(s: string): string {
  const l = s.toLowerCase();
  if (l.includes('aktiv') || l.includes('active')) return 'active';
  if (l.includes('suspend') || l.includes('pezulluar')) return 'suspended';
  if (l.includes('çregj') || l.includes('deregis')) return 'deregistered';
  if (l.includes('likuid')) return 'in_liquidation';
  return s;
}
