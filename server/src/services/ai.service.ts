import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a senior business intelligence analyst specializing in Kosovo and Western Balkans markets.
Return ONLY valid JSON: { risk_score, risk_rating, executive_summary, risk_flags[], data_gaps[], recommendations }.
Risk scoring: 0-30 low, 31-60 medium, 61-80 high, 81-100 critical.`;

export interface AIRiskAssessment {
  risk_score: number;
  risk_rating: 'low' | 'medium' | 'high' | 'critical';
  executive_summary: string;
  risk_flags: Array<{ flag: string; severity: string; detail: string }>;
  data_gaps: string[];
  recommendations: string;
}

export async function generateRiskAssessment(companyData: any, lang: 'en' | 'sq' = 'en'): Promise<AIRiskAssessment> {
  // Always use computed assessment for consistency. AI API still available if key set.
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here' && lang === 'en') {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Analyze this Kosovo company:\n\n${JSON.stringify(companyData, null, 2)}` }],
      });
      const text = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('AI service failed, falling back to computed:', err);
    }
  }
  return computeAssessment(companyData, lang);
}

const T = {
  en: {
    suspended: { flag: 'Suspended status', detail: 'Company is currently suspended in the ARBK registry. Active commercial operations should not be assumed.' },
    deregistered: { flag: 'Deregistered', detail: 'Company has been deregistered. Legal entity does not exist for commercial purposes.' },
    liquidation: { flag: 'In liquidation', detail: 'Company is undergoing liquidation proceedings.' },
    unclear_status: 'Company status is unclear from registry data',
    very_new: (years: string) => ({ flag: 'Very new entity', detail: `Registered ${years} years ago. Insufficient operating history to assess track record.` }),
    limited_history: (years: string) => ({ flag: 'Limited operating history', detail: `Company has been operating for ${years} years.` }),
    reg_date_missing: 'Registration date missing',
    low_capital: (cap: string) => ({ flag: 'Minimal share capital', detail: `Declared capital of €${cap} is suspiciously low for commercial activity.` }),
    no_capital: 'Share capital not declared',
    no_owners: { flag: 'No ownership data', detail: 'Beneficial ownership information could not be retrieved.' },
    no_owners_gap: 'Beneficial owners not identified',
    anon_owners: { flag: 'Anonymous ownership', detail: 'Owner names appear generic or non-identifiable, suggesting opacity.' },
    capital_mismatch: (max: string) => ({ flag: 'Capital-contract mismatch', detail: `Largest contract (€${max}) is over 100x the declared share capital.` }),
    neg_news: (n: number, items: string) => ({ flag: `${n} negative news mention(s)`, detail: items }),
    p1: (name: string, form: string, age: string, sector: string, muni: string, status: string, cap: string) =>
      `${name} is a ${form}-registered business operating ${age} in the ${sector} sector, with its registered seat in ${muni}. The current registry status is ${status}, and declared share capital stands at €${cap}.`,
    p2: (n: number, owners: string, contracts: number, total: string, auth: string) =>
      `Ownership records identify ${n} authorized person(s)${n > 0 ? ' on file' : ', which constitutes a transparency concern'}. ${owners} Government procurement records show ${contracts} contract(s) totalling €${total}${contracts > 0 ? `, with the largest single contract awarded by ${auth}` : ''}.`,
    p3: (n: number, neg: number, flags: number) =>
      `Media screening across major Kosovo outlets identified ${n} relevant mention(s)${neg > 0 ? `, of which ${neg} carry negative sentiment relating to compliance, investigations, or operational concerns` : ' with neutral-to-positive sentiment overall'}. ${flags > 0 ? `${flags} specific risk indicator(s) have been catalogued in the flags section.` : 'No significant risk indicators were identified during this review.'}`,
    p4: (rating: string, score: number, action: string) =>
      `Overall risk rating: ${rating.toUpperCase()} (composite score ${score}/100). ${action}`,
    action_low: 'Standard commercial engagement may proceed subject to routine verification of counterparty details.',
    action_medium: 'Engagement is feasible but additional verification is recommended before commitment of material amounts.',
    action_high: 'Significant due diligence concerns identified. Legal review and direct counterparty verification required before any commitment.',
    action_critical: 'Critical findings preclude routine engagement. Direct legal counsel and enhanced due diligence are mandatory.',
    rec_low: 'Proceed with standard onboarding procedures. Periodically refresh registry and media checks during the relationship.',
    rec_medium: 'Request additional documentation: most recent financial statements, beneficial ownership declaration, and tax compliance certificate. Verify operational presence through site visit or independent reference checks.',
    rec_high: 'Engage external legal counsel. Require notarized ownership declarations. Verify all key claims through independent third-party sources before signing any commercial agreement.',
    rec_critical: 'Do not proceed without comprehensive legal review and explicit clearance from compliance. Consider whether the engagement is consistent with internal risk appetite.',
  },
  sq: {
    suspended: { flag: 'Status i pezulluar', detail: 'Kompania është aktualisht e pezulluar në regjistrin ARBK. Operacionet aktive komerciale nuk duhet të supozohen.' },
    deregistered: { flag: 'I çregjistruar', detail: 'Kompania është çregjistruar. Entiteti juridik nuk ekziston për qëllime komerciale.' },
    liquidation: { flag: 'Në likuidim', detail: 'Kompania është nën procedurë likuidimi.' },
    unclear_status: 'Statusi i kompanisë nuk është i qartë nga të dhënat e regjistrit',
    very_new: (years: string) => ({ flag: 'Entitet shumë i ri', detail: `I regjistruar para ${years} vitesh. Histori e pamjaftueshme operative për të vlerësuar performancën.` }),
    limited_history: (years: string) => ({ flag: 'Histori e kufizuar operative', detail: `Kompania ka funksionuar për ${years} vite.` }),
    reg_date_missing: 'Data e regjistrimit mungon',
    low_capital: (cap: string) => ({ flag: 'Kapital minimal', detail: `Kapitali i deklaruar prej €${cap} është dyshimisht i ulët për veprimtari komerciale.` }),
    no_capital: 'Kapitali themelor nuk është deklaruar',
    no_owners: { flag: 'Pa të dhëna pronësie', detail: 'Informacioni mbi pronarët përfitues nuk u arrit të merret.' },
    no_owners_gap: 'Pronarët përfitues nuk janë identifikuar',
    anon_owners: { flag: 'Pronësi anonime', detail: 'Emrat e pronarëve duken të përgjithshëm ose të paidentifikueshëm, duke sugjeruar mungesë transparence.' },
    capital_mismatch: (max: string) => ({ flag: 'Mospërputhje kapital-kontrata', detail: `Kontrata më e madhe (€${max}) është mbi 100x më e madhe se kapitali i deklaruar.` }),
    neg_news: (n: number, items: string) => ({ flag: `${n} përmendje negative në media`, detail: items }),
    p1: (name: string, form: string, age: string, sector: string, muni: string, status: string, cap: string) =>
      `${name} është një biznes i regjistruar si ${form} që operon ${age} në sektorin ${sector}, me seli të regjistruar në ${muni}. Statusi aktual i regjistrit është ${status}, dhe kapitali themelor i deklaruar është €${cap}.`,
    p2: (n: number, owners: string, contracts: number, total: string, auth: string) =>
      `Të dhënat e pronësisë identifikojnë ${n} person(a) të autorizuar${n > 0 ? ' në regjistër' : ', gjë që përbën shqetësim transparence'}. ${owners} Të dhënat e prokurimit publik tregojnë ${contracts} kontrata me vlerë totale €${total}${contracts > 0 ? `, me kontratën më të madhe të dhënë nga ${auth}` : ''}.`,
    p3: (n: number, neg: number, flags: number) =>
      `Shqyrtimi i mediave kryesore të Kosovës identifikoi ${n} përmendje relevante${neg > 0 ? `, nga të cilat ${neg} kanë sentiment negativ në lidhje me pajtueshmërinë, hetimet ose shqetësimet operative` : ' me sentiment neutral deri pozitiv në përgjithësi'}. ${flags > 0 ? `${flags} tregues specifikë rreziku janë katalogjizuar në seksionin e shqetësimeve.` : 'Nuk u identifikuan tregues të rëndësishëm rreziku gjatë këtij rishikimi.'}`,
    p4: (rating: string, score: number, action: string) =>
      `Vlerësimi i përgjithshëm i rrezikut: ${rating.toUpperCase()} (rezultat i kombinuar ${score}/100). ${action}`,
    action_low: 'Angazhimi standard komercial mund të vazhdojë, duke iu nënshtruar verifikimit rutinor të detajeve të palës.',
    action_medium: 'Angazhimi është i mundshëm, por verifikim shtesë rekomandohet para çdo angazhimi material.',
    action_high: 'Janë identifikuar shqetësime të rëndësishme. Kërkohet rishikim ligjor dhe verifikim i drejtpërdrejtë i palës para çdo angazhimi.',
    action_critical: 'Gjetjet kritike përjashtojnë angazhimin rutinor. Konsulence ligjore e drejtpërdrejtë dhe vlerësim i zgjeruar janë të detyrueshme.',
    rec_low: 'Vazhdoni me procedurat standarde të onboarding. Rifreskoni periodikisht kontrollet e regjistrit dhe mediave gjatë marrëdhënies.',
    rec_medium: 'Kërkoni dokumentacion shtesë: pasqyrat më të fundit financiare, deklaratë e pronësisë përfituese, dhe certifikatë e pajtueshmërisë tatimore. Verifikoni praninë operative përmes vizitës në vend ose kontrolleve të pavarura.',
    rec_high: 'Angazhoni këshilltar ligjor të jashtëm. Kërkoni deklarata të noteruara të pronësisë. Verifikoni të gjitha pretendimet kryesore përmes burimeve të pavarura para nënshkrimit të çdo marrëveshjeje komerciale.',
    rec_critical: 'Mos vazhdoni pa rishikim të plotë ligjor dhe pa pëlqim eksplicit nga compliance. Konsideroni nëse angazhimi është në përputhje me oreksin e brendshëm të rrezikut.',
  },
} as const;

function computeAssessment(data: any, lang: 'en' | 'sq' = 'en'): AIRiskAssessment {
  const c = data?.company || {};
  const persons = data?.persons || [];
  const procurement = data?.procurement || [];
  const news = data?.news || [];
  const L = T[lang];

  const flags: Array<{ flag: string; severity: string; detail: string }> = [];
  const gaps: string[] = [];
  let score = 20;

  const status = (c.status || '').toLowerCase();
  if (status === 'suspended') { score += 35; flags.push({ ...L.suspended, severity: 'high' }); }
  else if (status === 'deregistered') { score += 50; flags.push({ ...L.deregistered, severity: 'high' }); }
  else if (status === 'in_liquidation') { score += 40; flags.push({ ...L.liquidation, severity: 'high' }); }
  else if (status !== 'active') { score += 10; gaps.push(L.unclear_status); }

  if (c.registration_date) {
    const ageYears = (Date.now() - new Date(c.registration_date).getTime()) / (365 * 24 * 3600 * 1000);
    if (ageYears < 1) { score += 25; flags.push({ ...L.very_new(ageYears.toFixed(1)), severity: 'high' }); }
    else if (ageYears < 3) { score += 10; flags.push({ ...L.limited_history(ageYears.toFixed(1)), severity: 'medium' }); }
  } else { gaps.push(L.reg_date_missing); }

  const capital = parseFloat(c.share_capital_eur || 0);
  if (capital > 0 && capital < 1000) { score += 20; flags.push({ ...L.low_capital(capital.toLocaleString()), severity: 'high' }); }
  else if (capital === 0) { gaps.push(L.no_capital); }

  if (persons.length === 0) { score += 20; flags.push({ ...L.no_owners, severity: 'high' }); gaps.push(L.no_owners_gap); }
  else {
    const anon = persons.filter((p: any) => /unknown|anonymous|phantom|i panjohur/i.test(p.full_name || ''));
    if (anon.length > 0) { score += 25; flags.push({ ...L.anon_owners, severity: 'high' }); }
  }

  if (procurement.length > 0) {
    const max = Math.max(...procurement.map((p: any) => parseFloat(p.contract_value_eur) || 0));
    if (capital > 0 && max > capital * 100) {
      score += 15; flags.push({ ...L.capital_mismatch(max.toLocaleString()), severity: 'medium' });
    }
  }

  const negativeNews = news.filter((n: any) => n.sentiment === 'negative');
  if (negativeNews.length > 0) {
    score += Math.min(20, negativeNews.length * 8);
    const items = negativeNews.slice(0, 3).map((n: any) => `"${n.headline}" (${n.source_name})`).join('; ');
    flags.push({ ...L.neg_news(negativeNews.length, items), severity: negativeNews.length > 2 ? 'high' : 'medium' });
  }

  score = Math.min(100, Math.max(0, score));
  const rating: AIRiskAssessment['risk_rating'] = score <= 30 ? 'low' : score <= 60 ? 'medium' : score <= 80 ? 'high' : 'critical';

  const procTotal = procurement.reduce((s: number, p: any) => s + (parseFloat(p.contract_value_eur) || 0), 0);
  const ageStr = c.registration_date
    ? (lang === 'sq' ? `që nga ${c.registration_date.toString().split('T')[0].slice(0, 4)}` : `since ${c.registration_date.toString().split('T')[0].slice(0, 4)}`)
    : (lang === 'sq' ? 'me datë themelimi të padokumentuar' : 'with undocumented founding date');

  const ownersText = persons.length > 0
    ? (lang === 'sq'
        ? `Aksionerët kryesorë përfshijnë ${persons.slice(0, 3).map((p: any) => `${p.full_name} (${p.role || 'rol i papërcaktuar'})`).join(', ')}.`
        : `Principal stakeholders include ${persons.slice(0, 3).map((p: any) => `${p.full_name} (${p.role || 'unspecified role'})`).join(', ')}.`)
    : '';

  const actionKey = rating === 'low' ? 'action_low' : rating === 'medium' ? 'action_medium' : rating === 'high' ? 'action_high' : 'action_critical';
  const recKey = rating === 'low' ? 'rec_low' : rating === 'medium' ? 'rec_medium' : rating === 'high' ? 'rec_high' : 'rec_critical';

  const narrative = [
    L.p1(c.name || (lang === 'sq' ? 'Entiteti subjekt' : 'The subject entity'),
      c.legal_form || (lang === 'sq' ? 'kosovar' : 'Kosovo'),
      ageStr,
      c.primary_activity_description || (lang === 'sq' ? 'i papërcaktuar' : 'unspecified'),
      c.municipality || (lang === 'sq' ? 'një komunë e papublikuar' : 'an undisclosed municipality'),
      (c.status || 'unknown').toUpperCase(),
      capital.toLocaleString()),
    L.p2(persons.length, ownersText, procurement.length, procTotal.toLocaleString(),
      procurement[0]?.contracting_authority || (lang === 'sq' ? 'një autoritet publik' : 'a public authority')),
    L.p3(news.length, negativeNews.length, flags.length),
    L.p4(rating, score, L[actionKey]),
  ].join('\n\n');

  return {
    risk_score: score,
    risk_rating: rating,
    executive_summary: narrative,
    risk_flags: flags,
    data_gaps: gaps,
    recommendations: L[recKey],
  };
}
