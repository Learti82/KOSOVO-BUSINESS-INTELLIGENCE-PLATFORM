import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getUser } from '../lib/api';
import { useT } from '../lib/i18n';

export default function Order() {
  const { t } = useT();
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
        <h1 className="text-3xl font-bold mb-4">{t('order.received')} #{orderNumber}</h1>
        <p className="text-slate-600 mb-2">
          <strong>Demo Mode:</strong> {t('order.demo_note')}
        </p>
        <p className="text-sm text-slate-500 mb-6">{t('order.demo_paren')}</p>
        <a href="/dashboard" className="inline-block bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded">
          {t('order.go_dashboard')} →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">{t('order.title')}</h1>
      <p className="text-slate-600 mb-8">{t('order.step')} {step} {t('order.of')} 4</p>

      {step === 1 && (
        <div>
          <label className="block text-sm font-medium mb-2">{t('order.company_label')}</label>
          <input
            value={companyQuery}
            onChange={(e) => { setCompanyQuery(e.target.value); setSelectedCompany(null); }}
            placeholder={t('order.company_placeholder')}
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
          <button onClick={() => setStep(2)} disabled={!companyQuery} className="mt-6 bg-slate-900 text-white px-6 py-2 rounded disabled:opacity-50">{t('order.next')}</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold">{t('order.report_type')}</h2>
          {[
            { id: 'basic', label: 'Basic — €299' },
            { id: 'standard', label: 'Standard — €599' },
            { id: 'comprehensive', label: 'Comprehensive — €1,199' },
          ].map((tr) => (
            <label key={tr.id} className={`block border-2 rounded p-4 cursor-pointer ${reportType === tr.id ? 'border-amber-500 bg-amber-50' : ''}`}>
              <input type="radio" checked={reportType === tr.id} onChange={() => setReportType(tr.id)} className="mr-3" />
              <span className="font-medium">{tr.label}</span>
            </label>
          ))}
          <h2 className="font-semibold mt-6">{t('order.urgency')}</h2>
          <div className="grid grid-cols-3 gap-2">
            {[{ id: 'standard', label: '48h' }, { id: 'express', label: '24h (+50%)' }, { id: 'urgent', label: '12h (+100%)' }].map((u) => (
              <button key={u.id} onClick={() => setUrgency(u.id)} className={`border-2 py-2 rounded ${urgency === u.id ? 'border-amber-500 bg-amber-50' : ''}`}>
                {u.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2 border rounded">{t('order.back')}</button>
            <button onClick={() => setStep(3)} className="bg-slate-900 text-white px-6 py-2 rounded">{t('order.next')}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <input placeholder={t('order.full_name')} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border rounded px-4 py-2" />
          <input placeholder={t('order.email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-4 py-2" />
          <input placeholder={t('order.your_company')} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full border rounded px-4 py-2" />
          <input placeholder={t('order.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-4 py-2" />
          <textarea placeholder={t('order.notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-4 py-2" rows={3} />
          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(2)} className="px-6 py-2 border rounded">{t('order.back')}</button>
            <button onClick={() => setStep(4)} className="bg-slate-900 text-white px-6 py-2 rounded">{t('order.review')}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="bg-slate-50 border rounded p-4 mb-4">
            <div><strong>{t('order.subject')}:</strong> {selectedCompany?.name || companyQuery}</div>
            <div><strong>{t('order.report')}:</strong> {reportType} ({urgency})</div>
            <div><strong>{t('order.requester')}:</strong> {form.full_name} — {form.company_name}</div>
          </div>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-3">{error}</div>}
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="px-6 py-2 border rounded">{t('order.back')}</button>
            <button onClick={submit} className="bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded">{t('order.submit')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
