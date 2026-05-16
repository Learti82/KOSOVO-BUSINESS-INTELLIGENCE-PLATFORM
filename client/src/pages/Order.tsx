import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getUser } from '../lib/api';

export default function Order() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyMatches, setCompanyMatches] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [reportType, setReportType] = useState(params.get('tier') || 'standard');
  const [urgency, setUrgency] = useState('standard');
  const [form, setForm] = useState({ full_name: '', email: '', company_name: '', phone: '', use_case: 'bank', notes: '' });
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyQuery.length < 2) { setCompanyMatches([]); return; }
    const id = setTimeout(async () => {
      try { const r = await api<any>(`/companies/search?q=${encodeURIComponent(companyQuery)}`); setCompanyMatches(r.results); }
      catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [companyQuery]);

  const submit = async () => {
    setError(null);
    try {
      const user = getUser();
      const r = await api<any>('/orders/request', {
        method: 'POST',
        body: JSON.stringify({
          target_company_name: selectedCompany?.name || companyQuery,
          company_id: selectedCompany?.id,
          report_type: reportType, urgency,
          client_id: user?.id,
          client_notes: form.notes,
        }),
      });
      setOrderNumber(r.order.order_number);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (orderNumber) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-3xl font-bold mb-4">Order #{orderNumber} completed</h1>
        <p className="text-slate-600 mb-2">
          <strong>Demo Mode:</strong> Your report has been auto-generated and is ready to download.
        </p>
        <p className="text-sm text-slate-500 mb-6">
          (In production, the order would be marked pending until payment is confirmed and an analyst completes the review.)
        </p>
        <a href="/dashboard" className="inline-block bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded">
          Go to Dashboard to Download →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Order a Due Diligence Report</h1>
      <p className="text-slate-600 mb-8">Step {step} of 4</p>

      {step === 1 && (
        <div>
          <label className="block text-sm font-medium mb-2">Company name (search Kosovo registry)</label>
          <input
            value={companyQuery}
            onChange={(e) => { setCompanyQuery(e.target.value); setSelectedCompany(null); }}
            placeholder="Start typing..."
            className="w-full border rounded px-4 py-3"
          />
          {companyMatches.length > 0 && !selectedCompany && (
            <div className="border rounded mt-2 bg-white">
              {companyMatches.map((c) => (
                <button key={c.id} onClick={() => { setSelectedCompany(c); setCompanyQuery(c.name); }}
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100 border-b last:border-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.municipality} • {c.status}</div>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">Don't see the company? You can still proceed — we'll find it.</p>
          <button onClick={() => setStep(2)} disabled={!companyQuery} className="mt-6 bg-slate-900 text-white px-6 py-2 rounded disabled:opacity-50">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Report type</h2>
          {[
            { id: 'basic', label: 'Basic — €299', desc: 'Registration, ownership, status' },
            { id: 'standard', label: 'Standard — €599', desc: 'Basic + procurement + news' },
            { id: 'comprehensive', label: 'Comprehensive — €1,199', desc: 'Full due diligence with analyst' },
          ].map((t) => (
            <label key={t.id} className={`block border-2 rounded p-4 cursor-pointer ${reportType === t.id ? 'border-amber-500 bg-amber-50' : ''}`}>
              <input type="radio" checked={reportType === t.id} onChange={() => setReportType(t.id)} className="mr-3" />
              <span className="font-medium">{t.label}</span>
              <div className="text-sm text-slate-600 ml-7">{t.desc}</div>
            </label>
          ))}
          <h2 className="font-semibold mt-6">Urgency</h2>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'standard', label: '48h' }, { id: 'express', label: '24h (+50%)' }, { id: 'urgent', label: '12h (+100%)' }].map((u) => (
              <button key={u.id} onClick={() => setUrgency(u.id)} className={`border-2 py-2 rounded ${urgency === u.id ? 'border-amber-500 bg-amber-50' : ''}`}>
                {u.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2 border rounded">Back</button>
            <button onClick={() => setStep(3)} className="bg-slate-900 text-white px-6 py-2 rounded">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border rounded px-4 py-2" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-4 py-2" />
          <input placeholder="Your company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full border rounded px-4 py-2" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-4 py-2" />
          <select value={form.use_case} onChange={(e) => setForm({ ...form, use_case: e.target.value })} className="w-full border rounded px-4 py-2">
            <option value="bank">Bank / Lender</option>
            <option value="law_firm">Law Firm</option>
            <option value="investor">Foreign Investor</option>
            <option value="business">Local Business</option>
            <option value="other">Other</option>
          </select>
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-4 py-2" rows={3} />
          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(2)} className="px-6 py-2 border rounded">Back</button>
            <button onClick={() => setStep(4)} className="bg-slate-900 text-white px-6 py-2 rounded">Review</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="bg-slate-50 border rounded p-4 mb-4">
            <div><strong>Subject:</strong> {selectedCompany?.name || companyQuery}</div>
            <div><strong>Report:</strong> {reportType} ({urgency})</div>
            <div><strong>Requester:</strong> {form.full_name} — {form.company_name}</div>
          </div>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-3">{error}</div>}
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="px-6 py-2 border rounded">Back</button>
            <button onClick={submit} className="bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded">Submit Order</button>
          </div>
        </div>
      )}
    </div>
  );
}
