import { Link } from 'react-router-dom';

const tiers = [
  { id: 'basic', name: 'Basic', price: 299, desc: 'Registration check, ownership, status', features: ['ARBK registration data', 'Current status', 'Owners/directors', '48-hour delivery'] },
  { id: 'standard', name: 'Standard', price: 599, desc: 'Basic + procurement + news', features: ['Everything in Basic', 'Full procurement history', 'Media & news screening', 'Sentiment analysis', '48-hour delivery'], featured: true },
  { id: 'comprehensive', name: 'Comprehensive', price: 1199, desc: 'Full due diligence with analyst', features: ['Everything in Standard', 'Property records', 'Court case screening', 'Analyst written assessment', 'AI risk score', '48-hour delivery'] },
];

const useCases = [
  { title: 'Banks & Lenders', desc: 'KYC, KYB and credit due diligence on Kosovo counterparties.' },
  { title: 'Law Firms', desc: 'Background reports for M&A, litigation, and compliance work.' },
  { title: 'Foreign Investors', desc: 'Verify Kosovo partners before signing or transferring funds.' },
  { title: 'Local Businesses', desc: 'Vet suppliers, distributors and customers before contracts.' },
  { title: 'NGOs & Donors', desc: 'Grant recipient and contractor verification.' },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-slate-900 to-slate-700 text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">Know who you're doing business with in Kosovo.</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Professional due diligence reports on any Kosovo company in 48 hours, built from public records,
            procurement data, and media analysis.
          </p>
          <Link to="/order" className="inline-block bg-amber-500 text-slate-900 px-8 py-3 rounded font-bold text-lg hover:bg-amber-400">
            Order a Report
          </Link>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div key={t.id} className={`rounded-lg p-8 ${t.featured ? 'bg-slate-900 text-white ring-4 ring-amber-500' : 'bg-white border'}`}>
                <h3 className="text-2xl font-bold">{t.name}</h3>
                <div className="text-4xl font-bold my-4">€{t.price}</div>
                <p className={`mb-6 ${t.featured ? 'text-slate-300' : 'text-slate-600'}`}>{t.desc}</p>
                <ul className="space-y-2 mb-8 text-sm">
                  {t.features.map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
                <Link to={`/order?tier=${t.id}`} className={`block text-center py-2 rounded font-medium ${t.featured ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-white'}`}>
                  Order {t.name}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-6">Express delivery: +50% (24h), Urgent: +100% (12h)</p>
        </div>
      </section>

      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {['Order', 'We Research', 'Receive Report'].map((step, i) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-900 text-2xl font-bold flex items-center justify-center mx-auto mb-4">{i + 1}</div>
                <h3 className="text-xl font-semibold mb-2">{step}</h3>
                <p className="text-slate-600 text-sm">
                  {i === 0 ? 'Enter the company name and your details.' :
                   i === 1 ? 'Our analysts gather data from public records.' :
                   'Receive a professional PDF report in 48 hours.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Who uses KosovaIntel</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {useCases.map((u) => (
              <div key={u.title} className="bg-white p-6 rounded border">
                <h3 className="font-bold mb-2">{u.title}</h3>
                <p className="text-sm text-slate-600">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
