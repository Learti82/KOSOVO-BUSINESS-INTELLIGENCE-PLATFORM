import { useEffect, useState } from 'react';
import { api, getToken } from '../lib/api';
import { useT } from '../lib/i18n';

export default function ClientDashboard() {
  const { t } = useT();
  const [orders, setOrders] = useState<any[]>([]);
  const [pdfLang, setPdfLang] = useState<'en' | 'sq'>('en');

  useEffect(() => {
    api<any>('/orders/client/orders').then((r) => setOrders(r.orders)).catch(() => {});
  }, []);

  const uploadDoc = async (orderId: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`/api/uploads/orders/${orderId}/document`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    if (!r.ok) { const e = await r.json(); alert(e.error || 'Upload failed'); return; }
    alert('Document uploaded ✓');
  };

  const download = (id: number, num: string) => {
    fetch(`/api/client/orders/${id}/report?lang=${pdfLang}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: 'Download failed' }));
          throw new Error(err.error || 'Download failed');
        }
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KosovaIntel-${num}-${pdfLang}.pdf`;
        a.click();
      })
      .catch((e) => alert(e.message));
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">{t('dashboard.download.lang')}</span>
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setPdfLang('en')}
              className={`px-3 py-1 text-sm ${pdfLang === 'en' ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-white text-slate-700'}`}
            >
              English
            </button>
            <button
              onClick={() => setPdfLang('sq')}
              className={`px-3 py-1 text-sm ${pdfLang === 'sq' ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-white text-slate-700'}`}
            >
              Shqip
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {orders.length === 0 && <p className="text-slate-500">{t('dashboard.empty')}</p>}
        {orders.map((o) => (
          <div key={o.id} className="bg-white border rounded p-4 flex justify-between items-center flex-wrap gap-3">
            <div>
              <div className="font-bold">{o.order_number}</div>
              <div className="text-sm text-slate-600">{o.target_company_name}</div>
              <div className="text-xs text-slate-500">
                {o.report_type} • {o.urgency} • €{o.price_eur}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-3 py-1 rounded ${
                  o.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {o.status}
              </span>
              {o.status === 'completed' && (
                <button
                  onClick={() => download(o.id, o.order_number)}
                  className="bg-slate-900 text-white px-4 py-1 rounded text-sm hover:bg-slate-700"
                >
                  {t('dashboard.download')} ({pdfLang.toUpperCase()})
                </button>
              )}
              <label className="text-xs text-slate-600 cursor-pointer">
                📎 Attach
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && uploadDoc(o.id, e.target.files[0])} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
