import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, setUser } from '../lib/api';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', company_name: '', phone: '', use_case: 'bank' });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api<any>('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      setToken(r.token); setUser(r.user); navigate('/dashboard');
    } catch (e: any) { setError(e.message); }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <h1 className="text-3xl font-bold mb-6">Create an account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full border rounded px-4 py-2" />
        <input placeholder="Company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full border rounded px-4 py-2" />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-4 py-2" />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-4 py-2" />
        <input placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded px-4 py-2" />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="w-full bg-slate-900 text-white py-2 rounded font-medium">Register</button>
      </form>
    </div>
  );
}
