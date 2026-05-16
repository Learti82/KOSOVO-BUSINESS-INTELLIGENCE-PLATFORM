import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../db/pool';
import { authRequired, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { generatePDF } from '../services/pdf.service';
import { generateRiskAssessment } from '../services/ai.service';

const router = Router();

async function buildAndSavePDF(orderId: number, lang: 'en' | 'sq' = 'en'): Promise<string> {
  const order = (await query<any>(
    `SELECT o.*, u.full_name AS client_name, u.company_name AS client_company
     FROM report_orders o LEFT JOIN users u ON o.client_id = u.id WHERE o.id = $1`,
    [orderId]
  )).rows[0];
  if (!order) throw new Error('Order not found');

  let report = (await query<any>('SELECT * FROM reports WHERE order_id = $1', [orderId])).rows[0];
  const company = order.company_id ? (await query('SELECT * FROM companies WHERE id = $1', [order.company_id])).rows[0] : null;
  const persons = order.company_id ? (await query('SELECT * FROM company_persons WHERE company_id = $1', [order.company_id])).rows : [];
  const procurement = order.company_id ? (await query('SELECT * FROM procurement_records WHERE company_id = $1 ORDER BY award_date DESC', [order.company_id])).rows : [];
  const news = order.company_id ? (await query('SELECT * FROM news_mentions WHERE company_id = $1 ORDER BY published_at DESC NULLS LAST', [order.company_id])).rows : [];

  // Always generate (re-generate) the assessment in the target language at PDF time
  let assessment = null as any;
  if (company) {
    assessment = await generateRiskAssessment({ company, persons, procurement, news }, lang);
  }
  if (!report?.ai_risk_narrative) {
    const a = assessment || await generateRiskAssessment({ company, persons, procurement, news }, lang);
    await query(
      `INSERT INTO reports (order_id, company_id, ai_risk_narrative, ai_risk_score,
        analyst_risk_rating, analyst_flags, analyst_summary, analyst_recommendations)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (order_id) DO UPDATE SET
         ai_risk_narrative = COALESCE(reports.ai_risk_narrative, EXCLUDED.ai_risk_narrative),
         ai_risk_score = COALESCE(reports.ai_risk_score, EXCLUDED.ai_risk_score),
         analyst_risk_rating = COALESCE(reports.analyst_risk_rating, EXCLUDED.analyst_risk_rating),
         analyst_flags = COALESCE(reports.analyst_flags, EXCLUDED.analyst_flags),
         analyst_summary = COALESCE(reports.analyst_summary, EXCLUDED.analyst_summary),
         analyst_recommendations = COALESCE(reports.analyst_recommendations, EXCLUDED.analyst_recommendations),
         updated_at = NOW()`,
      [orderId, order.company_id, a.executive_summary, a.risk_score,
       a.risk_rating, JSON.stringify(a.risk_flags),
       `Independent analyst review of ${company?.name || 'subject entity'}. Findings catalogued in flags section. Risk rating reflects composite assessment of registry data, procurement history, and media screening.`,
       a.recommendations]
    );
    report = (await query<any>('SELECT * FROM reports WHERE order_id = $1', [orderId])).rows[0];
  }

  const reportsPath = process.env.REPORTS_PATH || './uploads/reports';
  const outputPath = path.resolve(reportsPath, `${order.order_number}-${lang}.pdf`);

  const tier = (order.report_type || 'comprehensive') as 'basic' | 'standard' | 'comprehensive';

  // Comprehensive tier: enrich with sanctions, court, peer, history
  let sanctions_results: any, court_results: any, peer_stats: any, history: any;
  if (tier === 'comprehensive' && company) {
    try {
      const { checkPersonsAgainstSanctions } = await import('../services/sanctions.service');
      const { searchCourtCases } = await import('../services/court.service');
      const { getPeerBenchmark } = await import('../services/peer.service');
      [sanctions_results, court_results, peer_stats] = await Promise.all([
        checkPersonsAgainstSanctions(persons.map((p: any) => ({ full_name: p.full_name }))),
        searchCourtCases(company.name),
        getPeerBenchmark(company.id),
      ]);
      const histResult = await query<any>(
        `SELECT risk_score, risk_rating, created_at FROM risk_score_history
         WHERE company_id = $1 ORDER BY created_at ASC LIMIT 12`,
        [company.id]
      );
      history = histResult.rows;
    } catch (e) {
      console.error('Comprehensive enrichment failed:', e);
    }
  }

  // Record risk score history
  if (company && assessment) {
    try {
      await query(
        `INSERT INTO risk_score_history (company_id, risk_score, risk_rating, flags_count, source)
         VALUES ($1, $2, $3, $4, $5)`,
        [company.id, assessment.risk_score, assessment.risk_rating, (assessment.risk_flags || []).length, 'report_build']
      );
    } catch (e) { console.error('History insert failed:', e); }
  }

  // For non-English PDFs, use the freshly computed assessment in that language
  const narrativeForLang = (lang === 'sq' && assessment) ? assessment.executive_summary : report?.ai_risk_narrative;
  const flagsForLang = (lang === 'sq' && assessment) ? assessment.risk_flags : report?.analyst_flags;
  const recForLang = (lang === 'sq' && assessment) ? assessment.recommendations : report?.analyst_recommendations;

  await generatePDF({
    order_number: order.order_number,
    client_name: order.client_company || order.client_name || (lang === 'sq' ? 'Klient Konfidencial' : 'Confidential Client'),
    company, persons, procurement, news,
    ai_risk_narrative: narrativeForLang,
    ai_risk_score: report?.ai_risk_score ?? assessment?.risk_score,
    analyst_summary: report?.analyst_summary,
    analyst_risk_rating: report?.analyst_risk_rating ?? assessment?.risk_rating,
    analyst_flags: flagsForLang,
    data_gaps: assessment?.data_gaps,
    analyst_recommendations: recForLang,
    sanctions_results, court_results, peer_stats, history,
    lang, tier,
  }, outputPath);

  // Only update pdf_path with the default English version (for backward compat)
  if (lang === 'en') {
    await query('UPDATE reports SET pdf_path = $1 WHERE order_id = $2', [outputPath, orderId]);
  }
  return outputPath;
}

export { buildAndSavePDF };

// PUBLIC SAMPLE — anyone can download a sample report for Kastrati Group (or any seeded company)
router.get('/samples/:tier', async (req, res) => {
  try {
    const tier = (req.params.tier === 'basic' || req.params.tier === 'standard' || req.params.tier === 'comprehensive')
      ? req.params.tier as 'basic' | 'standard' | 'comprehensive'
      : 'standard';
    const lang: 'en' | 'sq' = req.query.lang === 'sq' ? 'sq' : 'en';

    // Use Kastrati Group as the sample subject
    const company = (await query<any>(
      `SELECT * FROM companies WHERE registration_number = '70234001' LIMIT 1`
    )).rows[0];
    if (!company) return res.status(404).json({ error: 'Sample company not seeded' });

    const persons = (await query('SELECT * FROM company_persons WHERE company_id = $1', [company.id])).rows;
    const procurement = (await query(
      'SELECT * FROM procurement_records WHERE company_id = $1 ORDER BY award_date DESC',
      [company.id]
    )).rows;
    const news = (await query(
      'SELECT * FROM news_mentions WHERE company_id = $1 ORDER BY published_at DESC NULLS LAST',
      [company.id]
    )).rows;

    const { generateRiskAssessment } = await import('../services/ai.service');
    const assessment = await generateRiskAssessment({ company, persons, procurement, news }, lang);

    // For Comprehensive: fetch sanctions, court, peer benchmark
    let sanctions_results: any = undefined;
    let court_results: any = undefined;
    let peer_stats: any = undefined;
    if (tier === 'comprehensive') {
      try {
        const { checkPersonsAgainstSanctions } = await import('../services/sanctions.service');
        const { searchCourtCases } = await import('../services/court.service');
        const { getPeerBenchmark } = await import('../services/peer.service');
        [sanctions_results, court_results, peer_stats] = await Promise.all([
          checkPersonsAgainstSanctions(persons.map((p: any) => ({ full_name: p.full_name }))),
          searchCourtCases(company.name),
          getPeerBenchmark(company.id),
        ]);
      } catch (e) {
        console.error('Comprehensive enrichment failed:', e);
      }
    }

    const reportsPath = process.env.REPORTS_PATH || './uploads/reports';
    const outputPath = path.resolve(reportsPath, `SAMPLE-${tier}-${lang}.pdf`);

    const analystSummary = lang === 'sq'
      ? `Rishikim i pavarur i analistit për ${company.name}. Kompania është një nga grupet më të mëdha dhe më të konsoliduara afariste në Kosovë, me operacione të diversifikuara në shpërndarje karburanti, tregti me pakicë dhe patundshmëri. Histori e dokumentuar prokurimi dhe pronësi transparente.`
      : `Independent analyst review of ${company.name}. The company is one of the largest and most established business groups in Kosovo, with diversified operations across fuel distribution, retail, and real estate. Documented procurement track record and transparent ownership.`;

    await generatePDF({
      order_number: `SAMPLE-${tier.toUpperCase()}`,
      client_name: lang === 'sq' ? 'Marrës Demonstrimi' : 'Demo Recipient',
      company, persons, procurement, news,
      ai_risk_narrative: assessment.executive_summary,
      ai_risk_score: assessment.risk_score,
      analyst_risk_rating: assessment.risk_rating,
      analyst_flags: assessment.risk_flags,
      data_gaps: assessment.data_gaps,
      analyst_summary: analystSummary,
      analyst_recommendations: assessment.recommendations,
      sanctions_results, court_results, peer_stats,
      lang, tier, is_sample: true,
    }, outputPath);

    res.download(outputPath, `KosovaIntel-Sample-${tier}-${lang}.pdf`);
  } catch (err: any) {
    console.error('Sample PDF failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/client/orders/:id/report', authRequired, requireRole('client'), async (req: AuthRequest, res) => {
  try {
    const lang: 'en' | 'sq' = req.query.lang === 'sq' ? 'sq' : 'en';
    const result = await query<any>(
      `SELECT o.order_number, o.id AS order_id, o.status FROM report_orders o
       WHERE o.id = $1 AND o.client_id = $2`,
      [req.params.id, req.user!.id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Order not found' });
    if (row.status !== 'completed') {
      return res.status(400).json({ error: 'Report not yet completed' });
    }

    const reportsPath = process.env.REPORTS_PATH || './uploads/reports';
    let pdfPath = path.resolve(reportsPath, `${row.order_number}-${lang}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      console.log(`Generating ${lang.toUpperCase()} PDF for order ${row.order_number}...`);
      pdfPath = await buildAndSavePDF(row.order_id, lang);
    }
    res.download(pdfPath, `KosovaIntel-${row.order_number}-${lang}.pdf`);
  } catch (err: any) {
    console.error('PDF download failed:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
