'use client'
import { useEffect, useState } from 'react'
import { rescueApi } from '@/lib/api'
import Topbar from '@/components/Topbar'

interface Plan {
  id: string
  company_name?: string
  company_id?: string
  current_score?: number
  status?: string
  current_risk_band?: string
  created_at?: string
  steps?: { step_number: number; title: string; status: string }[]
}

export default function RescuePage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    rescueApi.pipeline()
      .then((r: any) => setPlans(r?.items || r || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const red   = plans.filter(p => p.current_risk_band === 'RED')
  const black = plans.filter(p => p.current_risk_band === 'BLACK')
  const done  = plans.filter(p => p.status === 'COMPLETED')

  function Column({ title, items, color, border, bg }: {
    title: string; items: Plan[]; color: string; border: string; bg?: string
  }) {
    return (
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${border}` }}>
          {title} ({items.length})
        </div>
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--white-3)', padding: 16, textAlign: 'center' }}>None currently</div>
        )}
        {items.map(p => {
          const completedSteps = (p.steps || []).filter(s => s.status === 'COMPLETED').length
          const totalSteps = (p.steps || []).length || 8
          const pct = Math.round((completedSteps / totalSteps) * 100)
          return (
            <div key={p.id} style={{ background: bg || 'var(--navy-2)', border: `1px solid ${bg ? 'rgba(80,20,20,.4)' : 'var(--navy-border)'}`, padding: 16, marginBottom: 10 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{p.company_name || p.company_id}</div>
              <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 4 }}>Score: {p.current_score || '—'}</div>
              <div style={{ fontSize: 11, color, marginTop: 6 }}>{p.status}</div>
              {totalSteps > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 4, background: 'var(--navy-border)', marginBottom: 4 }}>
                    <div style={{ height: 4, background: color, width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--white-3)' }}>{completedSteps} of {totalSteps} steps complete</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <Topbar title="Rescue Pipeline" />
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--white-2)' }}>
            ILRMF rescue pipeline tracks RED and BLACK band companies through structured recovery.
          </div>
          <div style={{ flex: 1 }} />
          <span className="badge-pill badge-red" style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>
            {black.length} BLACK · {red.length} RED
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--white-3)', fontSize: 13 }}>Loading pipeline...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              <Column title="RED BAND" items={red} color="#e07070" border="#a03030" />
              <Column title="BLACK BAND" items={black} color="#cc9999" border="#550000" bg="rgba(80,20,20,.15)" />
              <Column title="RECOVERED" items={done} color="#5dd4a0" border="var(--green)" bg="var(--green-bg)" />
            </div>

            <div className="nlc-card" style={{ padding: 20, marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                ['In Pipeline', red.length + black.length, '#e07070'],
                ['Total Plans', plans.length, '#e0b84a'],
                ['Recovered', done.length, '#5dd4a0'],
              ].map(([label, val, color]) => (
                <div key={String(label)} style={{ textAlign: 'center' }}>
                  <div className="font-cormorant" style={{ fontSize: 32, fontWeight: 700, color: String(color), lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
