import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken, setUser } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const r = await api<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(r.token); setUser(r.user);
      navigate(r.user.role === 'client' ? '/dashboard' : '/admin/orders');
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <h1 className="text-3xl font-bold mb-6">Sign in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full border rounded px-4 py-2" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border rounded px-4 py-2" />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="w-full bg-slate-900 text-white py-2 rounded font-medium">Sign in</button>
      </form>
      <p className="text-sm mt-4 text-slate-600">No account? <Link to="/register" className="text-amber-600">Register</Link></p>
    </div>
  );
}
