import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';

interface Company {
  id: number;
  name: string;
  legal_form: string;
  status: string;
  municipality: string;
  registration_date: string;
  primary_activity_description: string;
  share_capital_eur: number;
  source_url: string;
}

export default function Companies() {
  const { t } = useT();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api<{ companies: Company[] }>('/companies').then((r) => setCompanies(r.companies));
  }, []);

  const filtered = companies.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('companies.title')}</h1>
        <p className="text-slate-600 mt-2">{t('companies.subtitle')} ({companies.length})</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('companies.search')}
          className="flex-1 border rounded px-4 py-2 min-w-[200px]"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="all">{t('companies.all_statuses')}</option>
          <option value="active">{t('companies.status.active')}</option>
          <option value="suspended">{t('companies.status.suspended')}</option>
          <option value="deregistered">{t('companies.status.deregistered')}</option>
        </select>
      </div>

      <div className="text-sm text-slate-500 mb-3">{filtered.length} companies</div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <Link key={c.id} to={`/companies/${c.id}`} className="bg-white border rounded p-4 hover:shadow hover:border-amber-500">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-900">{c.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${
                c.status === 'active' ? 'bg-green-100 text-green-800' :
                c.status === 'suspended' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>{c.status}</span>
            </div>
            <div className="text-sm text-slate-600 mb-1">{c.primary_activity_description}</div>
            <div className="text-xs text-slate-500">
              {c.municipality} • Reg. {c.registration_date?.split('T')[0]} • €{Number(c.share_capital_eur || 0).toLocaleString()} capital
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
