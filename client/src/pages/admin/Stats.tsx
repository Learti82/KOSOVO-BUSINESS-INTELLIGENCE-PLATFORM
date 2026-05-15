import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import AdminNav from './AdminNav';

export default function Stats() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { api<any>('/analyst/stats').then(setStats).catch(() => {}); }, []);

  if (!stats) return <><AdminNav /><div className="p-12">Loading...</div></>;

  return (
    <div>
      <AdminNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Platform Stats</h1>
        <div className="grid md:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
}
