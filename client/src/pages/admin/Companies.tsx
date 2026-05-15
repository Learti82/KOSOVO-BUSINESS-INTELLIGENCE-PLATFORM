import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import AdminNav from './AdminNav';

export default function Companies() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const r = await api<any>(`/analyst/companies/search?q=${encodeURIComponent(q)}`);
    setResults(r.results);
  };

  useEffect(() => { search(); }, []);

  return (
    <div>
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Company Database</h1>
        <div className="flex gap-2 mb-6">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="flex-1 border rounded px-4 py-2" />
          <button onClick={search} className="bg-slate-900 text-white px-6 py-2 rounded">Search</button>
        </div>
        <div className="bg-white border rounded">
          <table className="w-full text-sm">
            <thead className="bg-slate-100"><tr><th className="text-left p-3">Name</th><th>Status</th><th>Municipality</th><th>Registered</th></tr></thead>
            <tbody>
              {results.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td>{c.status}</td>
                  <td>{c.municipality}</td>
                  <td>{c.registration_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
