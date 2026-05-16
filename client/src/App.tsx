import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { getUser, setToken, setUser } from './lib/api';
import { useT } from './lib/i18n';
import Home from './pages/Home';
import Order from './pages/Order';
import SampleReport from './pages/SampleReport';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import CompaniesBrowse from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import BulkOrder from './pages/BulkOrder';
import AdminLogin from './pages/admin/AdminLogin';
import OrderQueue from './pages/admin/OrderQueue';
import OrderWorkspace from './pages/admin/OrderWorkspace';
import Companies from './pages/admin/Companies';
import ScraperPanel from './pages/admin/ScraperPanel';
import Stats from './pages/admin/Stats';

function Header() {
  const user = getUser();
  const navigate = useNavigate();
  const { t, lang, setLang } = useT();
  const logout = () => { setToken(null); setUser(null); navigate('/'); };
  return (
    <header className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-wider">KOSOVAINTEL</Link>
        <nav className="flex gap-5 items-center text-sm">
          <Link to="/companies" className="hover:text-amber-400">{t('nav.companies')}</Link>
          <Link to="/order" className="hover:text-amber-400">{t('nav.order')}</Link>
          <Link to="/sample-report" className="hover:text-amber-400">{t('nav.sample')}</Link>
          {user ? (
            <>
              {user.role === 'client' && <Link to="/dashboard">{t('nav.dashboard')}</Link>}
              {user.role === 'client' && <Link to="/bulk" className="hover:text-amber-400">Bulk</Link>}
              {(user.role === 'analyst' || user.role === 'admin') && <Link to="/admin/orders">{t('nav.admin')}</Link>}
              <button onClick={logout} className="text-slate-300 hover:text-white">{t('nav.logout')}</button>
            </>
          ) : (
            <Link to="/login" className="bg-amber-500 text-slate-900 px-4 py-1 rounded font-medium">{t('nav.login')}</Link>
          )}
          <div className="flex border border-slate-600 rounded overflow-hidden text-xs ml-2">
            <button onClick={() => setLang('en')} className={`px-2 py-1 ${lang === 'en' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-300'}`}>EN</button>
            <button onClick={() => setLang('sq')} className={`px-2 py-1 ${lang === 'sq' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-300'}`}>SQ</button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function RequireRole({ role, children }: { role: string | string[]; children: React.ReactNode }) {
  const user = getUser();
  const roles = Array.isArray(role) ? role : [role];
  if (!user || !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/companies" element={<CompaniesBrowse />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/order" element={<Order />} />
          <Route path="/bulk" element={<BulkOrder />} />
          <Route path="/sample-report" element={<SampleReport />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<RequireRole role="client"><ClientDashboard /></RequireRole>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/orders" element={<RequireRole role={['analyst', 'admin']}><OrderQueue /></RequireRole>} />
          <Route path="/admin/orders/:id" element={<RequireRole role={['analyst', 'admin']}><OrderWorkspace /></RequireRole>} />
          <Route path="/admin/companies" element={<RequireRole role={['analyst', 'admin']}><Companies /></RequireRole>} />
          <Route path="/admin/scraper" element={<RequireRole role={['analyst', 'admin']}><ScraperPanel /></RequireRole>} />
          <Route path="/admin/stats" element={<RequireRole role={['analyst', 'admin']}><Stats /></RequireRole>} />
        </Routes>
      </main>
      <footer className="bg-slate-900 text-slate-400 text-sm py-6 text-center">
        © {new Date().getFullYear()} KosovaIntel — Kosovo Business Intelligence
      </footer>
    </div>
  );
}
