import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function CompanyDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api<any>(`/companies/${id}/public`).then(setData).catch(() => {});
  }, [id]);

  if (!data) return <div className="p-12 text-center text-slate-500">Loading...</div>;
  const { company, persons, procurement, news } = data;
  const totalProc = procurement.reduce((s: number, p: any) => s + Number(p.contract_value_eur || 0), 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <Link to="/companies" className="text-amber-600 text-sm">← All companies</Link>

      <div className="mt-3 mb-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <span className={`text-sm px-3 py-1 rounded font-medium ${
            company.status === 'active' ? 'bg-green-100 text-green-800' :
            company.status === 'suspended' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>{company.status?.toUpperCase()}</span>
        </div>
        <p className="text-slate-600 mt-1">{company.primary_activity_description}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded p-4">
          <div className="text-xs text-slate-500 uppercase">Registration</div>
          <div className="font-bold mt-1">{company.registration_number || '—'}</div>
          <div className="text-sm text-slate-600">{company.registration_date?.split('T')[0]}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-xs text-slate-500 uppercase">Location</div>
          <div className="font-bold mt-1">{company.municipality}</div>
          <div className="text-sm text-slate-600">{company.address}</div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="text-xs text-slate-500 uppercase">Capital</div>
          <div className="font-bold mt-1">€ {Number(company.share_capital_eur || 0).toLocaleString()}</div>
          <div className="text-sm text-slate-600">{company.legal_form}</div>
        </div>
      </div>

      <section className="bg-white border rounded p-6 mb-6">
        <h2 className="font-bold mb-3">Owners & Authorized Persons ({persons.length})</h2>
        {persons.length === 0 ? <p className="text-sm text-slate-500">No data.</p> :
          <div className="space-y-2">
            {persons.map((p: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                <span className="font-medium">{p.full_name}</span>
                <span className="text-slate-600">{p.role} {p.ownership_percent ? `(${p.ownership_percent}%)` : ''}</span>
              </div>
            ))}
          </div>
        }
      </section>

      <section className="bg-white border rounded p-6 mb-6">
        <h2 className="font-bold mb-3">Government Procurement ({procurement.length})</h2>
        <p className="text-sm text-slate-600 mb-3">Total value: <strong>€ {totalProc.toLocaleString()}</strong></p>
        {procurement.length === 0 ? <p className="text-sm text-slate-500">No procurement records.</p> :
          <div className="space-y-2">
            {procurement.map((p: any, i: number) => (
              <div key={i} className="text-sm py-2 border-b last:border-0">
                <div className="font-medium">{p.tender_title}</div>
                <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                  <span>{p.contracting_authority} • {p.award_date?.split('T')[0]}</span>
                  <span className="font-bold text-slate-800">€ {Number(p.contract_value_eur || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        }
      </section>

      <section className="bg-white border rounded p-6 mb-6">
        <h2 className="font-bold mb-3">Media & News ({news.length})</h2>
        {news.length === 0 ? <p className="text-sm text-slate-500">No mentions.</p> :
          <div className="space-y-3">
            {news.map((n: any, i: number) => (
              <div key={i} className="border-b last:border-0 pb-2">
                <div className="flex justify-between">
                  <div className="font-medium text-sm">{n.headline}</div>
                  <span className={`text-xs px-2 rounded ml-2 ${
                    n.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    n.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}>{n.sentiment}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{n.source_name} • {n.published_at?.split('T')[0]}</div>
                <div className="text-sm text-slate-700 mt-1">{n.summary}</div>
              </div>
            ))}
          </div>
        }
      </section>

      <div className="bg-amber-50 border-2 border-amber-300 rounded p-6 text-center">
        <h3 className="font-bold text-lg mb-2">Want a full intelligence report on this company?</h3>
        <p className="text-sm text-slate-700 mb-3">
          Get a professional PDF with AI-generated risk analysis, executive summary, full procurement & ownership breakdown.
        </p>
        <Link to={`/order?company=${company.id}`} className="inline-block bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded">
          Order Report →
        </Link>
      </div>

      {company.source_url && (
        <p className="text-xs text-slate-500 mt-6 text-center">
          Verify this data at the official source: <a href={company.source_url} target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">ARBK Registry</a>
        </p>
      )}
    </div>
  );
}
