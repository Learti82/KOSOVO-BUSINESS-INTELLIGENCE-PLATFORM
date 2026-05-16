import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CourtCase {
  case_id?: string;
  title?: string;
  court?: string;
  date?: string;
  url?: string;
  excerpt?: string;
}

// Kosovo Supreme Court bulletins live at https://supreme.gjyqesori-rks.org
// Their search is JS-rendered, so we hit the public bulletin index instead
export async function searchCourtCases(query: string): Promise<CourtCase[]> {
  if (!query || query.length < 3) return [];
  try {
    const url = `https://supreme.gjyqesori-rks.org/?s=${encodeURIComponent(query)}&lang=en`;
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'KosovaIntel/1.0' },
    });
    const $ = cheerio.load(res.data);
    const cases: CourtCase[] = [];
    $('article, .search-result, .post').slice(0, 10).each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .entry-title').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const excerpt = $el.find('p, .entry-summary').first().text().trim().slice(0, 240);
      if (title) cases.push({ title, url: link, excerpt, court: 'Supreme Court of Kosovo' });
    });
    return cases;
  } catch (err) {
    console.error('Court search failed:', (err as Error).message);
    return [];
  }
}
