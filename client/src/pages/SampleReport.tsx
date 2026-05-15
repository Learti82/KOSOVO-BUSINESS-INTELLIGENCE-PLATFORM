export default function SampleReport() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-6">Sample Report</h1>
      <div className="bg-white border rounded-lg p-8 space-y-6 shadow">
        <div className="text-center pb-6 border-b">
          <div className="text-xs tracking-widest text-slate-500">KOSOVAINTEL</div>
          <h2 className="text-2xl font-bold mt-2">Business Intelligence Report</h2>
          <div className="text-xl font-semibold mt-4">Demo Sh.P.K.</div>
          <span className="inline-block mt-3 px-4 py-1 bg-yellow-500 text-white rounded text-sm font-bold uppercase">Medium Risk</span>
          <div className="text-sm text-slate-500 mt-4">Order: KI-SAMPLE-0001 — CONFIDENTIAL</div>
        </div>

        <section>
          <h3 className="font-bold border-b pb-1 mb-2">1. Executive Summary</h3>
          <p className="text-sm">Risk score: <strong>52/100</strong>. Demo Sh.P.K. is an active limited liability company registered in Prishtinë. The company shows a consistent procurement footprint and moderate transparency. Two minor data gaps were identified regarding beneficial ownership.</p>
        </section>

        <section>
          <h3 className="font-bold border-b pb-1 mb-2">2. Company Profile</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="font-medium py-1">Name</td><td>Demo Sh.P.K.</td></tr>
              <tr><td className="font-medium py-1">Registration</td><td>70999999</td></tr>
              <tr><td className="font-medium py-1">Status</td><td>Active</td></tr>
              <tr><td className="font-medium py-1">Municipality</td><td>Prishtinë</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="font-bold border-b pb-1 mb-2">3. Procurement History</h3>
          <p className="text-sm">3 government contracts, total €████,000 (redacted in sample).</p>
        </section>

        <p className="text-xs text-slate-500 italic text-center pt-4">This is a redacted sample. Real reports contain full data and analyst commentary.</p>
      </div>
    </div>
  );
}
