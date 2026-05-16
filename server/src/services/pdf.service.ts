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

const RATING_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#b45309',
  high: '#ea580c',
  critical: '#dc2626',
};

export async function generatePDF(data: ReportData, outputPath: string): Promise<string> {
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: { Title: `KosovaIntel Report ${data.order_number}`, Author: 'KosovaIntel' },
      });

      const stream = fs.createWriteStream(outputPath);
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
      doc.pipe(stream);

      const rating = data.analyst_risk_rating || 'medium';
      const score = data.ai_risk_score ?? 50;
      const proc = data.procurement || [];
      const news = data.news || [];
      const persons = data.persons || [];
      const c = data.company || {};
      const date = new Date().toLocaleDateString('en-GB');
      const ratingColor = RATING_COLORS[rating] || '#6b7280';
      const totalProc = proc.reduce((sum: number, p: any) => sum + (parseFloat(p.contract_value_eur) || 0), 0);

      // ========== COVER PAGE ==========
      doc.rect(0, 0, doc.page.width, 220).fill('#0f172a');
      doc
        .fillColor('#94a3b8').fontSize(10).font('Helvetica')
        .text('KOSOVAINTEL', 50, 70, { characterSpacing: 4 });
      doc
        .fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
        .text('BUSINESS INTELLIGENCE', 50, 100)
        .text('REPORT', 50, 130);
      doc
        .fillColor('#cbd5e1').fontSize(10).font('Helvetica')
        .text('Kosovo Due Diligence', 50, 175);

      doc
        .fillColor('#0f172a').fontSize(20).font('Helvetica-Bold')
        .text(c.name || data.order_number, 50, 270, { width: 495 });

      // Risk badge
      const badgeY = 320;
      doc.rect(50, badgeY, 160, 36).fill(ratingColor);
      doc
        .fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
        .text(`${rating.toUpperCase()} RISK`, 50, badgeY + 12, { width: 160, align: 'center' });
      doc
        .fillColor('#374151').fontSize(11).font('Helvetica')
        .text(`Score: ${score}/100`, 220, badgeY + 12);

      // Order details
      doc
        .fillColor('#475569').fontSize(10).font('Helvetica')
        .text(`Order Number: ${data.order_number}`, 50, 400)
        .text(`Date Issued: ${date}`, 50, 418)
        .text(`Prepared for: ${data.client_name}`, 50, 436);

      // Cover footer
      doc
        .fillColor('#94a3b8').fontSize(8).font('Helvetica-Oblique')
        .text(
          `CONFIDENTIAL — This report has been prepared exclusively for ${data.client_name} and is not transferable. ` +
            'Information contained herein is based on publicly available data sources and analyst review as of the date of issue.',
          50, 740, { width: 495, align: 'center' }
        );

      // ========== SECTION 1: EXECUTIVE SUMMARY ==========
      doc.addPage();
      sectionTitle(doc, '1. Executive Summary');

      doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
        .text(`Risk Score: ${score} / 100`, 50, doc.y);
      doc.moveDown(0.3);
      const gaugeY = doc.y;
      doc.rect(50, gaugeY, 495, 8).fill('#e5e7eb');
      doc.rect(50, gaugeY, Math.round(495 * score / 100), 8).fill(ratingColor);
      doc.y = gaugeY + 20;

      doc.fillColor('#1f2937').fontSize(10).font('Helvetica')
        .text(data.ai_risk_narrative || data.analyst_summary || 'No narrative generated yet.', 50, doc.y, {
          width: 495,
          align: 'justify',
        });
      doc.moveDown();

      // Flags
      const flags = Array.isArray(data.analyst_flags) ? data.analyst_flags : [];
      if (flags.length > 0) {
        doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('Risk Flags', 50, doc.y);
        doc.moveDown(0.3);
        for (const f of flags as any[]) {
          if (doc.y > 720) doc.addPage();
          const flagText = typeof f === 'string' ? f : f.flag;
          const flagDetail = typeof f === 'object' ? f.detail : '';
          doc.rect(50, doc.y, 4, 24).fill('#f59e0b');
          doc.fillColor('#92400e').fontSize(10).font('Helvetica-Bold').text(flagText, 60, doc.y, { width: 485 });
          if (flagDetail) {
            doc.fillColor('#374151').fontSize(9).font('Helvetica').text(flagDetail, 60, doc.y, { width: 485 });
          }
          doc.moveDown(0.5);
        }
      }

      // ========== SECTION 2: COMPANY PROFILE ==========
      doc.addPage();
      sectionTitle(doc, '2. Company Profile');

      const fields: Array<[string, string]> = [
        ['Registered Name', c.name || '—'],
        ['Registration Number', c.registration_number || '—'],
        ['Legal Form', c.legal_form || '—'],
        ['Status', (c.status || 'unknown').toUpperCase()],
        ['Registration Date', formatDate(c.registration_date)],
        ['Municipality', c.municipality || '—'],
        ['Address', c.address || '—'],
        ['Primary Activity', c.primary_activity_description || '—'],
        ['Share Capital', c.share_capital_eur ? `€ ${Number(c.share_capital_eur).toLocaleString()}` : '—'],
        ['Source URL', c.source_url || '—'],
      ];

      for (const [label, value] of fields) {
        if (doc.y > 720) doc.addPage();
        const rowY = doc.y;
        doc.rect(50, rowY, 150, 22).fill('#f1f5f9');
        doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
          .text(label, 55, rowY + 7, { width: 145 });
        doc.fillColor('#111827').fontSize(9).font('Helvetica')
          .text(value, 205, rowY + 7, { width: 340 });
        doc.y = rowY + 23;
      }

      // ========== SECTION 3: OWNERSHIP ==========
      doc.addPage();
      sectionTitle(doc, '3. Ownership Structure');

      if (persons.length === 0) {
        doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique')
          .text('No ownership data found in public registry. This is flagged as a data gap.', 50, doc.y, { width: 495 });
      } else {
        // Header
        tableHeader(doc, [
          { label: 'Name', width: 220 },
          { label: 'Role', width: 150 },
          { label: 'Ownership %', width: 125 },
        ]);
        for (const p of persons) {
          if (doc.y > 720) {
            doc.addPage();
            tableHeader(doc, [
              { label: 'Name', width: 220 },
              { label: 'Role', width: 150 },
              { label: 'Ownership %', width: 125 },
            ]);
          }
          tableRow(doc, [
            { text: p.full_name || '—', width: 220 },
            { text: p.role || '—', width: 150 },
            { text: p.ownership_percent ? `${p.ownership_percent}%` : '—', width: 125 },
          ]);
        }
      }

      // ========== SECTION 4: PROCUREMENT ==========
      doc.addPage();
      sectionTitle(doc, '4. Procurement History');
      doc.fillColor('#374151').fontSize(10).font('Helvetica')
        .text(`Total contracts: ${proc.length}    |    Total value: € ${totalProc.toLocaleString()}`, 50, doc.y);
      doc.moveDown();

      if (proc.length === 0) {
        doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique')
          .text('No government procurement contracts found in public records.', 50, doc.y);
      } else {
        tableHeader(doc, [
          { label: 'Date', width: 70 },
          { label: 'Title', width: 200 },
          { label: 'Authority', width: 145 },
          { label: 'Value (EUR)', width: 80 },
        ]);
        for (const p of proc.slice(0, 50)) {
          if (doc.y > 720) {
            doc.addPage();
            tableHeader(doc, [
              { label: 'Date', width: 70 },
              { label: 'Title', width: 200 },
              { label: 'Authority', width: 145 },
              { label: 'Value (EUR)', width: 80 },
            ]);
          }
          tableRow(doc, [
            { text: formatDate(p.award_date), width: 70 },
            { text: p.tender_title || '—', width: 200 },
            { text: p.contracting_authority || '—', width: 145 },
            { text: Number(p.contract_value_eur || 0).toLocaleString(), width: 80, align: 'right' },
          ]);
        }
      }

      // ========== SECTION 5: NEWS ==========
      doc.addPage();
      sectionTitle(doc, '5. Media & News Screening');

      if (news.length === 0) {
        doc.fillColor('#6b7280').fontSize(10).font('Helvetica-Oblique')
          .text('No significant media presence found.', 50, doc.y);
      } else {
        for (const n of news) {
          if (doc.y > 700) doc.addPage();
          const sentColor = n.sentiment === 'positive' ? '#16a34a' : n.sentiment === 'negative' ? '#dc2626' : '#6b7280';
          doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
          doc.moveDown(0.3);

          doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
            .text(n.headline || '', 50, doc.y, { width: 410, continued: false });

          const ratingY = doc.y - 14;
          doc.fillColor(sentColor).fontSize(8).font('Helvetica-Bold')
            .text((n.sentiment || 'unknown').toUpperCase(), 460, ratingY, { width: 85, align: 'right' });

          doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
            .text(`${n.source_name || ''} ${n.published_at ? `— ${formatDate(n.published_at)}` : ''}`, 50, doc.y);

          if (n.summary) {
            doc.fillColor('#374151').fontSize(9).font('Helvetica')
              .text(n.summary, 50, doc.y, { width: 495 });
          }
          doc.moveDown(0.5);
        }
      }

      // ========== SECTION 6: ANALYST ASSESSMENT ==========
      doc.addPage();
      sectionTitle(doc, '6. Analyst Assessment');
      doc.fillColor('#1f2937').fontSize(10).font('Helvetica')
        .text(data.analyst_summary || 'No analyst summary provided.', 50, doc.y, { width: 495, align: 'justify' });
      doc.moveDown();
      if (data.analyst_recommendations) {
        doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text('Recommendations', 50, doc.y);
        doc.moveDown(0.3);
        doc.fillColor('#1f2937').fontSize(10).font('Helvetica')
          .text(data.analyst_recommendations, 50, doc.y, { width: 495, align: 'justify' });
      }

      // ========== SECTION 7: SOURCES ==========
      doc.addPage();
      sectionTitle(doc, '7. Data Sources & Methodology');
      const sources = [
        'ARBK — Kosovo Business Registration Agency (https://arbk.rks-gov.net)',
        'e-Prokurimi — Kosovo Public Procurement (https://e-prokurimi.rks-gov.net)',
        'Open Procurement Kosovo (https://www.prokurimihapur.org)',
        'Kosovo Open Data Portal (https://opendata.rks-gov.net)',
        'Koha (https://www.koha.net)',
        'Gazeta Express (https://www.gazetaexpress.com)',
        'Prishtina Insight (https://prishtinainsight.com)',
        'Zëri (https://zeri.info)',
      ];
      doc.fillColor('#1f2937').fontSize(10).font('Helvetica');
      for (const s of sources) {
        doc.text(`•  ${s}`, 50, doc.y, { width: 495 });
        doc.moveDown(0.3);
      }
      doc.moveDown();
      doc.fillColor('#6b7280').fontSize(8).font('Helvetica-Oblique')
        .text(
          `Report generated on ${date}. Data presented herein is sourced from publicly available registries and media outlets. ` +
            'Recipients should independently verify any material fact before commercial action. ' +
            'KosovaIntel does not warrant completeness of underlying government data.',
          50, doc.y, { width: 495 }
        );

      // ========== Add per-page footers ==========
      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        // Save original margins to avoid affecting layout
        const oldBottomMargin = (doc.page as any).margins.bottom;
        (doc.page as any).margins.bottom = 0;
        doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
          .text(
            `CONFIDENTIAL — Prepared exclusively for ${data.client_name} — ${date}`,
            50, doc.page.height - 30,
            { align: 'left', width: 400 }
          )
          .text(
            `Page ${i + 1} of ${pageRange.count}`,
            doc.page.width - 110, doc.page.height - 30,
            { align: 'right', width: 60 }
          );
        (doc.page as any).margins.bottom = oldBottomMargin;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function sectionTitle(doc: any, title: string) {
  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold')
    .text(title, 50, 50);
  doc.moveTo(50, 75).lineTo(545, 75).strokeColor('#cbd5e1').stroke();
  doc.y = 90;
}

function tableHeader(doc: any, columns: Array<{ label: string; width: number }>) {
  const startY = doc.y;
  let x = 50;
  for (const col of columns) {
    doc.rect(x, startY, col.width, 22).fill('#f1f5f9');
    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
      .text(col.label, x + 5, startY + 7, { width: col.width - 10 });
    x += col.width;
  }
  doc.y = startY + 23;
}

function tableRow(doc: any, cells: Array<{ text: string; width: number; align?: 'left' | 'right' | 'center' }>) {
  const startY = doc.y;
  let x = 50;
  for (const cell of cells) {
    doc.fillColor('#111827').fontSize(9).font('Helvetica')
      .text(cell.text, x + 5, startY + 4, { width: cell.width - 10, align: cell.align || 'left' });
    x += cell.width;
  }
  doc.moveTo(50, startY + 22).lineTo(545, startY + 22).strokeColor('#f3f4f6').stroke();
  doc.y = startY + 23;
}

function formatDate(d: any): string {
  if (!d) return '—';
  try {
    if (typeof d === 'string') return d.split('T')[0];
    return new Date(d).toISOString().split('T')[0];
  } catch {
    return String(d);
  }
}

export function renderReportHTML(): string {
  return '<html><body>Use generatePDF</body></html>';
}
