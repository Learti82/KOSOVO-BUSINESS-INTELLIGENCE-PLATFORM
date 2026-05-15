import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import AdminNav from './AdminNav';

export default function ScraperPanel() {
  const [name, setName] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const loadJobs = () => api<any>('/analyst/scrape/jobs').then((r) => setJobs(r.jobs));

  useEffect(() => { loadJobs(); const i = setInterval(loadJobs, 5000); return () => clearInterval(i); }, []);

  const trigger = async () => {
    setBusy(true);
    try { const r = await api<any>('/analyst/scrape/company', { method: 'POST', body: JSON.stringify({ name }) }); setResult(r); }
    catch (e: any) { setResult({ error: e.message }); }
    setBusy(false); loadJobs();
  };

  return (
    <div>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Scraper Control</h1>
        <div className="bg-white border rounded p-4 mb-6">
          <h3 className="font-semibold mb-2">Trigger company scrape</h3>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" className="flex-1 border rounded px-4 py-2" />
            <button onClick={trigger} disabled={busy} className="bg-slate-900 text-white px-6 py-2 rounded">{busy ? 'Running...' : 'Scrape'}</button>
          </div>
          {result && <pre className="mt-3 bg-slate-100 p-3 text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
        </div>
        <div className="bg-white border rounded">
          <h3 className="font-semibold p-3 border-b">Recent jobs</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="text-left p-2">Type</th><th className="text-left">Target</th><th>Status</th><th>Records</th><th>Started</th></tr></thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="p-2">{j.job_type}</td>
                  <td>{j.target}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded ${j.status === 'completed' ? 'bg-green-100' : j.status === 'failed' ? 'bg-red-100' : 'bg-amber-100'}`}>{j.status}</span></td>
                  <td className="text-center">{j.records_processed}</td>
                  <td className="text-xs">{j.started_at && new Date(j.started_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
