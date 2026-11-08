"use client";
export default function BillingPage() {
  return <main className="mx-auto max-w-3xl p-6 sm:p-10">
    <section className="nlc-card" role="status">
      <h1 className="font-garamond text-2xl">Billing & subscriptions</h1>
      <p className="mt-3 text-sm leading-6" style={{color:"var(--text2)"}}>This module is temporarily unavailable in the connected backend release. The backend currently does not register the subscription or billing API routes required to load plans, subscriptions, invoices or payment submissions.</p>
      <p className="mt-3 text-sm leading-6" style={{color:"var(--text2)"}}>No billing request, payment claim, invoice issue or cancellation action is being simulated or accepted by this screen. Contact NLC staff for billing assistance while the backend contract is completed and independently tested.</p>
    </section>
  </main>;
}
