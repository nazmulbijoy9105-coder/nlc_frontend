"use client";
export default function FinancePage() {
  return <main className="mx-auto max-w-3xl p-6 sm:p-10">
    <section className="nlc-card" role="status">
      <h1 className="font-garamond text-2xl">Finance & collections</h1>
      <p className="mt-3 text-sm leading-6" style={{color:"var(--text2)"}}>This module is temporarily unavailable in the connected backend release. The backend does not currently register the finance endpoints required for invoice creation, invoice issuance, payment submissions, payment approval or payment history.</p>
      <p className="mt-3 text-sm leading-6" style={{color:"var(--text2)"}}>No payment or accounting action can be completed from this screen. Do not treat a displayed amount, payment reference or browser interaction as an invoice, receipt or proof of settlement.</p>
    </section>
  </main>;
}
