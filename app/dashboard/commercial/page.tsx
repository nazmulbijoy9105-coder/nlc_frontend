'use client'
import Topbar from '@/components/Topbar'
export default function CommercialPage() {
  return (
    <>
      <Topbar title="Commercial" />
      <div style={{ padding: 28 }}>
        <div className="nlc-card" style={{ padding: 40, textAlign: 'center' }}>
          <div className="font-garamond" style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Commercial Pipeline</div>
          <div style={{ fontSize: 13, color: 'var(--white-2)' }}>Revenue pipeline, client engagements and billing coming in v1.1.</div>
        </div>
      </div>
    </>
  )
}
