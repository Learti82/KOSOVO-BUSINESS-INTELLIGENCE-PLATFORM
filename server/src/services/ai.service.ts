import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a senior business intelligence analyst specializing in Kosovo and Western Balkans markets.
You write professional due diligence reports for banks, investors, and law firms.

Analyze the provided company data and return ONLY valid JSON in this exact shape:
{
  "risk_score": number (0-100),
  "risk_rating": "low" | "medium" | "high" | "critical",
  "executive_summary": "3-4 paragraph professional narrative",
  "risk_flags": [{"flag": "string", "severity": "low|medium|high", "detail": "string"}],
  "data_gaps": ["string"],
  "recommendations": "string"
}

Risk scoring:
- 0-30 low: established, transparent, active
- 31-60 medium: some gaps, verify before proceeding
- 61-80 high: significant concerns
- 81-100 critical: serious red flags

Assess: company status, age, ownership transparency, negative news, procurement dependency,
capital-vs-contract-value mismatches, complex ownership structures.

Write formally. Reference specific data points. Never invent data. Flag missing data as gaps.`;

export interface AIRiskAssessment {
  risk_score: number;
  risk_rating: 'low' | 'medium' | 'high' | 'critical';
  executive_summary: string;
  risk_flags: Array<{ flag: string; severity: string; detail: string }>;
  data_gaps: string[];
  recommendations: string;
}

export async function generateRiskAssessment(companyData: any): Promise<AIRiskAssessment> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return computeAssessment(companyData);
  }
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
    if (!jsonMatch) throw new Error('AI did not return JSON');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('AI service failed, falling back to computed assessment:', err);
    return computeAssessment(companyData);
  }
}

// Computed risk assessment — produces professional output without an API key
function computeAssessment(data: any): AIRiskAssessment {
  const c = data?.company || {};
  const persons = data?.persons || [];
  const procurement = data?.procurement || [];
  const news = data?.news || [];

  const flags: Array<{ flag: string; severity: string; detail: string }> = [];
  const gaps: string[] = [];
  let score = 20;

  const status = (c.status || '').toLowerCase();
  if (status === 'suspended') {
    score += 35;
    flags.push({ flag: 'Suspended status', severity: 'high', detail: 'Company is currently suspended in the ARBK registry. Active commercial operations should not be assumed.' });
  } else if (status === 'deregistered') {
    score += 50;
    flags.push({ flag: 'Deregistered', severity: 'high', detail: 'Company has been deregistered. Legal entity does not exist for commercial purposes.' });
  } else if (status === 'in_liquidation') {
    score += 40;
    flags.push({ flag: 'In liquidation', severity: 'high', detail: 'Company is undergoing liquidation proceedings.' });
  } else if (status !== 'active') {
    score += 10;
    gaps.push('Company status is unclear from registry data');
  }

  // Age
  if (c.registration_date) {
    const ageYears = (Date.now() - new Date(c.registration_date).getTime()) / (365 * 24 * 3600 * 1000);
    if (ageYears < 1) {
      score += 25;
      flags.push({ flag: 'Very new entity', severity: 'high', detail: `Registered ${ageYears.toFixed(1)} years ago. Insufficient operating history to assess track record.` });
    } else if (ageYears < 3) {
      score += 10;
      flags.push({ flag: 'Limited operating history', severity: 'medium', detail: `Company has been operating for ${ageYears.toFixed(1)} years.` });
    }
  } else {
    gaps.push('Registration date missing');
  }

  // Capital
  const capital = parseFloat(c.share_capital_eur || 0);
  if (capital > 0 && capital < 1000) {
    score += 20;
    flags.push({ flag: 'Minimal share capital', severity: 'high', detail: `Declared capital of €${capital.toLocaleString()} is suspiciously low for commercial activity.` });
  } else if (capital === 0) {
    gaps.push('Share capital not declared');
  }

  // Ownership transparency
  if (persons.length === 0) {
    score += 20;
    flags.push({ flag: 'No ownership data', severity: 'high', detail: 'Beneficial ownership information could not be retrieved.' });
    gaps.push('Beneficial owners not identified');
  } else {
    const anonymousOwners = persons.filter((p: any) => /unknown|anonymous|phantom/i.test(p.full_name || ''));
    if (anonymousOwners.length > 0) {
      score += 25;
      flags.push({ flag: 'Anonymous ownership', severity: 'high', detail: 'Owner names appear generic or non-identifiable, suggesting opacity.' });
    }
  }

  // Procurement vs capital mismatch
  if (procurement.length > 0) {
    const maxContract = Math.max(...procurement.map((p: any) => parseFloat(p.contract_value_eur) || 0));
    if (capital > 0 && maxContract > capital * 100) {
      score += 15;
      flags.push({ flag: 'Capital-contract mismatch', severity: 'medium', detail: `Largest contract (€${maxContract.toLocaleString()}) is over 100x the declared share capital.` });
    }
  }

  // News sentiment
  const negativeNews = news.filter((n: any) => n.sentiment === 'negative');
  if (negativeNews.length > 0) {
    score += Math.min(20, negativeNews.length * 8);
    flags.push({
      flag: `${negativeNews.length} negative news mention(s)`,
      severity: negativeNews.length > 2 ? 'high' : 'medium',
      detail: negativeNews.slice(0, 3).map((n: any) => `"${n.headline}" (${n.source_name})`).join('; '),
    });
  }

  score = Math.min(100, Math.max(0, score));
  const rating: AIRiskAssessment['risk_rating'] = score <= 30 ? 'low' : score <= 60 ? 'medium' : score <= 80 ? 'high' : 'critical';

  // Build narrative
  const procTotal = procurement.reduce((s: number, p: any) => s + (parseFloat(p.contract_value_eur) || 0), 0);
  const ageStr = c.registration_date ? `since ${c.registration_date.toString().split('T')[0].slice(0, 4)}` : 'with undocumented founding date';

  const narrative = [
    `${c.name || 'The subject entity'} is a ${c.legal_form || 'Kosovo'}-registered business operating ${ageStr} in the ${c.primary_activity_description || 'unspecified'} sector, with its registered seat in ${c.municipality || 'an undisclosed municipality'}. The current registry status is ${(c.status || 'unknown').toUpperCase()}, and declared share capital stands at €${capital.toLocaleString()}.`,

    `Ownership records identify ${persons.length} authorized person(s)${persons.length > 0 ? ' on file' : ''}${persons.length === 0 ? ', which constitutes a transparency concern' : ''}. ${persons.length > 0 ? `Principal stakeholders include ${persons.slice(0, 3).map((p: any) => `${p.full_name} (${p.role || 'unspecified role'})`).join(', ')}.` : ''} Government procurement records show ${procurement.length} contract(s) totalling €${procTotal.toLocaleString()}${procurement.length > 0 ? `, with the largest single contract awarded by ${procurement[0]?.contracting_authority || 'a public authority'}` : ''}.`,

    `Media screening across major Kosovo outlets identified ${news.length} relevant mention(s)${negativeNews.length > 0 ? `, of which ${negativeNews.length} carry negative sentiment relating to compliance, investigations, or operational concerns` : ' with neutral-to-positive sentiment overall'}. ${flags.length > 0 ? `${flags.length} specific risk indicator(s) have been catalogued in the flags section.` : 'No significant risk indicators were identified during this review.'}`,

    `Overall risk rating: ${rating.toUpperCase()} (composite score ${score}/100). ${
      rating === 'low' ? 'Standard commercial engagement may proceed subject to routine verification of counterparty details.' :
      rating === 'medium' ? 'Engagement is feasible but additional verification is recommended before commitment of material amounts.' :
      rating === 'high' ? 'Significant due diligence concerns identified. Legal review and direct counterparty verification required before any commitment.' :
      'Critical findings preclude routine engagement. Direct legal counsel and enhanced due diligence are mandatory.'
    }`,
  ].join('\n\n');

  const recommendations = rating === 'low'
    ? 'Proceed with standard onboarding procedures. Periodically refresh registry and media checks during the relationship.'
    : rating === 'medium'
    ? 'Request additional documentation: most recent financial statements, beneficial ownership declaration, and tax compliance certificate. Verify operational presence through site visit or independent reference checks.'
    : rating === 'high'
    ? 'Engage external legal counsel. Require notarized ownership declarations. Verify all key claims through independent third-party sources before signing any commercial agreement.'
    : 'Do not proceed without comprehensive legal review and explicit clearance from compliance. Consider whether the engagement is consistent with internal risk appetite.';

  return {
    risk_score: score,
    risk_rating: rating,
    executive_summary: narrative,
    risk_flags: flags,
    data_gaps: gaps,
    recommendations,
  };
}
