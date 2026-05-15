import axios from 'axios';
import * as cheerio from 'cheerio';

const UA = 'KosovaIntel-DataCollector/1.0 (business intelligence; contact@kosovaintel.com)';

export interface NewsMention {
  headline: string;
  summary?: string;
  source_name: string;
  source_url: string;
  published_at?: string;
  sentiment?: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SOURCES = [
  { name: 'Koha', url: (q: string) => `https://www.koha.net/search?q=${encodeURIComponent(q)}` },
  { name: 'Gazeta Express', url: (q: string) => `https://www.gazetaexpress.com/?s=${encodeURIComponent(q)}` },
  { name: 'Prishtina Insight', url: (q: string) => `https://prishtinainsight.com/?s=${encodeURIComponent(q)}` },
  { name: 'Zëri', url: (q: string) => `https://zeri.info/?s=${encodeURIComponent(q)}` },
];

export async function scrapeNewsForCompany(query: string): Promise<NewsMention[]> {
  const results: NewsMention[] = [];
  for (const source of SOURCES) {
    try {
      const resp = await axios.get(source.url(query), {
        headers: { 'User-Agent': UA },
        timeout: 12000,
      });
      const $ = cheerio.load(resp.data);
      $('article, .article-item, .post, .search-result').slice(0, 5).each((_, el) => {
        const $a = $(el);
        const headline = $a.find('h2, h3, .title').first().text().trim();
        const href = $a.find('a').first().attr('href');
        const summary = $a.find('p, .excerpt').first().text().trim().slice(0, 300);
        if (headline && href) {
          results.push({
            headline,
            summary,
            source_name: source.name,
            source_url: href.startsWith('http') ? href : `${new URL(source.url(query)).origin}${href}`,
            sentiment: 'unknown',
          });
        }
      });
      await delay(1500);
    } catch (err) {
      console.error(`News scrape failed (${source.name}):`, (err as Error).message);
    }
  }
  return results;
}
