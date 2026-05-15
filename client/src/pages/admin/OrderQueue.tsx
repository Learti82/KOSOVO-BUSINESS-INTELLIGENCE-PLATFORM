import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import AdminNav from './AdminNav';

export default function OrderQueue() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    api<any>('/analyst/orders').then((r) => setOrders(r.orders)).catch(() => {});
  }, []);

  const buckets = ['pending', 'in_progress', 'review', 'completed'] as const;
  const grouped: Record<string, any[]> = {};
  for (const b of buckets) grouped[b] = orders.filter((o) => o.status === b);

  return (
    <div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Order Queue</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {buckets.map((b) => (
            <div key={b} className="bg-slate-100 rounded p-3 min-h-[400px]">
              <h2 className="font-semibold uppercase text-xs mb-3">{b.replace('_', ' ')} ({grouped[b].length})</h2>
              <div className="space-y-2">
                {grouped[b].map((o) => (
                  <Link to={`/admin/orders/${o.id}`} key={o.id} className="block bg-white border rounded p-3 hover:shadow">
                    <div className="font-mono text-xs text-slate-500">{o.order_number}</div>
                    <div className="font-medium text-sm">{o.target_company_name}</div>
                    <div className="text-xs text-slate-600">{o.client_company || o.client_email}</div>
                    <div className="flex gap-1 mt-1">
                      <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">{o.report_type}</span>
                      {o.urgency !== 'standard' && <span className="text-xs bg-amber-200 px-2 py-0.5 rounded">{o.urgency}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
