import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const SYSTEM_PROMPT = `You are a senior business intelligence analyst specializing in Kosovo and Western Balkans markets.
You write professional due diligence reports for banks, investors, and law firms.

Analyze the provided company data and write:
1. An executive risk summary (3-4 paragraphs, professional tone)
2. A risk score from 0-100 where:
   - 0-30: Low risk — established, compliant, transparent
   - 31-60: Medium risk — some gaps or concerns, verify before proceeding
   - 61-80: High risk — significant concerns requiring investigation
   - 81-100: Critical risk — serious red flags, do not proceed without legal counsel
3. A list of specific risk flags found in the data

Risk factors to assess:
- Company status (active vs suspended/deregistered)
- Age of company (newer = higher risk)
- Owner opacity (missing owner info = red flag)
- Negative news mentions (scan for fraud, court cases, tax evasion)
- Procurement dependency (>80% revenue from government = concentration risk)
- Capital vs procurement value mismatch (low capital winning large contracts = red flag)
- Multiple companies with same owners (complex structures = due diligence flag)

Write in formal English. Be specific. Reference actual data points. Never invent data.
If data is missing, note it as a gap rather than assuming.

Return ONLY valid JSON:
{
  "risk_score": number,
  "risk_rating": "low|medium|high|critical",
  "executive_summary": "string",
  "risk_flags": [{"flag": "string", "severity": "low|medium|high", "detail": "string"}],
  "data_gaps": ["string"],
  "recommendations": "string"
}`;

export interface AIRiskAssessment {
  risk_score: number;
  risk_rating: 'low' | 'medium' | 'high' | 'critical';
  executive_summary: string;
  risk_flags: Array<{ flag: string; severity: string; detail: string }>;
  data_gaps: string[];
  recommendations: string;
}

export async function generateRiskAssessment(companyData: any): Promise<AIRiskAssessment> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockAssessment(companyData);
  }
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Analyze this company:\n\n${JSON.stringify(companyData, null, 2)}` }],
  });
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return JSON');
  return JSON.parse(jsonMatch[0]);
}

function mockAssessment(companyData: any): AIRiskAssessment {
  const status = companyData?.company?.status || 'unknown';
  const isActive = status === 'active';
  return {
    risk_score: isActive ? 35 : 78,
    risk_rating: isActive ? 'medium' : 'high',
    executive_summary: `Mock assessment for ${companyData?.company?.name || 'the subject company'}. Set ANTHROPIC_API_KEY for real AI analysis. Current status: ${status}.`,
    risk_flags: isActive ? [] : [{ flag: 'Inactive status', severity: 'high', detail: `Company status is ${status}` }],
    data_gaps: ['ANTHROPIC_API_KEY not configured — this is a mock response'],
    recommendations: 'Configure Claude API key to receive real risk analysis.',
  };
}
