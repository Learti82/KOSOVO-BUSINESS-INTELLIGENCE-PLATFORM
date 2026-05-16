import { useState } from 'react';
import { api, getUser } from '../lib/api';

export default function BulkOrder() {
  const [csvText, setCsvText] = useState('');
  const [reportType, setReportType] = useState('standard');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const user = getUser();

  if (!user) return <div className="p-12 text-center">Please log in first.</div>;

  const submit = async () => {
    setError(null);
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return setError('Paste at least one company name per line.');
    const items = lines.map((company_name) => ({ company_name, report_type: reportType, urgency: 'standard' }));
    try {
      const r = await api<any>('/bulk/orders', { method: 'POST', body: JSON.stringify({ items }) });
      setResult(r);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-2">Bulk order</h1>
      <p className="text-slate-600 mb-6 text-sm">Paste one company name per line. We'll create one order for each at the selected tier.</p>
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={10}
        placeholder={`Kastrati Group Sh.P.K.\nRaiffeisen Bank Kosovo Sh.A.\nIPKO Telecommunications Sh.P.K.\n...`}
        className="w-full border rounded p-3 font-mono text-sm"
      />
      <div className="flex gap-3 my-4 items-center">
        <label className="text-sm font-medium">Report tier:</label>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="border rounded px-3 py-1">
          <option value="basic">Basic — €299</option>
          <option value="standard">Standard — €599</option>
          <option value="comprehensive">Comprehensive — €1,199</option>
        </select>
        <button onClick={submit} className="ml-auto bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded">
          Create batch
        </button>
      </div>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
      {result && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h3 className="font-bold mb-2">✓ Batch #{result.batch_id} created — {result.count} orders</h3>
          <div className="text-sm">
            {result.orders.map((o: any) => (
              <div key={o.id} className="flex justify-between border-b py-1">
                <span>{o.order_number} — {o.target_company_name}</span>
                <span className="font-bold">€{o.price_eur}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
