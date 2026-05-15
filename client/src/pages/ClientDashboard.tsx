import { useEffect, useState } from 'react';
import { api, getToken } from '../lib/api';

export default function ClientDashboard() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    api<any>('/orders/client/orders').then((r) => setOrders(r.orders)).catch(() => {});
  }, []);

  const download = (id: number, num: string) => {
    fetch(`/api/client/orders/${id}/report`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.blob()).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${num}.pdf`; a.click();
      });
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.id} className="bg-white border rounded p-4 flex justify-between items-center">
            <div>
              <div className="font-bold">{o.order_number}</div>
              <div className="text-sm text-slate-600">{o.target_company_name}</div>
              <div className="text-xs text-slate-500">{o.report_type} • {o.urgency} • €{o.price_eur}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded ${o.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{o.status}</span>
              {o.status === 'completed' && <button onClick={() => download(o.id, o.order_number)} className="bg-slate-900 text-white px-4 py-1 rounded text-sm">Download</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
