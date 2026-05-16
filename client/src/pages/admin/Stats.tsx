import { useEffect, useState } from 'react';
import { api, getToken } from '../../lib/api';
import AdminNav from './AdminNav';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { api<any>('/analyst/stats').then(setStats).catch(() => {}); }, []);

  const downloadCSV = (which: string) => {
    fetch(`/api/analyst/export/${which}.csv`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kosovaintel-${which}.csv`;
        a.click();
      });
  };

  if (!stats) return <><AdminNav /><div className="p-12">Loading...</div></>;

  return (
    <div>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Platform Stats</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border rounded p-6">
            <div className="text-sm text-slate-500">Total Revenue (paid)</div>
            <div className="text-3xl font-bold mt-2">€{stats.total_revenue_eur.toLocaleString()}</div>
          </div>
          <div className="bg-white border rounded p-6">
            <div className="text-sm text-slate-500">Indexed Companies</div>
            <div className="text-3xl font-bold mt-2">{stats.indexed_companies}</div>
          </div>
          <div className="bg-white border rounded p-6">
            <div className="text-sm text-slate-500">Orders by status</div>
            <div className="text-sm mt-2">
              {stats.orders_by_status.map((s: any) => <div key={s.status} className="flex justify-between"><span>{s.status}</span><strong>{s.count}</strong></div>)}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded p-6">
          <h2 className="font-bold mb-3">CSV Exports</h2>
          <p className="text-sm text-slate-600 mb-4">Download platform data for offline analysis or pipeline ingestion.</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => downloadCSV('companies')} className="bg-slate-900 text-white px-4 py-2 rounded text-sm">Companies CSV</button>
            <button onClick={() => downloadCSV('procurement')} className="bg-slate-900 text-white px-4 py-2 rounded text-sm">Procurement CSV</button>
            <button onClick={() => downloadCSV('orders')} className="bg-slate-900 text-white px-4 py-2 rounded text-sm">Orders CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}
