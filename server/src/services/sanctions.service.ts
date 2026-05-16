import axios from 'axios';

export interface SanctionsHit {
  name: string;
  schema: string;
  datasets: string[];
  score: number;
  topics?: string[];
}

export async function searchSanctions(name: string): Promise<SanctionsHit[]> {
  if (!name || name.length < 3) return [];
  try {
    // OpenSanctions public API — no auth needed for basic search
    const res = await axios.get('https://api.opensanctions.org/search/default', {
      params: { q: name, limit: 5 },
      timeout: 8000,
      headers: { 'User-Agent': 'KosovaIntel/1.0' },
    });
    const results = (res.data?.results || []) as any[];
    return results
      .filter((r) => r.score > 0.6)
      .map((r) => ({
        name: r.caption || r.properties?.name?.[0] || name,
        schema: r.schema || 'unknown',
        datasets: r.datasets || [],
        score: r.score || 0,
        topics: r.properties?.topics || [],
      }));
  } catch (err) {
    console.error('Sanctions search failed:', (err as Error).message);
    return [];
  }
}

export async function checkPersonsAgainstSanctions(persons: Array<{ full_name: string }>): Promise<Array<{ person: string; hits: SanctionsHit[] }>> {
  const out: Array<{ person: string; hits: SanctionsHit[] }> = [];
  for (const p of persons) {
    if (!p.full_name) continue;
    const hits = await searchSanctions(p.full_name);
    out.push({ person: p.full_name, hits });
    await new Promise((r) => setTimeout(r, 200));
  }
  return out;
}
