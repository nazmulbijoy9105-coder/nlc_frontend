'use client'
import Topbar from '@/components/Topbar'

const RULES = [
  { code: 'INC-001', name: 'Certificate of Incorporation', module: 'Incorporation', weight: 10, statute: 'CA 1994 § 9' },
  { code: 'INC-002', name: 'Memorandum & Articles Filed', module: 'Incorporation', weight: 8, statute: 'CA 1994 § 11' },
  { code: 'AGM-001', name: 'AGM Held Within 15 Months', module: 'AGM', weight: 10, statute: 'CA 1994 § 81' },
  { code: 'AGM-002', name: 'AGM Quorum Met', module: 'AGM', weight: 5, statute: 'CA 1994 § 83' },
  { code: 'AGM-003', name: 'AGM Notice Period 21 Days', module: 'AGM', weight: 8, statute: 'CA 1994 § 85' },
  { code: 'AR-001', name: 'Annual Return Filed On Time', module: 'Annual Returns', weight: 12, statute: 'CA 1994 § 119' },
  { code: 'AR-002', name: 'Annual Return Contents Complete', module: 'Annual Returns', weight: 6, statute: 'CA 1994 § 120' },
  { code: 'DIR-001', name: 'Minimum 2 Directors', module: 'Directors', weight: 10, statute: 'CA 1994 § 90' },
  { code: 'DIR-002', name: 'Director Consent Filed (Form XII)', module: 'Directors', weight: 6, statute: 'CA 1994 § 92' },
  { code: 'CAP-001', name: 'Paid-Up Capital ≥ Authorised Minimum', module: 'Capital', weight: 8, statute: 'CA 1994 § 150' },
  { code: 'CAP-002', name: 'Capital Bank Certificate Uploaded', module: 'Capital', weight: 5, statute: 'CA 1994 § 155' },
  { code: 'OFF-001', name: 'Registered Office Address Notified', module: 'Registered Office', weight: 6, statute: 'CA 1994 § 77' },
]

export default function RulesPage() {
  const modules = [...new Set(RULES.map(r => r.module))]

  return (
    <>
      <Topbar title="Rules Engine" />
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--white-2)' }}>
            ILRMF v1.0 — 32 deterministic rules across 9 compliance modules.
          </div>
          <div style={{ flex: 1 }} />
          <span className="badge-pill badge-green" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>
            32 Rules Active
          </span>
        </div>

        {modules.map(mod => (
          <div key={mod} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>
              {mod}
            </div>
            <div className="nlc-card">
              {RULES.filter(r => r.module === mod).map((r, i, arr) => (
                <div key={r.code} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(42,63,107,.4)' : 'none' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--gold)', minWidth: 70 }}>{r.code}</span>
                  <span style={{ fontSize: 13, flex: 1 }}>{r.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--white-3)', minWidth: 100 }}>{r.statute}</span>
                  <span style={{ fontSize: 11, color: '#5dd4a0', minWidth: 60, textAlign: 'right' }}>+{r.weight} pts</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
