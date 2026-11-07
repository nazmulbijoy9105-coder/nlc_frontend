export default function ArticlesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Company records
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Articles of Association
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          NLC records the examination of operative constitutional documents.
          This workspace is not a document-upload or automated authenticity service.
        </p>
      </div>

      <section
        aria-labelledby="physical-examination-title"
        role="alert"
        className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800"
          >
            <span className="text-lg font-bold">!</span>
          </div>
          <div className="min-w-0">
            <h2
              id="physical-examination-title"
              className="text-lg font-semibold text-amber-950"
            >
              Physical examination required — uploads disabled
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Do not upload complete Memorandum of Association (MOA), Articles
              of Association (AOA), or original RJSC-issued documents to this
              portal. The previous PDF upload workflow is disabled.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-amber-200 pt-5 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              What the company should do
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Arrange presentation of the original or legally acceptable physical copy to NLC.</li>
              <li>Do not send a complete scan, PDF, photograph, or digital copy through this workspace.</li>
              <li>Provide the document identifier, issue or execution date, and the relevant clause/page reference when requested by NLC.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              What NLC must record
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Document type, identifier, presenter, and physical custody/return details.</li>
              <li>Pages and clauses actually examined, with the examiner and examination date.</li>
              <li>An independent reviewer, effective-date assessment, limitations, and unresolved facts.</li>
            </ul>
          </div>
        </div>

        <p className="mt-5 rounded-lg border border-amber-200 bg-white/70 p-3 text-xs leading-5 text-slate-600">
          A physical examination record is not, by itself, proof of authenticity,
          registration, legal validity, or compliance. Any legal conclusion
          requires source verification and independent legal review.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Examination record status
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The NLC-only hard-copy examination workflow is not yet available in
          this release. No file upload, document review, or verification action
          can be started from this page.
        </p>
      </section>
    </main>
  );
}
