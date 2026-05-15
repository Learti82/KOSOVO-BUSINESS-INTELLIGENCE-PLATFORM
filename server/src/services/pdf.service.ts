import fs from 'fs';
import path from 'path';

export interface ReportData {
  order_number: string;
  client_name: string;
  company: any;
  persons: any[];
  procurement: any[];
  news: any[];
  ai_risk_narrative?: string;
  ai_risk_score?: number;
  analyst_summary?: string;
  analyst_risk_rating?: string;
  analyst_flags?: any[];
  analyst_recommendations?: string;
}

function ratingColor(rating: string): string {
  return ({ low: '#16a34a', medium: '#eab308', high: '#ea580c', critical: '#dc2626' } as any)[rating] || '#6b7280';
}

export function renderReportHTML(data: ReportData): string {
  const date = new Date().toLocaleDateString('en-GB');
  const rating = data.analyst_risk_rating || 'medium';
  const score = data.ai_risk_score ?? 50;
  const proc = data.procurement || [];
  const news = data.news || [];
  const totalProc = proc.reduce((sum, p) => sum + (parseFloat(p.contract_value_eur) || 0), 0);

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Report ${data.order_number}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; @bottom-left { content: "CONFIDENTIAL — Prepared exclusively for ${data.client_name} — ${date}"; font-size: 8pt; color: #666; } @bottom-right { content: counter(page); font-size: 8pt; } }
  body { font-family: Georgia, serif; color: #1f2937; font-size: 11pt; line-height: 1.5; }
  h1 { color: #0f172a; border-bottom: 3px solid #0f172a; padding-bottom: 8px; }
  h2 { color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 28px; }
  .cover { text-align: center; padding: 80px 0 40px; }
  .cover h1 { border: 0; font-size: 28pt; }
  .cover .subject { font-size: 24pt; color: #0f172a; margin: 30px 0; font-weight: bold; }
  .badge { display: inline-block; padding: 8px 18px; border-radius: 6px; color: white; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10pt; }
  th { background: #f1f5f9; }
  .gauge { width: 100%; background: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden; }
  .gauge .fill { height: 100%; background: ${ratingColor(rating)}; width: ${score}%; }
  .flag { padding: 8px 12px; margin: 6px 0; background: #fef3c7; border-left: 4px solid #f59e0b; font-size: 10pt; }
  .page-break { page-break-before: always; }
  .footer-note { font-size: 8pt; color: #6b7280; margin-top: 30px; }
</style></head><body>

<div class="cover">
  <div style="font-size: 14pt; color: #64748b; letter-spacing: 3px;">KOSOVAINTEL</div>
  <h1>BUSINESS INTELLIGENCE REPORT</h1>
  <div class="subject">${data.company?.name || data.order_number}</div>
  <div style="margin: 30px 0;">
    <span class="badge" style="background: ${ratingColor(rating)};">${rating} risk</span>
  </div>
  <div style="margin-top: 60px; color: #475569;">
    <div>Order: <strong>${data.order_number}</strong></div>
    <div>Date: ${date}</div>
    <div>Prepared for: ${data.client_name}</div>
  </div>
  <div class="footer-note" style="margin-top: 80px;">CONFIDENTIAL — This report is prepared exclusively for the named recipient and is not transferable.</div>
</div>

<div class="page-break"></div>
<h2>1. Executive Summary</h2>
<div>Risk Score: <strong>${score} / 100</strong></div>
<div class="gauge"><div class="fill"></div></div>
<p>${data.ai_risk_narrative || data.analyst_summary || 'No executive summary available.'}</p>
${(data.analyst_flags || []).map((f: any) => `<div class="flag"><strong>${f.flag || f}</strong>${f.detail ? ` — ${f.detail}` : ''}</div>`).join('')}

<h2>2. Company Profile</h2>
<table>
  <tr><th>Registered Name</th><td>${data.company?.name || '—'}</td></tr>
  <tr><th>Registration Number</th><td>${data.company?.registration_number || '—'}</td></tr>
  <tr><th>Legal Form</th><td>${data.company?.legal_form || '—'}</td></tr>
  <tr><th>Status</th><td><span class="badge" style="background: ${data.company?.status === 'active' ? '#16a34a' : '#dc2626'}; font-size: 9pt; padding: 3px 10px;">${data.company?.status || 'unknown'}</span></td></tr>
  <tr><th>Registration Date</th><td>${data.company?.registration_date || '—'}</td></tr>
  <tr><th>Municipality</th><td>${data.company?.municipality || '—'}</td></tr>
  <tr><th>Address</th><td>${data.company?.address || '—'}</td></tr>
  <tr><th>Primary Activity</th><td>${data.company?.primary_activity_description || '—'}</td></tr>
  <tr><th>Share Capital</th><td>€ ${data.company?.share_capital_eur || '—'}</td></tr>
</table>

<h2>3. Ownership Structure</h2>
${data.persons?.length ? `<table><tr><th>Name</th><th>Role</th><th>Ownership %</th></tr>${data.persons.map((p) => `<tr><td>${p.full_name}</td><td>${p.role || '—'}</td><td>${p.ownership_percent || '—'}</td></tr>`).join('')}</table>` : '<p>No ownership data available — flagged as a data gap.</p>'}

<h2>4. Procurement History</h2>
<p>Total contracts: <strong>${proc.length}</strong> &nbsp;|&nbsp; Total value: <strong>€ ${totalProc.toLocaleString()}</strong></p>
${proc.length ? `<table><tr><th>Date</th><th>Authority</th><th>Title</th><th>Value (EUR)</th></tr>${proc.slice(0, 25).map((p) => `<tr><td>${p.award_date || '—'}</td><td>${p.contracting_authority || '—'}</td><td>${p.tender_title || '—'}</td><td>${(parseFloat(p.contract_value_eur) || 0).toLocaleString()}</td></tr>`).join('')}</table>` : '<p>No procurement history found in public records.</p>'}

<h2>5. Media & News Screening</h2>
${news.length ? news.map((n) => `<div style="margin: 10px 0; padding: 10px; background: #f8fafc;"><div style="font-weight: bold;">${n.headline}</div><div style="font-size: 9pt; color: #64748b;">${n.source_name} — sentiment: ${n.sentiment || 'unknown'}</div><div style="font-size: 10pt; margin-top: 4px;">${n.summary || ''}</div></div>`).join('') : '<p>No significant media presence found.</p>'}

<h2>6. Analyst Assessment</h2>
<p>${data.analyst_summary || 'No analyst summary provided.'}</p>
<p><strong>Recommendations:</strong> ${data.analyst_recommendations || '—'}</p>

<h2>7. Data Sources & Methodology</h2>
<ul style="font-size: 10pt;">
  <li>ARBK — Kosovo Business Registration Agency (https://arbk.rks-gov.net)</li>
  <li>e-Prokurimi — Kosovo Public Procurement (https://e-prokurimi.rks-gov.net)</li>
  <li>Kosovo Open Data Portal (https://opendata.rks-gov.net)</li>
  <li>Kosovo media sources: Koha, Gazeta Express, Prishtina Insight, Zëri</li>
</ul>
<p class="footer-note">This report is based on publicly available data sources as of ${date}. Information is provided for due diligence purposes and should be verified independently before commercial action.</p>

</body></html>`;
}

export async function generatePDF(data: ReportData, outputPath: string): Promise<string> {
  const html = renderReportHTML(data);
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
    await browser.close();
  } catch (err) {
    // Fallback: save HTML if puppeteer fails
    fs.writeFileSync(outputPath.replace(/\.pdf$/, '.html'), html);
    throw err;
  }
  return outputPath;
}
