import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';

const SENTIMENT_COLORS: Record<string, string> = { positive: '#16a34a', negative: '#dc2626', neutral: '#94a3b8' };

export default function CompanyDetail() {
  const { t } = useT();
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (id) api<any>(`/history/company/${id}`).then((r) => setHistory(r.history)).catch(() => {});
  }, [id]);

  useEffect(() => {
    api<any>(`/companies/${id}/public`).then(setData).catch(() => {});
  }, [id]);

  if (!data) return <div className="p-12 text-center text-slate-500">Loading...</div>;
  const { company, persons, procurement, news } = data;
  const totalProc = procurement.reduce((s: number, p: any) => s + Number(p.contract_value_eur || 0), 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <Link to="/companies" className="text-amber-600 text-sm">← {t('company.back')}</Link>

      <div className="mt-3 mb-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <span className={`text-sm px-3 py-1 rounded font-medium ${
            company.status === 'active' ? 'bg-green-100 text-green-800' :
            company.status === 'suspended' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>{company.status?.toUpperCase()}</span>
        </div>
        <p className="text-slate-600 mt-1">{company.primary_activity_description}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded p-4">
          <div className="text-xs text-slate-500 uppercase">{t('company.registration')}</div>
          <div className="font-bold mt-1">{company.registration_number || '—'}</div>
          <div className="text-sm text-slate-600">{company.registration_date?.split('T')[0]}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-xs text-slate-500 uppercase">{t('company.location')}</div>
          <div className="font-bold mt-1">{company.municipality}</div>
          <div className="text-sm text-slate-600">{company.address}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-xs text-slate-500 uppercase">{t('company.capital')}</div>
          <div className="font-bold mt-1">€ {Number(company.share_capital_eur || 0).toLocaleString()}</div>
          <div className="text-sm text-slate-600">{company.legal_form}</div>
        </div>
      </div>

      <section className="bg-white border rounded p-6 mb-6">
        <h2 className="font-bold mb-3">{t('company.owners')} ({persons.length})</h2>
        {persons.length === 0 ? <p className="text-sm text-slate-500">No data.</p> :
          <div className="space-y-2">
            {persons.map((p: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                <span className="font-medium">{p.full_name}</span>
                <span className="text-slate-600">{p.role} {p.ownership_percent ? `(${p.ownership_percent}%)` : ''}</span>
              </div>
            ))}
          </div>
        }
      </section>

      {procurement.length > 0 && (() => {
        const byYear: Record<string, number> = {};
        for (const p of procurement) {
          const y = (p.award_date || '').toString().slice(0, 4) || 'N/A';
          byYear[y] = (byYear[y] || 0) + Number(p.contract_value_eur || 0);
        }
        const chartData = Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([year, value]) => ({ year, value: Math.round(value) }));
        return (
          <section className="bg-white border rounded p-6 mb-6">
            <h2 className="font-bold mb-3">Procurement by year</h2>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => `€${Number(v).toLocaleString()}`} />
                  <Bar dataKey="value" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      })()}

      {news.length > 0 && (() => {
        const counts: Record<string, number> = {};
        for (const n of news) counts[n.sentiment || 'unknown'] = (counts[n.sentiment || 'unknown'] || 0) + 1;
        const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }));
        return (
          <section className="bg-white border rounded p-6 mb-6">
            <h2 className="font-bold mb-3">News sentiment</h2>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={75} label>
                    {pieData.map((entry) => <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || '#cbd5e1'} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      })()}

      {history.length > 1 && (
        <section className="bg-white border rounded p-6 mb-6">
          <h2 className="font-bold mb-3">Risk score history</h2>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={history.map((h) => ({ date: h.created_at?.slice(0, 10), score: h.risk_score }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#9333ea" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="bg-white border rounded p-6 mb-6">
        <h2 className="font-bold mb-3">{t('company.procurement')} ({procurement.length})</h2>
        <p className="text-sm text-slate-600 mb-3">{t('company.procurement.total')}: <strong>€ {totalProc.toLocaleString()}</strong></p>
        {procurement.length === 0 ? <p className="text-sm text-slate-500">{t('company.procurement.none')}</p> :
          <div className="space-y-2">
            {procurement.map((p: any, i: number) => (
              <div key={i} className="text-sm py-2 border-b last:border-0">
                <div className="font-medium">{p.tender_title}</div>
                <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                  <span>{p.contracting_authority} • {p.award_date?.split('T')[0]}</span>
                  <span className="font-bold text-slate-800">€ {Number(p.contract_value_eur || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        }
      </section>

      <section className="bg-white border rounded p-6 mb-6">
        <h2 className="font-bold mb-3">{t('company.news')} ({news.length})</h2>
        {news.length === 0 ? <p className="text-sm text-slate-500">{t('company.news.none')}</p> :
          <div className="space-y-3">
            {news.map((n: any, i: number) => (
              <div key={i} className="border-b last:border-0 pb-2">
                <div className="flex justify-between">
                  <div className="font-medium text-sm">{n.headline}</div>
                  <span className={`text-xs px-2 rounded ml-2 ${
                    n.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    n.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}>{n.sentiment}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{n.source_name} • {n.published_at?.split('T')[0]}</div>
                <div className="text-sm text-slate-700 mt-1">{n.summary}</div>
              </div>
            ))}
          </div>
        }
      </section>

      <div className="bg-amber-50 border-2 border-amber-300 rounded p-6 text-center">
        <h3 className="font-bold text-lg mb-2">{t('company.want_report')}</h3>
        <p className="text-sm text-slate-700 mb-3">{t('company.want_report.desc')}</p>
        <Link to={`/order?company=${company.id}`} className="inline-block bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded">
          {t('company.order_report')} →
        </Link>
      </div>

      {company.source_url && (
        <p className="text-xs text-slate-500 mt-6 text-center">
          {t('company.verify')} <a href={company.source_url} target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">ARBK</a>
        </p>
      )}
    </div>
  );
}
