import { useState } from 'react';
import { useT } from '../lib/i18n';

const TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 299,
    contains: ['Cover & risk badge', 'Short executive summary', 'Full company profile (ARBK)', 'Ownership table', 'Data sources'],
    excluded: ['Procurement history', 'Media & news screening', 'Analyst assessment', 'AI risk narrative & flags'],
    pages: '~3–4 pages',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 599,
    contains: ['Everything in Basic', 'Expanded executive summary', 'Full procurement history', 'Media & news screening with sentiment', 'Analyst written assessment + recommendations'],
    excluded: ['AI risk narrative (full)', 'Detailed risk flags'],
    pages: '~6–8 pages',
    featured: true,
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    price: 1199,
    contains: ['Everything in Standard', 'Full AI risk narrative (4 paragraphs)', 'Risk flags with severity & details', 'Composite 0–100 risk score', 'Extended analyst commentary'],
    excluded: [],
    pages: '~8–10 pages',
  },
];

export default function SampleReport() {
  const { lang } = useT();
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (tier: string) => {
    setDownloading(tier);
    try {
      const res = await fetch(`/api/samples/${tier}?lang=${lang}`);
      if (!res.ok) throw new Error('Sample failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KosovaIntel-Sample-${tier}-${lang}.pdf`;
      a.click();
    } catch (e: any) {
      alert(e.message);
    }
    setDownloading(null);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Sample Reports</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          See exactly what each report tier contains. All three samples are generated from real data on{' '}
          <strong>Kastrati Group Sh.P.K.</strong>, one of Kosovo's largest business groups.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          PDFs are watermarked <span className="font-mono text-red-600">SAMPLE</span> and labelled with their tier.
          Language: <strong>{lang === 'sq' ? 'Shqip' : 'English'}</strong> (toggle in header).
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {TIERS.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg p-6 flex flex-col ${
              t.featured ? 'bg-slate-900 text-white ring-4 ring-amber-500' : 'bg-white border'
            }`}
          >
            <h2 className="text-2xl font-bold">{t.name}</h2>
            <div className="text-3xl font-bold my-3">€{t.price}</div>
            <div className={`text-xs mb-4 ${t.featured ? 'text-slate-400' : 'text-slate-500'}`}>{t.pages}</div>

            <div className="space-y-1 text-sm mb-4">
              {t.contains.map((c) => (
                <div key={c} className="flex">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{c}</span>
                </div>
              ))}
              {t.excluded.map((c) => (
                <div key={c} className={`flex ${t.featured ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="mr-2">✗</span>
                  <span className="line-through">{c}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => download(t.id)}
              disabled={downloading === t.id}
              className={`mt-auto py-2 rounded font-bold ${
                t.featured ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-white'
              } disabled:opacity-50`}
            >
              {downloading === t.id ? 'Generating...' : `Download ${t.name} Sample`}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-100 border rounded p-5 mt-10 text-center text-sm text-slate-700">
        <strong>Note:</strong> Live reports do not have the SAMPLE watermark and include your company name as the named recipient. The data shown in all three samples is from public sources and was last refreshed during platform setup.
      </div>
    </div>
  );
}
