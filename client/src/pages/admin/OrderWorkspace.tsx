import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import AdminNav from './AdminNav';

export default function OrderWorkspace() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [draft, setDraft] = useState<any>({ analyst_summary: '', analyst_risk_rating: 'medium', analyst_recommendations: '', analyst_flags: [] });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => api<any>(`/analyst/orders/${id}`).then((r) => {
    setData(r);
    if (r.report) {
      setDraft({
        analyst_summary: r.report.analyst_summary || '',
        analyst_risk_rating: r.report.analyst_risk_rating || 'medium',
        analyst_recommendations: r.report.analyst_recommendations || '',
        analyst_flags: r.report.analyst_flags || [],
      });
    }
  });

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setBusy('save');
    await api(`/analyst/reports/${id}`, { method: 'PUT', body: JSON.stringify(draft) });
    setMsg('Draft saved'); setBusy(null); setTimeout(() => setMsg(null), 2000);
  };

  const rescrape = async () => {
    setBusy('scrape'); setMsg('Scraping...');
    try { await api(`/analyst/companies/${data.order.company_id}/scrape`, { method: 'POST' }); setMsg('Scrape complete'); load(); }
    catch (e: any) { setMsg('Scrape failed: ' + e.message); }
    setBusy(null);
  };

  const generateAI = async () => {
    setBusy('ai'); setMsg('Generating AI narrative...');
    try { await api(`/analyst/reports/${id}/generate-ai`, { method: 'POST' }); setMsg('AI narrative generated'); load(); }
    catch (e: any) { setMsg('AI failed: ' + e.message); }
    setBusy(null);
  };

  const generatePDF = async () => {
    setBusy('pdf'); setMsg('Generating PDF...');
    try { await api(`/analyst/reports/${id}/generate-pdf`, { method: 'POST' }); setMsg('PDF ready'); }
    catch (e: any) { setMsg('PDF failed: ' + e.message); }
    setBusy(null);
  };

  const publish = async () => {
    if (!confirm('Publish and notify the client?')) return;
    setBusy('publish');
    await api(`/analyst/reports/${id}/publish`, { method: 'POST' });
    setMsg('Published'); setBusy(null); load();
  };

  if (!data) return <div className="p-12">Loading...</div>;
  const o = data.order;

  return (
    <div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">{o.order_number} — {o.target_company_name}</h1>
            <div className="text-sm text-slate-600">{o.client_company || o.client_email} • {o.report_type} • {o.urgency} • Status: {o.status}</div>
          </div>
          {msg && <div className="text-sm bg-amber-100 px-4 py-2 rounded">{msg}</div>}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT — Data */}
          <div className="space-y-4">
            <div className="bg-white border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Company Data (ARBK)</h3>
                <button onClick={rescrape} disabled={busy === 'scrape'} className="text-xs bg-slate-900 text-white px-3 py-1 rounded">Rescrape</button>
              </div>
              {data.company ? (
                <dl className="text-sm space-y-1">
                  <div><dt className="inline font-medium">Name: </dt><dd className="inline">{data.company.name}</dd></div>
                  <div><dt className="inline font-medium">Reg #: </dt><dd className="inline">{data.company.registration_number}</dd></div>
                  <div><dt className="inline font-medium">Status: </dt><dd className="inline">{data.company.status}</dd></div>
                  <div><dt className="inline font-medium">Municipality: </dt><dd className="inline">{data.company.municipality}</dd></div>
                  <div><dt className="inline font-medium">Capital: </dt><dd className="inline">€{data.company.share_capital_eur}</dd></div>
                </dl>
              ) : <p className="text-sm text-slate-500">No company linked.</p>}
            </div>

            <div className="bg-white border rounded p-4">
              <h3 className="font-semibold mb-2">Owners ({data.persons.length})</h3>
              {data.persons.map((p: any) => (
                <div key={p.id} className="text-sm border-b last:border-0 py-1">{p.full_name} <span className="text-slate-500">— {p.role} {p.ownership_percent && `(${p.ownership_percent}%)`}</span></div>
              ))}
            </div>

            <div className="bg-white border rounded p-4">
              <h3 className="font-semibold mb-2">Procurement ({data.procurement.length})</h3>
              {data.procurement.slice(0, 10).map((p: any) => (
                <div key={p.id} className="text-sm border-b last:border-0 py-1">
                  <div className="font-medium">{p.tender_title}</div>
                  <div className="text-xs text-slate-500">{p.contracting_authority} • €{parseFloat(p.contract_value_eur || 0).toLocaleString()} • {p.award_date}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border rounded p-4">
              <h3 className="font-semibold mb-2">News ({data.news.length})</h3>
              {data.news.map((n: any) => (
                <div key={n.id} className="text-sm border-b last:border-0 py-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{n.headline}</span>
                    <span className={`text-xs px-2 ml-2 rounded ${n.sentiment === 'positive' ? 'bg-green-100' : n.sentiment === 'negative' ? 'bg-red-100' : 'bg-slate-100'}`}>{n.sentiment}</span>
                  </div>
                  <div className="text-xs text-slate-500">{n.source_name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Editor */}
          <div className="space-y-4">
            <div className="bg-white border rounded p-4 space-y-3">
              <h3 className="font-semibold">Report Editor</h3>
              <label className="block text-sm font-medium">Analyst summary</label>
              <textarea rows={5} value={draft.analyst_summary} onChange={(e) => setDraft({ ...draft, analyst_summary: e.target.value })} className="w-full border rounded p-2 text-sm" />

              <label className="block text-sm font-medium">Risk rating</label>
              <select value={draft.analyst_risk_rating} onChange={(e) => setDraft({ ...draft, analyst_risk_rating: e.target.value })} className="w-full border rounded p-2 text-sm">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>

              <label className="block text-sm font-medium">Recommendations</label>
              <textarea rows={3} value={draft.analyst_recommendations} onChange={(e) => setDraft({ ...draft, analyst_recommendations: e.target.value })} className="w-full border rounded p-2 text-sm" />

              <div className="flex gap-2 flex-wrap pt-2">
                <button onClick={save} disabled={busy === 'save'} className="bg-slate-700 text-white px-4 py-2 rounded text-sm">Save Draft</button>
                <button onClick={generateAI} disabled={busy === 'ai'} className="bg-purple-700 text-white px-4 py-2 rounded text-sm">Generate AI Narrative</button>
                <button onClick={generatePDF} disabled={busy === 'pdf'} className="bg-blue-700 text-white px-4 py-2 rounded text-sm">Generate PDF</button>
                <button onClick={publish} disabled={busy === 'publish'} className="bg-green-700 text-white px-4 py-2 rounded text-sm">Publish & Notify</button>
              </div>
            </div>

            {data.report?.ai_risk_narrative && (
              <div className="bg-purple-50 border border-purple-200 rounded p-4">
                <h3 className="font-semibold mb-2">AI Analysis (score: {data.report.ai_risk_score})</h3>
                <p className="text-sm whitespace-pre-wrap">{data.report.ai_risk_narrative}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
