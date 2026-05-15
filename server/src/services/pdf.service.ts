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
  analyst_summary?: string;
  analyst_risk_rating?: string;
  analyst_flags?: any[];
  analyst_recommendations?: string;
}

function ratingLabel(rating: string): string {
  return ({ low: 'LOW RISK', medium: 'MEDIUM RISK', high: 'HIGH RISK', critical: 'CRITICAL RISK' } as any)[rating] || 'UNKNOWN';
}

export async function generatePDF(data: ReportData, outputPath: string): Promise<string> {
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 55, info: { Title: `KosovaIntel Report ${data.order_number}`, Author: 'KosovaIntel' } });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const rating = data.analyst_risk_rating || 'medium';
    const score = data.ai_risk_score ?? 50;
    const proc = data.procurement || [];
    const news = data.news || [];
    const date = new Date().toLocaleDateString('en-GB');
    const totalProc = proc.reduce((sum: number, p: any) => sum + (parseFloat(p.contract_value_eur) || 0), 0);

    const colors: Record<string, string> = { low: '#16a34a', medium: '#b45309', high: '#ea580c', critical: '#dc2626' };
    const ratingColor = colors[rating] || '#6b7280';

    const addPageFooter = () => {
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor('#9ca3af')
          .text(`CONFIDENTIAL — Prepared exclusively for ${data.client_name} — ${date}`, 55, doc.page.height - 35, { align: 'left', width: 400 })
          .text(`Page ${i + 1}`, 55, doc.page.height - 35, { align: 'right', width: doc.page.width - 110 });
      }
    };

    // COVER PAGE
    doc.rect(0, 0, doc.page.width, 200).fill('#0f172a');
    doc.fillColor('white').fontSize(11).font('Helvetica').text('KOSOVAINTEL', 55, 80, { letterSpacing: 4 });
    doc.fontSize(22).font('Helvetica-Bold').text('BUSINESS INTELLIGENCE REPORT', 55, 110);
    doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('Kosovo Due Diligence', 55, 145);

    doc.fillColor('#0f172a').fontSize(20).font('Helvetica-Bold')
      .text(data.company?.name || data.order_number, 55, 230);

    doc.rect(55, 280, 120, 30).fill(ratingColor);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
      .text(ratingLabel(rating), 55, 288, { width: 120, align: 'center' });

    doc.fillColor('#475569').fontSize(10).font('Helvetica')
      .text(`Order: ${data.order_number}`, 55, 330)
      .text(`Date: ${date}`, 55, 345)
      .text(`Prepared for: ${data.client_name}`, 55, 360);

    doc.fillColor('#9ca3af').fontSize(8)
      .text('CONFIDENTIAL — This report is prepared exclusively for the named recipient and is not transferable.', 55, 720, { width: 485 });

    // SECTION 1 — EXECUTIVE SUMMARY
    doc.addPage();
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('1. Executive Summary', 55, 55);
    doc.moveTo(55, 78).lineTo(540, 78).strokeColor('#cbd5e1').stroke();

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#374151').text(`Risk Score: ${score}/100`, 55, 95);
    doc.rect(55, 115, 485, 10).fill('#e5e7eb');
    doc.rect(55, 115, Math.round(485 * score / 100), 10).fill(ratingColor);

    doc.fontSize(10).font('Helvetica').fillColor('#1f2937')
      .text(data.ai_risk_narrative || data.analyst_summary || 'No executive summary available. Please generate AI narrative or write analyst summary.', 55, 140, { width: 485 });

    if (data.analyst_flags && data.analyst_flags.length > 0) {
      doc.moveDown();
      doc.fontSize(11).font('Helvetica-Bold').text('Risk Flags:');
      for (const f of data.analyst_flags as any[]) {
        doc.rect(55, doc.y, 485, 1).fill('#f59e0b');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#92400e').text(`⚠ ${f.flag || f}`, 65, doc.y);
        if (f.detail) doc.fontSize(9).font('Helvetica').fillColor('#374151').text(f.detail, 75, doc.y, { width: 465 });
        doc.moveDown(0.5);
      }
    }

    // SECTION 2 — COMPANY PROFILE
    doc.addPage();
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('2. Company Profile', 55, 55);
    doc.moveTo(55, 78).lineTo(540, 78).strokeColor('#cbd5e1').stroke();

    const companyFields = [
      ['Registered Name', data.company?.name],
      ['Registration Number', data.company?.registration_number],
      ['Legal Form', data.company?.legal_form],
      ['Status', data.company?.status?.toUpperCase()],
      ['Registration Date', data.company?.registration_date],
      ['Municipality', data.company?.municipality],
      ['Address', data.company?.address],
      ['Primary Activity', data.company?.primary_activity_description],
      ['Share Capital', data.company?.share_capital_eur ? `€ ${parseFloat(data.company.share_capital_eur).toLocaleString()}` : null],
    ];

    let y = 95;
    for (const [label, value] of companyFields) {
      if (y > 700) { doc.addPage(); y = 55; }
      doc.rect(55, y, 150, 22).fill('#f1f5f9');
      doc.rect(205, y, 335, 22).fill('#ffffff').strokeColor('#e5e7eb').stroke();
      doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text(String(label), 60, y + 7, { width: 140 });
      doc.fillColor('#1f2937').fontSize(9).font('Helvetica').text(String(value || '—'), 210, y + 7, { width: 325 });
      y += 23;
    }

    // SECTION 3 — OWNERSHIP
    doc.addPage();
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('3. Ownership Structure', 55, 55);
    doc.moveTo(55, 78).lineTo(540, 78).strokeColor('#cbd5e1').stroke();

    if (!data.persons || data.persons.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('No ownership data found in public registry — this is flagged as a data gap.', 55, 95);
    } else {
      doc.rect(55, 95, 220, 20).fill('#f1f5f9');
      doc.rect(275, 95, 150, 20).fill('#f1f5f9');
      doc.rect(425, 95, 115, 20).fill('#f1f5f9');
      doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
        .text('Name', 60, 102).text('Role', 280, 102).text('Ownership %', 430, 102);
      y = 115;
      for (const p of data.persons) {
        if (y > 700) { doc.addPage(); y = 55; }
        doc.fillColor('#1f2937').fontSize(9).font('Helvetica')
          .text(p.full_name || '—', 60, y + 4, { width: 210 })
          .text(p.role || '—', 280, y + 4, { width: 140 })
          .text(p.ownership_percent ? `${p.ownership_percent}%` : '—', 430, y + 4);
        doc.moveTo(55, y + 20).lineTo(540, y + 20).strokeColor('#f3f4f6').stroke();
        y += 21;
      }
    }

    // SECTION 4 — PROCUREMENT
    doc.addPage();
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('4. Procurement History', 55, 55);
    doc.moveTo(55, 78).lineTo(540, 78).strokeColor('#cbd5e1').stroke();
    doc.fontSize(10).font('Helvetica').fillColor('#374151')
      .text(`Total contracts found: ${proc.length}   |   Total value: € ${totalProc.toLocaleString()}`, 55, 90);

    if (proc.length === 0) {
      doc.moveDown().fillColor('#6b7280').text('No government procurement contracts found in public records.');
    } else {
      doc.rect(55, 115, 80, 20).fill('#f1f5f9');
      doc.rect(135, 115, 185, 20).fill('#f1f5f9');
      doc.rect(320, 115, 140, 20).fill('#f1f5f9');
      doc.rect(460, 115, 80, 20).fill('#f1f5f9');
      doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold')
        .text('Date', 60, 123).text('Title', 140, 123).text('Authority', 325, 123).text('Value (EUR)', 465, 123);
      y = 135;
      for (const p of proc.slice(0, 30)) {
        if (y > 720) { doc.addPage(); y = 55; }
        doc.fillColor('#1f2937').fontSize(8).font('Helvetica')
          .text(p.award_date || '—', 60, y, { width: 70 })
          .text(p.tender_title || '—', 140, y, { width: 175 })
          .text(p.contracting_authority || '—', 325, y, { width: 130 })
          .text(parseFloat(p.contract_value_eur || 0).toLocaleString(), 465, y, { width: 75, align: 'right' });
        doc.moveTo(55, y + 16).lineTo(540, y + 16).strokeColor('#f3f4f6').stroke();
        y += 17;
      }
    }

    // SECTION 5 — NEWS
    doc.addPage();
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('5. Media & News Screening', 55, 55);
    doc.moveTo(55, 78).lineTo(540, 78).strokeColor('#cbd5e1').stroke();

    if (news.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('No significant media presence found.', 55, 95);
    } else {
      y = 95;
      for (const n of news) {
        if (y > 680) { doc.addPage(); y = 55; }
        const sentColor = n.sentiment === 'positive' ? '#16a34a' : n.sentiment === 'negative' ? '#dc2626' : '#6b7280';
        doc.rect(55, y, 485, 1).fill('#e5e7eb');
        y += 6;
        doc.fillColor('#1f2937').fontSize(10).font('Helvetica-Bold').text(n.headline || '', 55, y, { width: 400 });
        doc.fillColor(sentColor).fontSize(8).font('Helvetica').text(n.sentiment || 'unknown', 470, y, { width: 70, align: 'right' });
        y += 16;
        doc.fillColor('#6b7280').fontSize(8).text(`${n.source_name} — ${n.published_at || ''}`, 55, y);
        y += 12;
        if (n.summary) {
          doc.fillColor('#374151').fontSize(9).text(n.summary, 55, y, { width: 485 });
          y += 24;
        }
        y += 8;
      }
    }

    // SECTION 6 — ANALYST
    doc.addPage();
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('6. Analyst Assessment', 55, 55);
    doc.moveTo(55, 78).lineTo(540, 78).strokeColor('#cbd5e1').stroke();
    doc.fontSize(10).font('Helvetica').fillColor('#1f2937')
      .text(data.analyst_summary || 'No analyst summary provided.', 55, 95, { width: 485 });
    if (data.analyst_recommendations) {
      doc.moveDown().font('Helvetica-Bold').text('Recommendations:');
      doc.font('Helvetica').text(data.analyst_recommendations, { width: 485 });
    }

    // SECTION 7 — SOURCES
    doc.addPage();
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('7. Data Sources & Methodology', 55, 55);
    doc.moveTo(55, 78).lineTo(540, 78).strokeColor('#cbd5e1').stroke();
    const sources = [
      'ARBK — Kosovo Business Registration Agency: https://arbk.rks-gov.net',
      'e-Prokurimi — Kosovo Public Procurement: https://e-prokurimi.rks-gov.net',
      'Open Procurement Kosovo: https://www.prokurimihapur.org',
      'Kosovo Open Data Portal: https://opendata.rks-gov.net',
      'Koha: https://www.koha.net',
      'Gazeta Express: https://www.gazetaexpress.com',
      'Prishtina Insight: https://prishtinainsight.com',
      'Zëri: https://zeri.info',
    ];
    y = 95;
    for (const s of sources) {
      doc.fontSize(9).font('Helvetica').fillColor('#374151').text(`• ${s}`, 55, y, { width: 485 });
      y += 18;
    }
    doc.moveDown(2).fontSize(8).fillColor('#9ca3af')
      .text(`Report generated: ${date}. This report is based on publicly available data and should be verified independently before commercial decisions.`, 55, y + 20, { width: 485 });

    addPageFooter();
    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

export function renderReportHTML(data: ReportData): string {
  return `<html><body><h1>${data.order_number}</h1><p>Use generatePDF for proper output.</p></body></html>`;
}
