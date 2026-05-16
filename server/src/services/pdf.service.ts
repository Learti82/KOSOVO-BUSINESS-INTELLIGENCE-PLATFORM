import fs from 'fs';
import path from 'path';
// @ts-ignore
import PDFDocument from 'pdfkit';

export interface ReportData {
  order_number: string;
  client_name: string;
  company: any;
  persons: any[];
  procurement: any[];
  news: any[];
  ai_risk_narrative?: string;
  ai_risk_score?: number;
  data_gaps?: string[];
  analyst_summary?: string;
  analyst_risk_rating?: string;
  analyst_flags?: any[];
  analyst_recommendations?: string;
  lang?: 'en' | 'sq';
  tier?: 'basic' | 'standard' | 'comprehensive';
  is_sample?: boolean;
  sanctions_results?: Array<{ person: string; hits: any[] }>;
  court_results?: any[];
  peer_stats?: any;
  history?: Array<{ created_at: string; risk_score: number }>;
}

const RATING_COLORS: Record<string, string> = {
  low: '#16a34a', medium: '#b45309', high: '#ea580c', critical: '#dc2626',
};

const TIER_COLORS: Record<string, string> = {
  basic: '#64748b', standard: '#0ea5e9', comprehensive: '#9333ea',
};

const LABELS = {
  en: {
    report_title: 'BUSINESS INTELLIGENCE',
    report_subtitle: 'REPORT',
    tagline_basic: 'Verification Report',
    tagline_standard: 'Risk Screening Report',
    tagline_comprehensive: 'Full Due Diligence',
    risk: 'RISK',
    score: 'Score',
    order_number: 'Order Number',
    date_issued: 'Date Issued',
    prepared_for: 'Prepared for',
    report_tier: 'Report Tier',
    confidential_cover: (name: string) => `CONFIDENTIAL — Prepared exclusively for ${name}. Not transferable.`,
    // Basic
    b_snapshot: 'Company Verification',
    b_facts: 'Verified Facts (ARBK Registry)',
    b_status_label: 'Registration Status',
    b_what_this_means: 'What this report includes',
    b_basic_explanation: 'This is a Basic verification report. It confirms registration status, legal form, address, and authorized persons against the official Kosovo Business Registration Agency (ARBK). For procurement history, media screening, and analyst commentary, upgrade to Standard or Comprehensive.',
    // Standard adds
    s_procurement: 'Procurement Activity',
    s_news: 'Media Screening',
    s_analyst_brief: 'Analyst Brief',
    s_standard_explanation: 'This Standard report adds procurement history (government contracts won), media sentiment screening across major Kosovo outlets, and a written analyst brief. For AI risk scoring, sanctions screening, court records, and peer benchmarking, upgrade to Comprehensive.',
    // Comprehensive adds
    c_risk_breakdown: 'Risk Score Breakdown',
    c_full_narrative: 'AI Risk Narrative',
    c_flags: 'Identified Risk Flags',
    c_sanctions: 'Sanctions & PEP Screening',
    c_court: 'Court Records & Litigation',
    c_peer: 'Peer Benchmarking',
    c_history: 'Risk Score History',
    c_recommendations: 'Action Recommendations',
    c_glossary: 'Glossary & Methodology',
    sanctions_clear: 'No sanctions or PEP matches found across screened persons against the OpenSanctions consolidated dataset.',
    sanctions_screened_via: 'Screened via the OpenSanctions API (https://api.opensanctions.org) which aggregates EU/UN/UK/OFAC sanctions lists and PEP registers.',
    court_clear: 'No public court records or litigation matters were identified at the Supreme Court of Kosovo bulletin index.',
    court_searched_at: 'Searched at: https://supreme.gjyqesori-rks.org',
    peer_intro: 'The subject company is compared against the active company population indexed in the platform.',
    no_history: 'No previous assessments on file — this is the inaugural assessment.',
    common: {
      profile: 'Company Profile',
      ownership: 'Ownership Structure',
      name: 'Registered Name',
      reg_num: 'Registration Number',
      legal_form: 'Legal Form',
      status: 'Status',
      reg_date: 'Registration Date',
      age: 'Operating Age',
      years: 'years',
      municipality: 'Municipality',
      address: 'Address',
      activity: 'Primary Activity',
      capital: 'Share Capital',
      source_url: 'Official Source',
      sources: 'Data Sources',
      methodology: 'Methodology',
      col_name: 'Name',
      col_role: 'Role',
      col_ownership: 'Ownership %',
      col_date: 'Date',
      col_title: 'Title',
      col_authority: 'Authority',
      col_value: 'Value (EUR)',
      col_source: 'Source',
      col_headline: 'Headline',
      col_sentiment: 'Sentiment',
      col_severity: 'Severity',
      col_subject: 'Subject',
      col_dataset: 'Dataset',
      col_match_score: 'Match',
      contracts: 'Contracts',
      total_value: 'Total Value',
      largest: 'Largest',
      average: 'Average',
      sentiment_dist: 'Sentiment Distribution',
      positive: 'Positive',
      neutral: 'Neutral',
      negative: 'Negative',
      no_owners: 'No ownership data available — flagged as data gap.',
      no_procurement: 'No procurement records found.',
      no_news: 'No media coverage identified.',
      page: 'Page',
      of: 'of',
      confidential_footer: (name: string) => `CONFIDENTIAL — Prepared for ${name}`,
    },
    sources_list: [
      'ARBK — Kosovo Business Registration Agency (arbk.rks-gov.net)',
      'e-Prokurimi — Public Procurement (e-prokurimi.rks-gov.net)',
      'OpenSanctions API (api.opensanctions.org) — EU/UN/UK/OFAC consolidated lists',
      'Supreme Court of Kosovo (supreme.gjyqesori-rks.org)',
      'Kosovo Open Data Portal (opendata.rks-gov.net)',
      'Major Kosovo media: Koha, Gazeta Express, Prishtina Insight, Zëri',
    ],
    methodology_text: 'The composite risk score is calculated as a weighted sum across six factors: registry status (35%), operating history (15%), capital adequacy (15%), ownership transparency (15%), procurement patterns (10%), and media sentiment (10%). Each factor is independently verifiable via the linked source URLs.',
    sample_disclaimer: 'This is a SAMPLE. Live reports include your name as the recipient and contain no watermark.',
  },
  sq: {
    report_title: 'INTELIGJENCA AFARISTE',
    report_subtitle: 'RAPORT',
    tagline_basic: 'Raport Verifikimi',
    tagline_standard: 'Raport Shqyrtimi i Rrezikut',
    tagline_comprehensive: 'Vlerësim i Plotë',
    risk: 'RREZIK',
    score: 'Pikët',
    order_number: 'Numri i Porosisë',
    date_issued: 'Data e Lëshimit',
    prepared_for: 'Përgatitur për',
    report_tier: 'Niveli',
    confidential_cover: (name: string) => `KONFIDENCIALE — Përgatitur ekskluzivisht për ${name}. I patransferueshëm.`,
    b_snapshot: 'Verifikim i Kompanisë',
    b_facts: 'Faktet e Verifikuara (Regjistri ARBK)',
    b_status_label: 'Statusi i Regjistrimit',
    b_what_this_means: 'Çfarë përfshin ky raport',
    b_basic_explanation: 'Ky është një raport bazë verifikimi. Konfirmon statusin e regjistrimit, formën ligjore, adresën dhe personat e autorizuar kundrejt regjistrit zyrtar të ARBK. Për histori prokurimi, shqyrtim mediatik dhe komentar analisti, përmirësoni në Standard ose Comprehensive.',
    s_procurement: 'Aktiviteti i Prokurimit',
    s_news: 'Shqyrtim Mediatik',
    s_analyst_brief: 'Përmbledhje e Analistit',
    s_standard_explanation: 'Ky raport Standard shton historinë e prokurimit (kontratat e fituara nga qeveria), shqyrtimin e sentimentit në mediat kryesore të Kosovës dhe një përmbledhje të shkruar nga analisti. Për vlerësim AI të rrezikut, shqyrtim sanksionesh, regjistra gjyqësorë dhe krahasim me të ngjashmit, përmirësoni në Comprehensive.',
    c_risk_breakdown: 'Ndarja e Pikëve të Rrezikut',
    c_full_narrative: 'Përmbledhja e Rrezikut me AI',
    c_flags: 'Shqetësimet e Identifikuara',
    c_sanctions: 'Shqyrtimi i Sanksioneve & PEP',
    c_court: 'Regjistra Gjyqësorë & Procese',
    c_peer: 'Krahasim me të Ngjashmit',
    c_history: 'Historia e Pikëve të Rrezikut',
    c_recommendations: 'Rekomandime Veprimi',
    c_glossary: 'Fjalor & Metodologji',
    sanctions_clear: 'Nuk u gjetën përputhje sanksionesh ose PEP për personat e shqyrtuar në bazën e konsoliduar të OpenSanctions.',
    sanctions_screened_via: 'Shqyrtuar përmes OpenSanctions API (api.opensanctions.org) që përmbledh listat e sanksioneve të BE/OKB/MB/OFAC dhe regjistrat e PEP-ve.',
    court_clear: 'Nuk u gjetën regjistra gjyqësorë publikë në bulletinin e Gjykatës Supreme të Kosovës.',
    court_searched_at: 'Kërkuar në: https://supreme.gjyqesori-rks.org',
    peer_intro: 'Kompania subjekt krahasohet me popullatën e kompanive aktive të indeksuara në platformë.',
    no_history: 'Pa vlerësime të mëparshme në regjistër — ky është vlerësimi i parë.',
    common: {
      profile: 'Profili i Kompanisë',
      ownership: 'Struktura e Pronësisë',
      name: 'Emri i Regjistruar',
      reg_num: 'Numri i Regjistrimit',
      legal_form: 'Forma Ligjore',
      status: 'Statusi',
      reg_date: 'Data e Regjistrimit',
      age: 'Mosha Operative',
      years: 'vite',
      municipality: 'Komuna',
      address: 'Adresa',
      activity: 'Veprimtaria Kryesore',
      capital: 'Kapitali Themelor',
      source_url: 'Burimi Zyrtar',
      sources: 'Burimet e të Dhënave',
      methodology: 'Metodologjia',
      col_name: 'Emri',
      col_role: 'Roli',
      col_ownership: 'Pronësia %',
      col_date: 'Data',
      col_title: 'Titulli',
      col_authority: 'Autoriteti',
      col_value: 'Vlera (EUR)',
      col_source: 'Burimi',
      col_headline: 'Titulli',
      col_sentiment: 'Sentimenti',
      col_severity: 'Ashpërsia',
      col_subject: 'Subjekti',
      col_dataset: 'Baza',
      col_match_score: 'Përputhja',
      contracts: 'Kontrata',
      total_value: 'Vlera Totale',
      largest: 'Më e madhja',
      average: 'Mesatare',
      sentiment_dist: 'Shpërndarja e Sentimentit',
      positive: 'Pozitiv',
      neutral: 'Neutral',
      negative: 'Negativ',
      no_owners: 'Pa të dhëna pronësie — boshllëk i të dhënave.',
      no_procurement: 'Pa regjistra prokurimi.',
      no_news: 'Pa mbulim mediatik.',
      page: 'Faqe',
      of: 'nga',
      confidential_footer: (name: string) => `KONFIDENCIALE — Përgatitur për ${name}`,
    },
    sources_list: [
      'ARBK — Agjencia e Regjistrimit të Bizneseve të Kosovës (arbk.rks-gov.net)',
      'e-Prokurimi — Prokurimi Publik (e-prokurimi.rks-gov.net)',
      'OpenSanctions API (api.opensanctions.org) — listat e konsoliduara BE/OKB/MB/OFAC',
      'Gjykata Supreme e Kosovës (supreme.gjyqesori-rks.org)',
      'Portali i të Dhënave të Hapura të Kosovës (opendata.rks-gov.net)',
      'Mediat kryesore: Koha, Gazeta Express, Prishtina Insight, Zëri',
    ],
    methodology_text: 'Pikët e kombinuara të rrezikut llogariten si shumë e ponderuar e gjashtë faktorëve: statusi i regjistrit (35%), historia operative (15%), mjaftueshmëria e kapitalit (15%), transparenca e pronësisë (15%), modelet e prokurimit (10%), dhe sentimenti mediatik (10%). Çdo faktor është i verifikueshëm përmes URL-ve të burimit.',
    sample_disclaimer: 'Ky është një MOSTËR. Raportet reale përfshijnë emrin tuaj dhe nuk përmbajnë filigran.',
  },
};

// ============== CHART HELPERS ==============
function drawStatCard(doc: any, x: number, y: number, w: number, h: number, label: string, value: string, color = '#0f172a') {
  doc.rect(x, y, w, h).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(label.toUpperCase(), x + 8, y + 7, { width: w - 16 });
  doc.fillColor(color).fontSize(13).font('Helvetica-Bold').text(value, x + 8, y + 22, { width: w - 16 });
}

function drawGauge(doc: any, x: number, y: number, w: number, score: number, color: string) {
  doc.rect(x, y, w, 12).fill('#e2e8f0');
  doc.rect(x, y, Math.round(w * score / 100), 12).fill(color);
  doc.fillColor('#64748b').fontSize(7).font('Helvetica')
    .text('0', x, y + 16).text('25', x + w / 4 - 5, y + 16)
    .text('50', x + w / 2 - 5, y + 16).text('75', x + 3 * w / 4 - 5, y + 16)
    .text('100', x + w - 12, y + 16);
}

function drawBarChart(doc: any, x: number, y: number, w: number, h: number, data: Array<{ label: string; value: number }>, fmt: (v: number) => string) {
  if (data.length === 0) return;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(60, (w - 40) / data.length - 8);
  const chartH = h - 35;
  doc.rect(x, y, w, h).fill('#fafafa').strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  for (let i = 1; i <= 4; i++) {
    const ly = y + 10 + (chartH * i / 4);
    doc.moveTo(x + 30, ly).lineTo(x + w - 10, ly).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
  }
  data.forEach((d, i) => {
    const barH = (d.value / max) * chartH;
    const bx = x + 35 + i * ((w - 50) / data.length);
    const by = y + 10 + (chartH - barH);
    doc.rect(bx, by, barW, barH).fill('#0ea5e9');
    doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold').text(fmt(d.value), bx, by - 9, { width: barW, align: 'center' });
    doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(d.label, bx - 5, y + h - 16, { width: barW + 10, align: 'center' });
  });
  doc.lineWidth(1);
}

function drawHorizontalBars(doc: any, x: number, y: number, w: number, data: Array<{ label: string; value: number; color?: string }>, fmt: (v: number) => string): number {
  if (data.length === 0) return y;
  const max = Math.max(...data.map((d) => d.value), 1);
  const rowH = 22;
  const labelW = 180;
  const barAreaW = w - labelW - 80;
  data.forEach((d, i) => {
    const ry = y + i * rowH;
    doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(d.label, x, ry + 5, { width: labelW - 10, ellipsis: true });
    const barW = Math.max(2, (d.value / max) * barAreaW);
    doc.rect(x + labelW, ry + 3, barW, 14).fill(d.color || '#0ea5e9');
    doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold').text(fmt(d.value), x + labelW + barAreaW + 5, ry + 6, { width: 70, align: 'right' });
  });
  return y + data.length * rowH;
}

function drawStackedBar(doc: any, x: number, y: number, w: number, h: number, segments: Array<{ label: string; value: number; color: string }>): number {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) { doc.rect(x, y, w, h).fill('#f1f5f9'); return y + h + 20; }
  let cx = x;
  for (const seg of segments) {
    const segW = (seg.value / total) * w;
    doc.rect(cx, y, segW, h).fill(seg.color);
    if (segW > 30) doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(`${seg.value}`, cx, y + h / 2 - 5, { width: segW, align: 'center' });
    cx += segW;
  }
  let lx = x;
  const ly = y + h + 8;
  for (const seg of segments) {
    doc.rect(lx, ly, 10, 10).fill(seg.color);
    doc.fillColor('#374151').fontSize(8).font('Helvetica').text(`${seg.label} (${seg.value})`, lx + 14, ly + 2);
    lx += 130;
  }
  return ly + 22;
}

function drawLineChart(doc: any, x: number, y: number, w: number, h: number, points: Array<{ label: string; value: number }>) {
  if (points.length === 0) return;
  doc.rect(x, y, w, h).fill('#fafafa').strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  const max = Math.max(...points.map((p) => p.value), 100);
  const chartH = h - 30;
  const stepX = (w - 30) / Math.max(1, points.length - 1);
  // draw line
  let prevX = x + 15, prevY = y + 10 + chartH - (points[0].value / max) * chartH;
  doc.moveTo(prevX, prevY);
  points.forEach((p, i) => {
    const px = x + 15 + i * stepX;
    const py = y + 10 + chartH - (p.value / max) * chartH;
    if (i > 0) doc.lineTo(px, py);
    prevX = px; prevY = py;
  });
  doc.strokeColor('#9333ea').lineWidth(2).stroke();
  // dots and labels
  points.forEach((p, i) => {
    const px = x + 15 + i * stepX;
    const py = y + 10 + chartH - (p.value / max) * chartH;
    doc.circle(px, py, 3).fill('#9333ea');
    doc.fillColor('#1f2937').fontSize(7).font('Helvetica-Bold').text(`${p.value}`, px - 10, py - 14, { width: 20, align: 'center' });
    doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(p.label, px - 25, y + h - 14, { width: 50, align: 'center' });
  });
  doc.lineWidth(1);
}

function sectionTitle(doc: any, title: string, accent: string = '#0f172a', y = 50) {
  doc.fillColor(accent).fontSize(16).font('Helvetica-Bold').text(title, 50, y);
  doc.moveTo(50, y + 25).lineTo(545, y + 25).strokeColor(accent).lineWidth(1.5).stroke();
  doc.y = y + 40;
}

function tableHeader(doc: any, columns: Array<{ label: string; width: number; align?: 'left' | 'right' | 'center' }>) {
  const startY = doc.y;
  let x = 50;
  for (const col of columns) {
    doc.rect(x, startY, col.width, 22).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(col.label, x + 5, startY + 7, { width: col.width - 10, align: col.align || 'left' });
    x += col.width;
  }
  doc.y = startY + 23;
}

function tableRow(doc: any, cells: Array<{ text: string; width: number; align?: 'left' | 'right' | 'center'; color?: string; bold?: boolean }>, alt = false) {
  const startY = doc.y;
  const rowH = 22;
  if (alt) doc.rect(50, startY, cells.reduce((s, c) => s + c.width, 0), rowH).fill('#f8fafc');
  let x = 50;
  for (const cell of cells) {
    doc.fillColor(cell.color || '#111827').fontSize(9).font(cell.bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(cell.text, x + 5, startY + 7, { width: cell.width - 10, align: cell.align || 'left', ellipsis: true });
    x += cell.width;
  }
  doc.moveTo(50, startY + rowH).lineTo(50 + cells.reduce((s, c) => s + c.width, 0), startY + rowH).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  doc.y = startY + rowH + 1;
}

function formatDate(d: any): string {
  if (!d) return '—';
  try {
    if (typeof d === 'string') return d.split('T')[0];
    return new Date(d).toISOString().split('T')[0];
  } catch { return String(d); }
}

// ============== MAIN PDF ==============
export async function generatePDF(data: ReportData, outputPath: string): Promise<string> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4', margin: 50, bufferPages: true,
        info: { Title: `KosovaIntel Report ${data.order_number}`, Author: 'KosovaIntel' },
      });
      const stream = fs.createWriteStream(outputPath);
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
      doc.pipe(stream);

      const lang: 'en' | 'sq' = data.lang === 'sq' ? 'sq' : 'en';
      const L = LABELS[lang];
      const C = L.common;
      const tier = data.tier || 'comprehensive';
      const isBasic = tier === 'basic';
      const isStandard = tier === 'standard';
      const isComprehensive = tier === 'comprehensive';
      const c = data.company || {};
      const persons = data.persons || [];
      const proc = data.procurement || [];
      const news = data.news || [];
      const rating = data.analyst_risk_rating || 'medium';
      const score = data.ai_risk_score ?? 50;
      const ratingColor = RATING_COLORS[rating] || '#6b7280';
      const tierColor = TIER_COLORS[tier];
      const date = new Date().toLocaleDateString(lang === 'sq' ? 'sq-AL' : 'en-GB');
      const totalProc = proc.reduce((s: number, p: any) => s + (parseFloat(p.contract_value_eur) || 0), 0);

      const tagline = isBasic ? L.tagline_basic : isStandard ? L.tagline_standard : L.tagline_comprehensive;

      // ===================== COVER =====================
      doc.rect(0, 0, doc.page.width, 230).fill('#0f172a');
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('KOSOVAINTEL', 50, 70, { characterSpacing: 4 });
      doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text(L.report_title, 50, 95).text(L.report_subtitle, 50, 128);
      doc.fillColor(tierColor).fontSize(11).font('Helvetica-Bold').text(tagline.toUpperCase(), 50, 175, { characterSpacing: 2 });

      doc.rect(420, 70, 130, 28).fill(tierColor);
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(tier.toUpperCase(), 420, 79, { width: 130, align: 'center' });

      doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold').text(c.name || data.order_number, 50, 270, { width: 495 });

      doc.rect(50, 320, 160, 38).fill(ratingColor);
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(`${rating.toUpperCase()} ${L.risk}`, 50, 333, { width: 160, align: 'center' });
      doc.fillColor('#374151').fontSize(11).font('Helvetica').text(`${L.score}: ${score}/100`, 220, 333);

      doc.fillColor('#475569').fontSize(10).font('Helvetica')
        .text(`${L.order_number}: ${data.order_number}`, 50, 400)
        .text(`${L.date_issued}: ${date}`, 50, 418)
        .text(`${L.prepared_for}: ${data.client_name}`, 50, 436)
        .text(`${L.report_tier}: ${tier.toUpperCase()}`, 50, 454);

      // What this report includes
      doc.rect(50, 500, 495, 100).fill('#f8fafc').strokeColor(tierColor).lineWidth(2).stroke();
      doc.fillColor(tierColor).fontSize(10).font('Helvetica-Bold').text(L.b_what_this_means, 60, 510);
      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      const explanation = isBasic ? L.b_basic_explanation : isStandard ? L.s_standard_explanation : L.methodology_text;
      doc.text(explanation, 60, 528, { width: 475 });
      doc.lineWidth(1);

      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Oblique').text(L.confidential_cover(data.client_name), 50, 740, { width: 495, align: 'center' });

      if (data.is_sample) {
        doc.save();
        doc.rotate(-30, { origin: [doc.page.width / 2, doc.page.height / 2] });
        doc.fillColor('#fecaca').opacity(0.5).fontSize(120).font('Helvetica-Bold').text('SAMPLE', 0, doc.page.height / 2 - 70, { width: doc.page.width, align: 'center' });
        doc.opacity(1).restore();
      }

      // ===================== SECTION 1: VERIFICATION SNAPSHOT (ALL TIERS, but content differs) =====================
      doc.addPage();
      sectionTitle(doc, '1. ' + L.b_snapshot, tierColor);

      // Stat cards (always)
      const cardW = 117, cardH = 50;
      const ageYears = c.registration_date ? ((Date.now() - new Date(c.registration_date).getTime()) / (365 * 24 * 3600 * 1000)) : 0;
      const cards = [
        { label: C.status, value: (c.status || '—').toUpperCase(), color: c.status === 'active' ? '#16a34a' : '#dc2626' },
        { label: C.age, value: c.registration_date ? `${ageYears.toFixed(0)} ${C.years}` : '—' },
        { label: C.capital, value: c.share_capital_eur ? `€${(Number(c.share_capital_eur) / 1000000).toFixed(2)}M` : '—' },
        { label: L.b_status_label, value: c.registration_number || '—' },
      ];
      cards.forEach((card, i) => drawStatCard(doc, 50 + i * (cardW + 5), 90, cardW, cardH, card.label, card.value, card.color || '#0f172a'));

      doc.y = 160;
      if (isBasic) {
        // BASIC: Just facts, no narrative
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(L.b_facts, 50, doc.y);
        doc.y += 18;
        doc.fillColor('#475569').fontSize(9).font('Helvetica').text(L.b_basic_explanation, 50, doc.y, { width: 495 });
      } else {
        // STANDARD + COMPREHENSIVE: Risk gauge + narrative
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`Risk: ${score} / 100`, 50, doc.y);
        doc.moveDown(0.5);
        drawGauge(doc, 50, doc.y, 495, score, ratingColor);
        doc.y += 40;

        const fullNarrative = data.ai_risk_narrative || '';
        const paragraphs = fullNarrative.split('\n\n');
        const text = isStandard ? paragraphs.slice(0, 2).join('\n\n') : fullNarrative;
        doc.fillColor('#1f2937').fontSize(10).font('Helvetica').text(text, 50, doc.y, { width: 495, align: 'justify' });
      }

      // ===================== SECTION 2: COMPANY PROFILE (ALL) =====================
      doc.addPage();
      sectionTitle(doc, '2. ' + C.profile, tierColor);

      const fields: Array<[string, string]> = [
        [C.name, c.name || '—'],
        [C.reg_num, c.registration_number || '—'],
        [C.legal_form, c.legal_form || '—'],
        [C.status, (c.status || 'unknown').toUpperCase()],
        [C.reg_date, formatDate(c.registration_date)],
        [C.municipality, c.municipality || '—'],
        [C.address, c.address || '—'],
        [C.activity, c.primary_activity_description || '—'],
        [C.capital, c.share_capital_eur ? `€ ${Number(c.share_capital_eur).toLocaleString()}` : '—'],
        [C.source_url, c.source_url || '—'],
      ];
      for (const [label, value] of fields) {
        if (doc.y > 720) doc.addPage();
        const rowY = doc.y;
        doc.rect(50, rowY, 150, 24).fill('#f1f5f9');
        doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text(label, 55, rowY + 8, { width: 145 });
        doc.fillColor('#111827').fontSize(9).font('Helvetica').text(value, 205, rowY + 8, { width: 340 });
        doc.y = rowY + 25;
      }

      // ===================== SECTION 3: OWNERSHIP (ALL) =====================
      doc.addPage();
      sectionTitle(doc, '3. ' + C.ownership, tierColor);
      if (persons.length === 0) {
        doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique').text(C.no_owners, 50, doc.y, { width: 495 });
      } else {
        const cols = [{ label: C.col_name, width: 220 }, { label: C.col_role, width: 150 }, { label: C.col_ownership, width: 125, align: 'right' as const }];
        tableHeader(doc, cols);
        persons.forEach((p, i) => {
          if (doc.y > 720) { doc.addPage(); tableHeader(doc, cols); }
          tableRow(doc, [
            { text: p.full_name || '—', width: 220 },
            { text: p.role || '—', width: 150 },
            { text: p.ownership_percent ? `${p.ownership_percent}%` : '—', width: 125, align: 'right' },
          ], i % 2 === 1);
        });
      }

      // ============================================================
      // ============== STANDARD + COMPREHENSIVE ONLY ===============
      // ============================================================
      if (!isBasic) {
        // ===================== SECTION 4: PROCUREMENT =====================
        doc.addPage();
        sectionTitle(doc, '4. ' + L.s_procurement, tierColor);

        if (proc.length === 0) {
          doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique').text(C.no_procurement, 50, doc.y);
        } else {
          const maxProc = Math.max(...proc.map((p: any) => parseFloat(p.contract_value_eur) || 0));
          const avgProc = totalProc / proc.length;
          drawStatCard(doc, 50, doc.y, 117, 50, C.contracts, String(proc.length));
          drawStatCard(doc, 172, doc.y, 117, 50, C.total_value, `€${(totalProc / 1000000).toFixed(2)}M`);
          drawStatCard(doc, 294, doc.y, 117, 50, C.largest, `€${(maxProc / 1000).toFixed(0)}k`);
          drawStatCard(doc, 416, doc.y, 129, 50, C.average, `€${(avgProc / 1000).toFixed(0)}k`);
          doc.y += 65;

          // Bar by year
          const byYear: Record<string, number> = {};
          for (const p of proc) {
            const year = p.award_date ? formatDate(p.award_date).slice(0, 4) : '—';
            byYear[year] = (byYear[year] || 0) + (parseFloat(p.contract_value_eur) || 0);
          }
          const yearData = Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
          if (yearData.length > 0) {
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`Contracts by year`, 50, doc.y); doc.y += 15;
            drawBarChart(doc, 50, doc.y, 495, 130, yearData, (v) => `€${(v / 1000).toFixed(0)}k`);
            doc.y += 140;
          }

          if (doc.y > 600) doc.addPage();
          // Top authorities
          const byAuth: Record<string, number> = {};
          for (const p of proc) {
            const a = p.contracting_authority || '—';
            byAuth[a] = (byAuth[a] || 0) + (parseFloat(p.contract_value_eur) || 0);
          }
          const topAuth = Object.entries(byAuth).sort(([, a], [, b]) => b - a).slice(0, 5).map(([label, value]) => ({ label, value }));
          if (topAuth.length > 0) {
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`Top contracting authorities`, 50, doc.y); doc.y += 15;
            doc.y = drawHorizontalBars(doc, 50, doc.y, 495, topAuth, (v) => `€${(v / 1000).toFixed(0)}k`);
            doc.y += 15;
          }

          if (doc.y > 600) doc.addPage();
          const pcols = [
            { label: C.col_date, width: 65 },
            { label: C.col_title, width: 200 },
            { label: C.col_authority, width: 140 },
            { label: C.col_value, width: 90, align: 'right' as const },
          ];
          tableHeader(doc, pcols);
          proc.slice(0, 30).forEach((p, i) => {
            if (doc.y > 720) { doc.addPage(); tableHeader(doc, pcols); }
            tableRow(doc, [
              { text: formatDate(p.award_date), width: 65 },
              { text: p.tender_title || '—', width: 200 },
              { text: p.contracting_authority || '—', width: 140 },
              { text: Number(p.contract_value_eur || 0).toLocaleString(), width: 90, align: 'right' },
            ], i % 2 === 1);
          });
        }

        // ===================== SECTION 5: NEWS =====================
        doc.addPage();
        sectionTitle(doc, '5. ' + L.s_news, tierColor);
        if (news.length === 0) {
          doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique').text(C.no_news, 50, doc.y);
        } else {
          const pos = news.filter((n: any) => n.sentiment === 'positive').length;
          const neu = news.filter((n: any) => n.sentiment === 'neutral' || !n.sentiment).length;
          const neg = news.filter((n: any) => n.sentiment === 'negative').length;
          doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(C.sentiment_dist, 50, doc.y); doc.y += 15;
          doc.y = drawStackedBar(doc, 50, doc.y, 495, 28, [
            { label: C.positive, value: pos, color: '#16a34a' },
            { label: C.neutral, value: neu, color: '#94a3b8' },
            { label: C.negative, value: neg, color: '#dc2626' },
          ]);
          doc.y += 10;
          const ncols = [
            { label: C.col_date, width: 65 },
            { label: C.col_headline, width: 240 },
            { label: C.col_source, width: 100 },
            { label: C.col_sentiment, width: 90, align: 'center' as const },
          ];
          tableHeader(doc, ncols);
          news.forEach((n: any, i: number) => {
            if (doc.y > 720) { doc.addPage(); tableHeader(doc, ncols); }
            const sc = n.sentiment === 'positive' ? '#16a34a' : n.sentiment === 'negative' ? '#dc2626' : '#6b7280';
            tableRow(doc, [
              { text: formatDate(n.published_at), width: 65 },
              { text: n.headline || '—', width: 240 },
              { text: n.source_name || '—', width: 100 },
              { text: (n.sentiment || '—').toUpperCase(), width: 90, align: 'center', color: sc, bold: true },
            ], i % 2 === 1);
          });
        }

        // ===================== SECTION 6: ANALYST BRIEF (Standard) or to come (Comprehensive) =====================
        if (isStandard) {
          doc.addPage();
          sectionTitle(doc, '6. ' + L.s_analyst_brief, tierColor);
          doc.fillColor('#1f2937').fontSize(10).font('Helvetica').text(data.analyst_summary || '', 50, doc.y, { width: 495, align: 'justify' });
          doc.moveDown();
          if (data.analyst_recommendations) {
            const recY = doc.y;
            doc.rect(50, recY, 495, 90).fill('#eff6ff').strokeColor('#bfdbfe').stroke();
            doc.rect(50, recY, 4, 90).fill('#2563eb');
            doc.fillColor('#1e3a8a').fontSize(10).font('Helvetica').text(data.analyst_recommendations, 65, recY + 10, { width: 470, align: 'justify' });
            doc.y = recY + 100;
          }
        }
      }

      // ============================================================
      // ================== COMPREHENSIVE ONLY ======================
      // ============================================================
      if (isComprehensive) {
        // ===================== SECTION 6: RISK BREAKDOWN =====================
        doc.addPage();
        sectionTitle(doc, '6. ' + L.c_risk_breakdown, tierColor);

        const negativeNews = news.filter((n: any) => n.sentiment === 'negative').length;
        const statusScore = (c.status === 'active') ? 5 : 35;
        const ageScore = ageYears < 1 ? 25 : ageYears < 3 ? 10 : 0;
        const capScore = !c.share_capital_eur ? 10 : Number(c.share_capital_eur) < 1000 ? 20 : 0;
        const ownScore = persons.length === 0 ? 20 : 0;
        const maxC = proc.length > 0 ? Math.max(...proc.map((p: any) => parseFloat(p.contract_value_eur) || 0)) : 0;
        const procScore = (maxC > Number(c.share_capital_eur || 1) * 100) ? 15 : 0;
        const newsScore = Math.min(20, negativeNews * 8);
        const components = [
          { label: 'Registry status (max 35)', value: statusScore, color: statusScore > 20 ? '#dc2626' : '#16a34a' },
          { label: 'Operating history (max 25)', value: ageScore, color: ageScore > 15 ? '#dc2626' : ageScore > 5 ? '#f59e0b' : '#16a34a' },
          { label: 'Capital adequacy (max 20)', value: capScore, color: capScore > 15 ? '#dc2626' : '#16a34a' },
          { label: 'Ownership transparency (max 25)', value: ownScore, color: ownScore > 15 ? '#dc2626' : '#16a34a' },
          { label: 'Procurement patterns (max 15)', value: procScore, color: procScore > 10 ? '#f59e0b' : '#16a34a' },
          { label: 'Media sentiment (max 20)', value: newsScore, color: newsScore > 10 ? '#dc2626' : newsScore > 5 ? '#f59e0b' : '#16a34a' },
        ];
        doc.y = drawHorizontalBars(doc, 50, doc.y, 495, components, (v) => `+${v} pts`);
        doc.y += 20;

        // Flags
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(L.c_flags, 50, doc.y);
        doc.y += 12;
        const flags = Array.isArray(data.analyst_flags) ? data.analyst_flags : [];
        if (flags.length === 0) {
          doc.fillColor('#16a34a').fontSize(10).font('Helvetica').text('✓  No specific risk flags identified.', 50, doc.y);
          doc.y += 18;
        } else {
          for (const f of flags as any[]) {
            if (doc.y > 720) doc.addPage();
            const flagText = typeof f === 'string' ? f : f.flag;
            const flagDetail = typeof f === 'object' ? f.detail : '';
            const severity = typeof f === 'object' ? f.severity : 'medium';
            const sc = severity === 'high' ? '#dc2626' : severity === 'medium' ? '#f59e0b' : '#fbbf24';
            const sy = doc.y;
            doc.rect(50, sy, 5, 38).fill(sc);
            doc.rect(55, sy, 490, 38).fill('#fffbeb').strokeColor('#fef3c7').stroke();
            doc.fillColor('#92400e').fontSize(10).font('Helvetica-Bold').text(flagText, 65, sy + 6, { width: 380 });
            doc.fillColor(sc).fontSize(8).font('Helvetica-Bold').text(severity.toUpperCase(), 460, sy + 6, { width: 75, align: 'right' });
            if (flagDetail) doc.fillColor('#374151').fontSize(8).font('Helvetica').text(flagDetail, 65, sy + 20, { width: 470 });
            doc.y = sy + 45;
          }
        }

        // ===================== SECTION 7: SANCTIONS & PEP =====================
        doc.addPage();
        sectionTitle(doc, '7. ' + L.c_sanctions, tierColor);
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Oblique').text(L.sanctions_screened_via, 50, doc.y, { width: 495 });
        doc.moveDown();

        const sanc = data.sanctions_results || [];
        const anyHits = sanc.some((s) => s.hits && s.hits.length > 0);
        if (!anyHits) {
          doc.rect(50, doc.y, 495, 50).fill('#f0fdf4').strokeColor('#86efac').stroke();
          doc.fillColor('#15803d').fontSize(11).font('Helvetica-Bold').text('✓  CLEAR', 60, doc.y + 10);
          doc.fillColor('#166534').fontSize(9).font('Helvetica').text(L.sanctions_clear, 60, doc.y + 28, { width: 475 });
          doc.y += 60;
        } else {
          const scols = [
            { label: C.col_subject, width: 180 },
            { label: C.col_dataset, width: 200 },
            { label: C.col_match_score, width: 115, align: 'right' as const },
          ];
          tableHeader(doc, scols);
          for (const s of sanc) {
            for (const h of s.hits || []) {
              if (doc.y > 720) { doc.addPage(); tableHeader(doc, scols); }
              tableRow(doc, [
                { text: s.person, width: 180, bold: true, color: '#dc2626' },
                { text: (h.datasets || []).slice(0, 2).join(', ') || h.schema, width: 200 },
                { text: `${Math.round((h.score || 0) * 100)}%`, width: 115, align: 'right' },
              ]);
            }
          }
        }
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Oblique').text(`Persons screened: ${sanc.length}`, 50, doc.y + 10);

        // ===================== SECTION 8: COURT RECORDS =====================
        doc.addPage();
        sectionTitle(doc, '8. ' + L.c_court, tierColor);
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Oblique').text(L.court_searched_at, 50, doc.y, { width: 495 });
        doc.moveDown();
        const cases = data.court_results || [];
        if (cases.length === 0) {
          doc.rect(50, doc.y, 495, 50).fill('#f0fdf4').strokeColor('#86efac').stroke();
          doc.fillColor('#15803d').fontSize(11).font('Helvetica-Bold').text('✓  CLEAR', 60, doc.y + 10);
          doc.fillColor('#166534').fontSize(9).font('Helvetica').text(L.court_clear, 60, doc.y + 28, { width: 475 });
          doc.y += 60;
        } else {
          for (const cs of cases) {
            if (doc.y > 700) doc.addPage();
            const sy = doc.y;
            doc.rect(50, sy, 495, 50).fill('#fef2f2').strokeColor('#fecaca').stroke();
            doc.fillColor('#991b1b').fontSize(10).font('Helvetica-Bold').text(cs.title || '—', 60, sy + 8, { width: 475 });
            doc.fillColor('#7f1d1d').fontSize(8).font('Helvetica').text((cs.excerpt || '').slice(0, 220), 60, sy + 24, { width: 475 });
            doc.y = sy + 58;
          }
        }

        // ===================== SECTION 9: PEER BENCHMARK =====================
        doc.addPage();
        sectionTitle(doc, '9. ' + L.c_peer, tierColor);
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Oblique').text(L.peer_intro, 50, doc.y, { width: 495 });
        doc.moveDown();

        if (data.peer_stats) {
          const ps = data.peer_stats;
          drawStatCard(doc, 50, doc.y, 158, 60, 'Peers analyzed', String(ps.sector_count));
          drawStatCard(doc, 213, doc.y, 158, 60, 'Capital percentile', `${ps.this_company?.capital_percentile ?? 0}th`);
          drawStatCard(doc, 376, doc.y, 169, 60, 'Procurement percentile', `${ps.this_company?.procurement_percentile ?? 0}th`);
          doc.y += 75;

          // Bar comparison
          const capital = Number(c.share_capital_eur) || 0;
          const procT = totalProc;
          doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Subject vs sector average', 50, doc.y); doc.y += 15;
          doc.y = drawHorizontalBars(doc, 50, doc.y, 495, [
            { label: 'Capital — Subject', value: capital, color: '#9333ea' },
            { label: 'Capital — Sector avg', value: ps.avg_capital, color: '#cbd5e1' },
            { label: 'Procurement — Subject', value: procT, color: '#9333ea' },
            { label: 'Procurement — Sector avg', value: ps.avg_procurement_value, color: '#cbd5e1' },
          ], (v) => `€${(v / 1000).toFixed(0)}k`);
          doc.y += 15;

          doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(
            `This company's operating age is ${ps.this_company?.age_vs_avg} (sector median: ${ps.median_age_years.toFixed(1)} years). ` +
            `Procurement participation rate: ${ps.avg_procurement_count.toFixed(1)} contracts on average across peers.`,
            50, doc.y, { width: 495 });
        } else {
          doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique').text('Peer data not available.', 50, doc.y);
        }

        // ===================== SECTION 10: RISK SCORE HISTORY =====================
        if (data.history && data.history.length > 0) {
          doc.addPage();
          sectionTitle(doc, '10. ' + L.c_history, tierColor);
          const points = data.history.map((h) => ({
            label: formatDate(h.created_at).slice(5),
            value: h.risk_score,
          }));
          drawLineChart(doc, 50, doc.y, 495, 160, points);
          doc.y += 175;
          doc.fillColor('#1f2937').fontSize(9).font('Helvetica')
            .text(`${points.length} assessments on file. Latest score: ${points[points.length - 1].value}.`, 50, doc.y);
        }

        // ===================== SECTION 11: RECOMMENDATIONS =====================
        doc.addPage();
        sectionTitle(doc, '11. ' + L.c_recommendations, tierColor);
        doc.fillColor('#1f2937').fontSize(10).font('Helvetica').text(data.analyst_summary || '', 50, doc.y, { width: 495, align: 'justify' });
        doc.moveDown();
        if (data.analyst_recommendations) {
          const recY = doc.y;
          doc.rect(50, recY, 495, 100).fill('#eff6ff').strokeColor('#bfdbfe').stroke();
          doc.rect(50, recY, 4, 100).fill('#2563eb');
          doc.fillColor('#1e3a8a').fontSize(10).font('Helvetica').text(data.analyst_recommendations, 65, recY + 10, { width: 470, align: 'justify' });
          doc.y = recY + 110;
        }
      }

      // ===================== FINAL SECTION: METHODOLOGY / SOURCES (ALL) =====================
      doc.addPage();
      const finalNum = isBasic ? '4.' : isStandard ? '7.' : '12.';
      sectionTitle(doc, finalNum + ' ' + C.methodology, tierColor);
      doc.fillColor('#1f2937').fontSize(10).font('Helvetica').text(L.methodology_text, 50, doc.y, { width: 495, align: 'justify' });
      doc.moveDown();
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(C.sources + ':', 50, doc.y); doc.y += 14;
      doc.fillColor('#374151').fontSize(9).font('Helvetica');
      for (const s of L.sources_list) {
        if (doc.y > 720) doc.addPage();
        doc.text(`• ${s}`, 50, doc.y, { width: 495 });
        doc.y += 14;
      }
      if (data.is_sample) {
        doc.moveDown();
        doc.rect(50, doc.y, 495, 35).fill('#fef2f2').strokeColor('#fecaca').stroke();
        doc.fillColor('#991b1b').fontSize(9).font('Helvetica-Bold').text(L.sample_disclaimer, 60, doc.y + 12, { width: 475, align: 'center' });
      }

      // Per-page footers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const oldBottom = (doc.page as any).margins.bottom;
        (doc.page as any).margins.bottom = 0;
        doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
          .text(`${C.confidential_footer(data.client_name)} — ${date}`, 50, doc.page.height - 30, { align: 'left', width: 400 })
          .text(`${C.page} ${i + 1} ${C.of} ${range.count}`, doc.page.width - 110, doc.page.height - 30, { align: 'right', width: 60 });
        (doc.page as any).margins.bottom = oldBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function renderReportHTML(): string {
  return '<html><body>Use generatePDF</body></html>';
}
