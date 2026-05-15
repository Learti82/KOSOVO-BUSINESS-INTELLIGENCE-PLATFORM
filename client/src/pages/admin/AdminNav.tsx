import { Link, useLocation } from 'react-router-dom';

export default function AdminNav() {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/companies', label: 'Companies' },
    { to: '/admin/scraper', label: 'Scraper' },
    { to: '/admin/stats', label: 'Stats' },
  ];
  return (
    <div className="bg-slate-200 border-b">
      <div className="max-w-7xl mx-auto px-6 flex gap-1">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} className={`px-4 py-3 text-sm ${pathname.startsWith(t.to) ? 'bg-white font-semibold' : 'hover:bg-slate-100'}`}>
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
