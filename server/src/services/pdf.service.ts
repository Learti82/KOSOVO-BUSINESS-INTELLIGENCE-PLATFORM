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
}

const RATING_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#b45309',
  high: '#ea580c',
  critical: '#dc2626',
};

const LABELS = {
  en: {
    report_title: 'BUSINESS INTELLIGENCE',
    report_subtitle: 'REPORT',
    tagline: 'Kosovo Due Diligence',
    risk: 'RISK',
    score: 'Score',
    order_number: 'Order Number',
    date_issued: 'Date Issued',
    prepared_for: 'Prepared for',
    report_tier: 'Report Tier',
    confidential_cover: (name: string) => `CONFIDENTIAL — This report has been prepared exclusively for ${name} and is not transferable. Information herein is based on publicly available data sources as of the date of issue.`,
    s_snapshot: 'Executive Snapshot',
    s_summary: 'Executive Summary',
    s_profile: 'Company Profile',
    s_ownership: 'Ownership Structure',
    s_procurement: 'Procurement Analysis',
    s_news: 'Media & News Screening',
    s_risk_analysis: 'Risk Analysis & Flags',
    s_analyst: 'Analyst Assessment',
    s_recommendations: 'Recommendations',
    s_methodology: 'Sources & Methodology',
    risk_score: 'Risk Score',
    risk_flags: 'Identified Risk Flags',
    data_gaps: 'Data Gaps',
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
    no_ownership: 'No ownership data found in public registry. This is flagged as a data gap.',
    col_name: 'Name',
    col_role: 'Role',
    col_ownership: 'Ownership %',
    col_date: 'Date',
    col_title: 'Contract Title',
    col_authority: 'Contracting Authority',
    col_value: 'Value (EUR)',
    col_sentiment: 'Sentiment',
    col_source: 'Source',
    col_headline: 'Headline',
    contracts: 'Contracts',
    total_value: 'Total Value',
    largest_contract: 'Largest Contract',
    avg_value: 'Average Contract',
    contracts_by_year: 'Contracts by Year',
    top_authorities: 'Top Contracting Authorities',
    no_procurement: 'No government procurement contracts found in public records.',
    sentiment_dist: 'Sentiment Distribution',
    no_media: 'No significant media presence found.',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    severity: 'Severity',
    flag_detail: 'Detail',
    no_flags: 'No specific risk flags identified.',
    risk_components: 'Risk Score Components',
    risk_status: 'Status & Compliance',
    risk_age: 'Operating History',
    risk_capital: 'Capital Adequacy',
    risk_ownership: 'Ownership Transparency',
    risk_procurement: 'Procurement Patterns',
    risk_media: 'Media Sentiment',
    no_analyst: 'No analyst summary provided.',
    confidential_footer: (name: string) => `CONFIDENTIAL — Prepared exclusively for ${name}`,
    page: 'Page',
    page_of: 'of',
    no_narrative: 'No narrative generated yet.',
    sources: [
      'ARBK — Kosovo Business Registration Agency (https://arbk.rks-gov.net)',
      'e-Prokurimi — Kosovo Public Procurement (https://e-prokurimi.rks-gov.net)',
      'Open Procurement Kosovo (https://www.prokurimihapur.org)',
      'Kosovo Open Data Portal (https://opendata.rks-gov.net)',
      'Koha (https://www.koha.net), Gazeta Express (https://www.gazetaexpress.com)',
      'Prishtina Insight (https://prishtinainsight.com), Zëri (https://zeri.info)',
    ],
    methodology: 'This report combines data from public Kosovo government registries, the Open Contracting Data Standard (OCDS) procurement feed, and systematic media screening across the four largest Kosovo news outlets. The risk score is calculated as a weighted composite across six factors: registry status (35% weight), operating history (15%), capital adequacy (15%), ownership transparency (15%), procurement patterns (10%), and media sentiment (10%). Each factor is independently verifiable via the linked source URLs.',
    sample_disclaimer: 'This is a SAMPLE report. Live reports include your name as the named recipient and contain no watermark.',
    contracts_won: 'contracts won',
    contracts_count: (n: number) => `${n} contract${n === 1 ? '' : 's'}`,
  },
  sq: {
    report_title: 'INTELIGJENCA AFARISTE',
    report_subtitle: 'RAPORT',
    tagline: 'Vlerësim i Kujdesshëm i Kosovës',
    risk: 'RREZIK',
    score: 'Pikët',
    order_number: 'Numri i Porosisë',
    date_issued: 'Data e Lëshimit',
    prepared_for: 'Përgatitur për',
    report_tier: 'Niveli i Raportit',
    confidential_cover: (name: string) => `KONFIDENCIALE — Ky raport është përgatitur ekskluzivisht për ${name} dhe nuk është i transferueshëm. Informacioni bazohet në burime publike të të dhënave deri në datën e lëshimit.`,
    s_snapshot: 'Pamje e Shpejtë Ekzekutive',
    s_summary: 'Përmbledhja Ekzekutive',
    s_profile: 'Profili i Kompanisë',
    s_ownership: 'Struktura e Pronësisë',
    s_procurement: 'Analiza e Prokurimit',
    s_news: 'Shqyrtimi i Medias & Lajmeve',
    s_risk_analysis: 'Analiza e Rrezikut & Shqetësimet',
    s_analyst: 'Vlerësimi i Analistit',
    s_recommendations: 'Rekomandime',
    s_methodology: 'Burimet & Metodologjia',
    risk_score: 'Pikët e Rrezikut',
    risk_flags: 'Shqetësimet e Identifikuara',
    data_gaps: 'Boshllëqe të Dhënash',
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
    no_ownership: 'Nuk u gjetën të dhëna pronësie në regjistrin publik. Kjo shënohet si boshllëk i të dhënave.',
    col_name: 'Emri',
    col_role: 'Roli',
    col_ownership: 'Pronësia %',
    col_date: 'Data',
    col_title: 'Titulli i Kontratës',
    col_authority: 'Autoriteti Kontraktues',
    col_value: 'Vlera (EUR)',
    col_sentiment: 'Sentimenti',
    col_source: 'Burimi',
    col_headline: 'Titulli',
    contracts: 'Kontrata',
    total_value: 'Vlera Totale',
    largest_contract: 'Kontrata më e Madhe',
    avg_value: 'Kontrata Mesatare',
    contracts_by_year: 'Kontrata sipas Vitit',
    top_authorities: 'Autoritetet Kryesore Kontraktuese',
    no_procurement: 'Nuk u gjetën kontrata të prokurimit publik.',
    sentiment_dist: 'Shpërndarja e Sentimentit',
    no_media: 'Nuk u gjet prani e konsiderueshme në media.',
    positive: 'Pozitiv',
    neutral: 'Neutral',
    negative: 'Negativ',
    severity: 'Ashpërsia',
    flag_detail: 'Detajet',
    no_flags: 'Nuk u identifikuan shqetësime specifike rreziku.',
    risk_components: 'Komponentët e Pikëve të Rrezikut',
    risk_status: 'Statusi & Pajtueshmëria',
    risk_age: 'Historia Operative',
    risk_capital: 'Mjaftueshmëria e Kapitalit',
    risk_ownership: 'Transparenca e Pronësisë',
    risk_procurement: 'Modelet e Prokurimit',
    risk_media: 'Sentimenti i Medias',
    no_analyst: 'Pa përmbledhje nga analisti.',
    confidential_footer: (name: string) => `KONFIDENCIALE — Përgatitur ekskluzivisht për ${name}`,
    page: 'Faqe',
    page_of: 'nga',
    no_narrative: 'Ende nuk është gjeneruar përmbledhja.',
    sources: [
      'ARBK — Agjencia e Regjistrimit të Bizneseve të Kosovës (https://arbk.rks-gov.net)',
      'e-Prokurimi — Prokurimi Publik i Kosovës (https://e-prokurimi.rks-gov.net)',
      'Prokurim i Hapur Kosova (https://www.prokurimihapur.org)',
      'Portali i të Dhënave të Hapura të Kosovës (https://opendata.rks-gov.net)',
      'Koha (https://www.koha.net), Gazeta Express (https://www.gazetaexpress.com)',
      'Prishtina Insight (https://prishtinainsight.com), Zëri (https://zeri.info)',
    ],
    methodology: 'Ky raport kombinon të dhëna nga regjistrat publikë qeveritarë të Kosovës, standardin e të dhënave të hapura të prokurimit (OCDS), dhe shqyrtimin sistematik të mediave në katër mediat më të mëdha të Kosovës. Pikët e rrezikut llogariten si shumë e ponderuar e gjashtë faktorëve: statusi i regjistrit (35%), historia operative (15%), mjaftueshmëria e kapitalit (15%), transparenca e pronësisë (15%), modelet e prokurimit (10%), dhe sentimenti i medias (10%). Çdo faktor është i verifikueshëm në mënyrë të pavarur përmes URL-ve të burimit.',
    sample_disclaimer: 'Ky është një raport MOSTËR. Raportet reale përfshijnë emrin tuaj si marrës dhe nuk përmbajnë filigran.',
    contracts_won: 'kontrata të fituara',
    contracts_count: (n: number) => `${n} kontrat${n === 1 ? 'ë' : 'a'}`,
  },
};

// ============== CHART HELPERS ==============

function drawStatCard(doc: any, x: number, y: number, w: number, h: number, label: string, value: string, color = '#0f172a') {
  doc.rect(x, y, w, h).fill('#f8fafc').strokeColor('#e2e8f0').stroke();
  doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(label.toUpperCase(), x + 8, y + 6, { width: w - 16 });
  doc.fillColor(color).fontSize(14).font('Helvetica-Bold').text(value, x + 8, y + 18, { width: w - 16 });
}

function drawGauge(doc: any, x: number, y: number, w: number, score: number, color: string) {
  doc.rect(x, y, w, 10).fill('#e2e8f0');
  doc.rect(x, y, Math.round(w * score / 100), 10).fill(color);
  // tick marks
  for (let i = 0; i <= 4; i++) {
    const tx = x + Math.round(w * i / 4);
    doc.rect(tx, y + 12, 1, 4).fill('#94a3b8');
  }
  doc.fillColor('#64748b').fontSize(7).font('Helvetica')
    .text('0', x, y + 17)
    .text('25', x + w / 4 - 5, y + 17)
    .text('50', x + w / 2 - 5, y + 17)
    .text('75', x + 3 * w / 4 - 5, y + 17)
    .text('100', x + w - 12, y + 17);
}

// Vertical bar chart
function drawBarChart(doc: any, x: number, y: number, w: number, h: number, data: Array<{ label: string; value: number }>, valueFormatter: (v: number) => string) {
  if (data.length === 0) return;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(60, (w - 20) / data.length - 8);
  const chartH = h - 35;

  // Background
  doc.rect(x, y, w, h).fill('#fafafa').strokeColor('#e5e7eb').stroke();

  // Horizontal gridlines
  for (let i = 1; i <= 4; i++) {
    const ly = y + 10 + (chartH * i / 4);
    doc.moveTo(x + 30, ly).lineTo(x + w - 10, ly).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
  }

  data.forEach((d, i) => {
    const barH = (d.value / max) * chartH;
    const bx = x + 35 + i * ((w - 50) / data.length);
    const by = y + 10 + (chartH - barH);
    doc.rect(bx, by, barW, barH).fill('#0f172a');
    // Value label on top
    doc.fillColor('#0f172a').fontSize(7).font('Helvetica-Bold')
      .text(valueFormatter(d.value), bx, by - 9, { width: barW, align: 'center' });
    // X label
    doc.fillColor('#64748b').fontSize(7).font('Helvetica')
      .text(d.label, bx - 5, y + h - 16, { width: barW + 10, align: 'center' });
  });
  doc.lineWidth(1);
}

// Horizontal bar chart (good for top-N rankings)
function drawHorizontalBars(doc: any, x: number, y: number, w: number, data: Array<{ label: string; value: number; color?: string }>, valueFormatter: (v: number) => string): number {
  if (data.length === 0) return y;
  const max = Math.max(...data.map((d) => d.value), 1);
  const rowH = 22;
  const labelW = 160;
  const barAreaW = w - labelW - 80;

  data.forEach((d, i) => {
    const ry = y + i * rowH;
    doc.fillColor('#1f2937').fontSize(9).font('Helvetica')
      .text(d.label, x, ry + 5, { width: labelW - 10, ellipsis: true });
    const barW = Math.max(2, (d.value / max) * barAreaW);
    doc.rect(x + labelW, ry + 3, barW, 14).fill(d.color || '#0f172a');
    doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold')
      .text(valueFormatter(d.value), x + labelW + barAreaW + 5, ry + 6, { width: 70, align: 'right' });
  });
  return y + data.length * rowH;
}

// Horizontal stacked bar (for distributions like sentiment)
function drawStackedBar(doc: any, x: number, y: number, w: number, h: number, segments: Array<{ label: string; value: number; color: string }>): number {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    doc.rect(x, y, w, h).fill('#f1f5f9');
    return y + h + 20;
  }
  let cx = x;
  for (const seg of segments) {
    const segW = (seg.value / total) * w;
    doc.rect(cx, y, segW, h).fill(seg.color);
    if (segW > 30) {
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
        .text(`${seg.value}`, cx, y + h / 2 - 5, { width: segW, align: 'center' });
    }
    cx += segW;
  }
  // Legend
  let lx = x;
  const ly = y + h + 8;
  for (const seg of segments) {
    doc.rect(lx, ly, 10, 10).fill(seg.color);
    doc.fillColor('#374151').fontSize(8).font('Helvetica').text(`${seg.label} (${seg.value})`, lx + 14, ly + 2);
    lx += 100;
  }
  return ly + 22;
}

// Section title helper
function sectionTitle(doc: any, title: string, y = 50) {
  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(title, 50, y);
  doc.moveTo(50, y + 25).lineTo(545, y + 25).strokeColor('#cbd5e1').lineWidth(1).stroke();
  doc.y = y + 40;
}

function tableHeader(doc: any, columns: Array<{ label: string; width: number; align?: 'left' | 'right' | 'center' }>) {
  const startY = doc.y;
  let x = 50;
  for (const col of columns) {
    doc.rect(x, startY, col.width, 22).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
      .text(col.label, x + 5, startY + 7, { width: col.width - 10, align: col.align || 'left' });
    x += col.width;
  }
  doc.y = startY + 23;
}

function tableRow(doc: any, cells: Array<{ text: string; width: number; align?: 'left' | 'right' | 'center'; color?: string }>, alt = false) {
  const startY = doc.y;
  const rowH = 22;
  if (alt) doc.rect(50, startY, cells.reduce((s, c) => s + c.width, 0), rowH).fill('#f8fafc');
  let x = 50;
  for (const cell of cells) {
    doc.fillColor(cell.color || '#111827').fontSize(9).font('Helvetica')
      .text(cell.text, x + 5, startY + 7, { width: cell.width - 10, align: cell.align || 'left', ellipsis: true });
    x += cell.width;
  }
  doc.moveTo(50, startY + rowH).lineTo(50 + cells.reduce((s, c) => s + c.width, 0), startY + rowH)
    .strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  doc.y = startY + rowH + 1;
}

function formatDate(d: any): string {
  if (!d) return '—';
  try {
    if (typeof d === 'string') return d.split('T')[0];
    return new Date(d).toISOString().split('T')[0];
  } catch { return String(d); }
}

// ============== MAIN PDF GENERATOR ==============

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
      const tier = data.tier || 'comprehensive';
      const c = data.company || {};
      const persons = data.persons || [];
      const proc = data.procurement || [];
      const news = data.news || [];
      const rating = data.analyst_risk_rating || 'medium';
      const score = data.ai_risk_score ?? 50;
      const ratingColor = RATING_COLORS[rating] || '#6b7280';
      const date = new Date().toLocaleDateString(lang === 'sq' ? 'sq-AL' : 'en-GB');
      const totalProc = proc.reduce((s: number, p: any) => s + (parseFloat(p.contract_value_eur) || 0), 0);
      const maxProc = proc.length > 0 ? Math.max(...proc.map((p: any) => parseFloat(p.contract_value_eur) || 0)) : 0;
      const avgProc = proc.length > 0 ? totalProc / proc.length : 0;

      const includeProcurement = tier !== 'basic';
      const includeNews = tier !== 'basic';
      const includeRiskAnalysis = tier === 'comprehensive';
      const includeAnalyst = tier !== 'basic';
      const includeFullNarrative = tier === 'comprehensive';

      // ===================== COVER PAGE =====================
      doc.rect(0, 0, doc.page.width, 230).fill('#0f172a');
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
        .text('KOSOVAINTEL', 50, 70, { characterSpacing: 4 });
      doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold')
        .text(L.report_title, 50, 95)
        .text(L.report_subtitle, 50, 128);
      doc.fillColor('#cbd5e1').fontSize(10).font('Helvetica').text(L.tagline, 50, 175);

      // Tier ribbon
      const tierLabel = tier === 'basic' ? 'BASIC' : tier === 'standard' ? 'STANDARD' : 'COMPREHENSIVE';
      const tierColor = tier === 'basic' ? '#64748b' : tier === 'standard' ? '#0ea5e9' : '#9333ea';
      doc.rect(420, 70, 130, 28).fill(tierColor);
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(tierLabel, 420, 79, { width: 130, align: 'center' });

      // Company name
      doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold')
        .text(c.name || data.order_number, 50, 270, { width: 495 });

      // Risk badge
      doc.rect(50, 320, 160, 38).fill(ratingColor);
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
        .text(`${rating.toUpperCase()} ${L.risk}`, 50, 333, { width: 160, align: 'center' });
      doc.fillColor('#374151').fontSize(11).font('Helvetica').text(`${L.score}: ${score}/100`, 220, 333);

      // Order details
      doc.fillColor('#475569').fontSize(10).font('Helvetica')
        .text(`${L.order_number}: ${data.order_number}`, 50, 400)
        .text(`${L.date_issued}: ${date}`, 50, 418)
        .text(`${L.prepared_for}: ${data.client_name}`, 50, 436)
        .text(`${L.report_tier}: ${tierLabel}`, 50, 454);

      // Sources panel on cover
      doc.rect(50, 500, 495, 100).fill('#f8fafc').strokeColor('#e2e8f0').stroke();
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(L.s_methodology, 60, 510);
      doc.fillColor('#475569').fontSize(8).font('Helvetica');
      let sy = 525;
      for (const s of L.sources.slice(0, 4)) {
        doc.text(`• ${s}`, 60, sy, { width: 475 });
        sy += 11;
      }

      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Oblique')
        .text(L.confidential_cover(data.client_name), 50, 740, { width: 495, align: 'center' });

      if (data.is_sample) {
        doc.save();
        doc.rotate(-30, { origin: [doc.page.width / 2, doc.page.height / 2] });
        doc.fillColor('#fecaca').opacity(0.5).fontSize(120).font('Helvetica-Bold')
          .text('SAMPLE', 0, doc.page.height / 2 - 70, { width: doc.page.width, align: 'center' });
        doc.opacity(1);
        doc.restore();
      }

      // ===================== SECTION: SNAPSHOT (all tiers) =====================
      doc.addPage();
      sectionTitle(doc, '1. ' + L.s_snapshot);

      // Stat cards row
      const cardW = 117;
      const cardH = 50;
      const cards = [
        { label: L.status, value: (c.status || '—').toUpperCase(), color: c.status === 'active' ? '#16a34a' : '#dc2626' },
        { label: L.age, value: c.registration_date ? `${((Date.now() - new Date(c.registration_date).getTime()) / (365 * 24 * 3600 * 1000)).toFixed(0)} ${L.years}` : '—' },
        { label: L.capital, value: c.share_capital_eur ? `€${(Number(c.share_capital_eur) / 1000000).toFixed(1)}M` : '—' },
        { label: L.contracts, value: includeProcurement ? `${proc.length}` : '—' },
      ];
      cards.forEach((card, i) => {
        drawStatCard(doc, 50 + i * (cardW + 5), 90, cardW, cardH, card.label, card.value, card.color || '#0f172a');
      });

      // Risk gauge
      doc.y = 160;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`${L.risk_score}: ${score} / 100`, 50, doc.y);
      doc.moveDown(0.5);
      drawGauge(doc, 50, doc.y, 495, score, ratingColor);
      doc.y += 35;

      // Snapshot narrative — short for basic, longer for higher tiers
      const narrativeFull = data.ai_risk_narrative || L.no_narrative;
      const paragraphs = narrativeFull.split('\n\n');
      let snapshotText: string;
      if (tier === 'basic') snapshotText = paragraphs.slice(0, 1).join('\n\n');
      else if (tier === 'standard') snapshotText = paragraphs.slice(0, 2).join('\n\n');
      else snapshotText = narrativeFull;

      doc.fillColor('#1f2937').fontSize(10).font('Helvetica')
        .text(snapshotText, 50, doc.y, { width: 495, align: 'justify' });

      // ===================== SECTION: COMPANY PROFILE (all tiers) =====================
      doc.addPage();
      sectionTitle(doc, '2. ' + L.s_profile);

      const fields: Array<[string, string]> = [
        [L.name, c.name || '—'],
        [L.reg_num, c.registration_number || '—'],
        [L.legal_form, c.legal_form || '—'],
        [L.status, (c.status || 'unknown').toUpperCase()],
        [L.reg_date, formatDate(c.registration_date)],
        [L.municipality, c.municipality || '—'],
        [L.address, c.address || '—'],
        [L.activity, c.primary_activity_description || '—'],
        [L.capital, c.share_capital_eur ? `€ ${Number(c.share_capital_eur).toLocaleString()}` : '—'],
        [L.source_url, c.source_url || '—'],
      ];
      for (const [label, value] of fields) {
        if (doc.y > 720) doc.addPage();
        const rowY = doc.y;
        doc.rect(50, rowY, 150, 24).fill('#f1f5f9');
        doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text(label, 55, rowY + 8, { width: 145 });
        doc.fillColor('#111827').fontSize(9).font('Helvetica').text(value, 205, rowY + 8, { width: 340 });
        doc.y = rowY + 25;
      }

      // ===================== SECTION: OWNERSHIP (all tiers) =====================
      doc.addPage();
      sectionTitle(doc, '3. ' + L.s_ownership);

      if (persons.length === 0) {
        doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique')
          .text(L.no_ownership, 50, doc.y, { width: 495 });
      } else {
        const cols = [{ label: L.col_name, width: 220 }, { label: L.col_role, width: 150 }, { label: L.col_ownership, width: 125, align: 'right' as const }];
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

      // ===================== SECTION: PROCUREMENT (Standard + Comprehensive) =====================
      if (includeProcurement) {
        doc.addPage();
        sectionTitle(doc, '4. ' + L.s_procurement);

        if (proc.length === 0) {
          doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique').text(L.no_procurement, 50, doc.y);
        } else {
          // Top metrics row
          drawStatCard(doc, 50, doc.y, 117, 50, L.contracts, String(proc.length));
          drawStatCard(doc, 172, doc.y, 117, 50, L.total_value, `€${(totalProc / 1000000).toFixed(2)}M`);
          drawStatCard(doc, 294, doc.y, 117, 50, L.largest_contract, `€${(maxProc / 1000).toFixed(0)}k`);
          drawStatCard(doc, 416, doc.y, 129, 50, L.avg_value, `€${(avgProc / 1000).toFixed(0)}k`);
          doc.y += 65;

          // Bar chart: contracts by year
          const byYear: Record<string, number> = {};
          for (const p of proc) {
            const year = p.award_date ? formatDate(p.award_date).slice(0, 4) : '—';
            byYear[year] = (byYear[year] || 0) + (parseFloat(p.contract_value_eur) || 0);
          }
          const yearData = Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b))
            .map(([label, value]) => ({ label, value }));

          if (yearData.length > 0) {
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(L.contracts_by_year, 50, doc.y);
            doc.y += 15;
            drawBarChart(doc, 50, doc.y, 495, 130, yearData, (v) => `€${(v / 1000).toFixed(0)}k`);
            doc.y += 140;
          }

          // Top authorities horizontal bars
          const byAuth: Record<string, number> = {};
          for (const p of proc) {
            const auth = p.contracting_authority || '—';
            byAuth[auth] = (byAuth[auth] || 0) + (parseFloat(p.contract_value_eur) || 0);
          }
          const topAuth = Object.entries(byAuth).sort(([, a], [, b]) => b - a).slice(0, 5)
            .map(([label, value]) => ({ label, value }));

          if (topAuth.length > 0) {
            if (doc.y > 600) doc.addPage();
            doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(L.top_authorities, 50, doc.y);
            doc.y += 15;
            doc.y = drawHorizontalBars(doc, 50, doc.y, 495, topAuth, (v) => `€${(v / 1000).toFixed(0)}k`);
            doc.y += 15;
          }

          // Full table
          if (doc.y > 600) doc.addPage();
          doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`${L.contracts} — ${L.contracts_count(proc.length)}`, 50, doc.y);
          doc.y += 12;

          const pcols = [
            { label: L.col_date, width: 65 },
            { label: L.col_title, width: 200 },
            { label: L.col_authority, width: 140 },
            { label: L.col_value, width: 90, align: 'right' as const },
          ];
          tableHeader(doc, pcols);
          proc.slice(0, 40).forEach((p, i) => {
            if (doc.y > 720) { doc.addPage(); tableHeader(doc, pcols); }
            tableRow(doc, [
              { text: formatDate(p.award_date), width: 65 },
              { text: p.tender_title || '—', width: 200 },
              { text: p.contracting_authority || '—', width: 140 },
              { text: Number(p.contract_value_eur || 0).toLocaleString(), width: 90, align: 'right' },
            ], i % 2 === 1);
          });
        }
      }

      // ===================== SECTION: NEWS (Standard + Comprehensive) =====================
      if (includeNews) {
        doc.addPage();
        sectionTitle(doc, '5. ' + L.s_news);

        if (news.length === 0) {
          doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique').text(L.no_media, 50, doc.y);
        } else {
          // Sentiment distribution chart
          const pos = news.filter((n: any) => n.sentiment === 'positive').length;
          const neu = news.filter((n: any) => n.sentiment === 'neutral' || !n.sentiment || n.sentiment === 'unknown').length;
          const neg = news.filter((n: any) => n.sentiment === 'negative').length;

          doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(L.sentiment_dist, 50, doc.y);
          doc.y += 15;
          doc.y = drawStackedBar(doc, 50, doc.y, 495, 28, [
            { label: L.positive, value: pos, color: '#16a34a' },
            { label: L.neutral, value: neu, color: '#94a3b8' },
            { label: L.negative, value: neg, color: '#dc2626' },
          ]);
          doc.y += 10;

          // News table
          const ncols = [
            { label: L.col_date, width: 65 },
            { label: L.col_headline, width: 240 },
            { label: L.col_source, width: 100 },
            { label: L.col_sentiment, width: 90, align: 'center' as const },
          ];
          tableHeader(doc, ncols);
          news.forEach((n: any, i: number) => {
            if (doc.y > 720) { doc.addPage(); tableHeader(doc, ncols); }
            const sentColor = n.sentiment === 'positive' ? '#16a34a' : n.sentiment === 'negative' ? '#dc2626' : '#6b7280';
            tableRow(doc, [
              { text: formatDate(n.published_at), width: 65 },
              { text: n.headline || '—', width: 240 },
              { text: n.source_name || '—', width: 100 },
              { text: (n.sentiment || '—').toUpperCase(), width: 90, align: 'center', color: sentColor },
            ], i % 2 === 1);
          });
        }
      }

      // ===================== SECTION: RISK ANALYSIS (Comprehensive only) =====================
      if (includeRiskAnalysis) {
        doc.addPage();
        sectionTitle(doc, '6. ' + L.s_risk_analysis);

        // Risk components horizontal bars
        const statusScore = (c.status === 'active') ? 5 : 35;
        const ageYears = c.registration_date ? (Date.now() - new Date(c.registration_date).getTime()) / (365 * 24 * 3600 * 1000) : 5;
        const ageScore = ageYears < 1 ? 25 : ageYears < 3 ? 10 : 0;
        const capScore = !c.share_capital_eur ? 10 : Number(c.share_capital_eur) < 1000 ? 20 : 0;
        const ownScore = persons.length === 0 ? 20 : 0;
        const procScore = (maxProc > Number(c.share_capital_eur || 1) * 100) ? 15 : 0;
        const newsScore = Math.min(20, news.filter((n: any) => n.sentiment === 'negative').length * 8);

        const components = [
          { label: L.risk_status, value: statusScore, color: statusScore > 20 ? '#dc2626' : statusScore > 5 ? '#f59e0b' : '#16a34a' },
          { label: L.risk_age, value: ageScore, color: ageScore > 15 ? '#dc2626' : ageScore > 5 ? '#f59e0b' : '#16a34a' },
          { label: L.risk_capital, value: capScore, color: capScore > 15 ? '#dc2626' : '#16a34a' },
          { label: L.risk_ownership, value: ownScore, color: ownScore > 15 ? '#dc2626' : '#16a34a' },
          { label: L.risk_procurement, value: procScore, color: procScore > 10 ? '#f59e0b' : '#16a34a' },
          { label: L.risk_media, value: newsScore, color: newsScore > 10 ? '#dc2626' : newsScore > 5 ? '#f59e0b' : '#16a34a' },
        ];

        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(L.risk_components, 50, doc.y);
        doc.y += 15;
        doc.y = drawHorizontalBars(doc, 50, doc.y, 495, components, (v) => `+${v} pts`);
        doc.y += 20;

        // Risk flags
        const flags = Array.isArray(data.analyst_flags) ? data.analyst_flags : [];
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(L.risk_flags, 50, doc.y);
        doc.y += 12;

        if (flags.length === 0) {
          doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique').text(L.no_flags, 50, doc.y);
        } else {
          for (const f of flags as any[]) {
            if (doc.y > 720) doc.addPage();
            const flagText = typeof f === 'string' ? f : f.flag;
            const flagDetail = typeof f === 'object' ? f.detail : '';
            const severity = typeof f === 'object' ? f.severity : 'medium';
            const sevColor = severity === 'high' ? '#dc2626' : severity === 'medium' ? '#f59e0b' : '#fbbf24';

            const startY = doc.y;
            doc.rect(50, startY, 5, 38).fill(sevColor);
            doc.rect(55, startY, 490, 38).fill('#fffbeb').strokeColor('#fef3c7').stroke();
            doc.fillColor('#92400e').fontSize(10).font('Helvetica-Bold').text(flagText, 65, startY + 6, { width: 380 });
            doc.fillColor(sevColor).fontSize(8).font('Helvetica-Bold').text(severity.toUpperCase(), 460, startY + 6, { width: 75, align: 'right' });
            if (flagDetail) {
              doc.fillColor('#374151').fontSize(8).font('Helvetica').text(flagDetail, 65, startY + 20, { width: 470 });
            }
            doc.y = startY + 45;
          }
        }

        // Data gaps
        if (data.data_gaps && data.data_gaps.length > 0) {
          if (doc.y > 680) doc.addPage();
          doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(L.data_gaps, 50, doc.y);
          doc.y += 12;
          for (const g of data.data_gaps) {
            doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text(`• ${g}`, 60, doc.y, { width: 480 });
            doc.y += 14;
          }
        }
      }

      // ===================== SECTION: ANALYST ASSESSMENT (Standard + Comprehensive) =====================
      if (includeAnalyst) {
        doc.addPage();
        sectionTitle(doc, (includeRiskAnalysis ? '7. ' : '6. ') + L.s_analyst);

        doc.fillColor('#1f2937').fontSize(10).font('Helvetica')
          .text(data.analyst_summary || L.no_analyst, 50, doc.y, { width: 495, align: 'justify' });
        doc.moveDown();

        if (data.analyst_recommendations) {
          doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(L.s_recommendations, 50, doc.y);
          doc.y += 18;
          // Highlighted box
          const recY = doc.y;
          const recH = 80;
          doc.rect(50, recY, 495, recH).fill('#eff6ff').strokeColor('#bfdbfe').stroke();
          doc.rect(50, recY, 4, recH).fill('#2563eb');
          doc.fillColor('#1e3a8a').fontSize(10).font('Helvetica')
            .text(data.analyst_recommendations, 65, recY + 10, { width: 470, align: 'justify' });
          doc.y = recY + recH + 15;
        }
      }

      // ===================== SECTION: METHODOLOGY (all tiers) =====================
      doc.addPage();
      const finalSection = (tier === 'basic' ? '4. ' : tier === 'standard' ? '7. ' : '8. ') + L.s_methodology;
      sectionTitle(doc, finalSection);

      doc.fillColor('#1f2937').fontSize(10).font('Helvetica')
        .text(L.methodology, 50, doc.y, { width: 495, align: 'justify' });
      doc.moveDown();

      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Data sources:', 50, doc.y);
      doc.y += 12;
      doc.fillColor('#374151').fontSize(9).font('Helvetica');
      for (const s of L.sources) {
        if (doc.y > 720) doc.addPage();
        doc.text(`• ${s}`, 50, doc.y, { width: 495 });
        doc.y += 14;
      }
      doc.moveDown();

      if (data.is_sample) {
        doc.rect(50, doc.y, 495, 30).fill('#fef2f2').strokeColor('#fecaca').stroke();
        doc.fillColor('#991b1b').fontSize(9).font('Helvetica-Bold')
          .text(L.sample_disclaimer, 60, doc.y + 10, { width: 475, align: 'center' });
      }

      // ===================== PER-PAGE FOOTERS =====================
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const oldBottomMargin = (doc.page as any).margins.bottom;
        (doc.page as any).margins.bottom = 0;
        doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
          .text(`${L.confidential_footer(data.client_name)} — ${date}`,
            50, doc.page.height - 30, { align: 'left', width: 400 })
          .text(`${L.page} ${i + 1} ${L.page_of} ${range.count}`,
            doc.page.width - 110, doc.page.height - 30, { align: 'right', width: 60 });
        (doc.page as any).margins.bottom = oldBottomMargin;
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
