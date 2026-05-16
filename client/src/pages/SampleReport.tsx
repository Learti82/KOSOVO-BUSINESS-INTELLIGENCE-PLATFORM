import { useState } from 'react';
import { useT } from '../lib/i18n';

export default function SampleReport() {
  const { lang, t } = useT();
  const [downloading, setDownloading] = useState<string | null>(null);

  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      price: 299,
      contains: [t('tier.basic.f1'), t('tier.basic.f2'), t('tier.basic.f3'), t('tier.basic.f4'), t('tier.basic.f5')],
      excluded: [t('tier.std.f2'), t('tier.std.f4'), t('tier.std.f5'), t('tier.comp.f3')],
      pages: `~5 ${t('sample.pages')}`,
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 599,
      contains: [t('tier.std.f1'), t('tier.std.f2'), t('tier.std.f3'), t('tier.std.f4'), t('tier.std.f5')],
      excluded: [t('tier.comp.f2'), t('tier.comp.f4'), t('tier.comp.f5')],
      pages: `~9 ${t('sample.pages')}`,
      featured: true,
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive',
      price: 1199,
      contains: [t('tier.comp.f1'), t('tier.comp.f2'), t('tier.comp.f3'), t('tier.comp.f4'), t('tier.comp.f5')],
      excluded: [],
      pages: `~14 ${t('sample.pages')}`,
    },
  ];

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
        <h1 className="text-4xl font-bold mb-3">{t('sample.title')}</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">{t('sample.subtitle')}</p>
        <p className="text-xs text-slate-500 mt-2">
          {t('sample.watermark_note')} <strong>{lang === 'sq' ? 'Shqip' : 'English'}</strong>
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tr) => (
          <div
            key={tr.id}
            className={`rounded-lg p-6 flex flex-col ${
              tr.featured ? 'bg-slate-900 text-white ring-4 ring-amber-500' : 'bg-white border'
            }`}
          >
            <h2 className="text-2xl font-bold">{tr.name}</h2>
            <div className="text-3xl font-bold my-3">€{tr.price}</div>
            <div className={`text-xs mb-4 ${tr.featured ? 'text-slate-400' : 'text-slate-500'}`}>{tr.pages}</div>

            <div className="space-y-1 text-sm mb-4">
              {tr.contains.map((c) => (
                <div key={c} className="flex">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{c}</span>
                </div>
              ))}
              {tr.excluded.map((c) => (
                <div key={c} className={`flex ${tr.featured ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="mr-2">✗</span>
                  <span className="line-through">{c}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => download(tr.id)}
              disabled={downloading === tr.id}
              className={`mt-auto py-2 rounded font-bold ${
                tr.featured ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-white'
              } disabled:opacity-50`}
            >
              {downloading === tr.id ? t('sample.generating') : `${t('sample.download')} ${tr.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-100 border rounded p-5 mt-10 text-center text-sm text-slate-700">
        {t('sample.live_note')}
      </div>
    </div>
  );
}
