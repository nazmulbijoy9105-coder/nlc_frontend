'use client'
import { useEffect, useState } from 'react'
import { rescueApi } from '@/lib/api'
import Topbar from '@/components/Topbar'

const MOCK_RED = [
  { id: '1', company_name: 'Dhaka Trade House Ltd.', score: 34, violation_count: 4, key_issue: 'Annual return overdue 3 days', band: 'RED' },
  { id: '2', company_name: 'Old Dhaka Traders Ltd.', score: 41, violation_count: 3, key_issue: 'AGM not held — 14 months', band: 'RED' },
]
const MOCK_BLACK = [
  { id: '3', company_name: 'Purba Bangla Commerce', score: 12, violation_count: 8, key_issue: 'Rescue plan active · Day 14', band: 'BLACK', rescue_day: 14 },
]
const MOCK_RECOVERED = [
  { id: '4', company_name: 'Chittagong Exports Ltd.', score: 76, prev_score: 38, key_issue: 'Recovered to GREEN · 45 days', band: 'GREEN' },
]

export default function RescuePage() {
  const [red, setRed] = useState(MOCK_RED)
  const [black, setBlack] = useState(MOCK_BLACK)
  const [recovered, setRecovered] = useState(MOCK_RECOVERED)

  useEffect(() => {
    rescueApi.pipeline().then(r => {
      const d = r.data
      if (d?.red) setRed(d.red)
      if (d?.black) setBlack(d.black)
      if (d?.recovered) setRecovered(d.recovered)
    }).catch(() => {})
  }, [])

  function Column({ title, items, color, border, bg }: {
    title: string; items: typeof MOCK_RED; color: string; border: string; bg?: string
  }) {
    return (
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${border}` }}>
          {title} ({items.length})
        </div>
        {items.map(c => (
          <div key={c.id} style={{ background: bg || 'var(--navy-2)', border: `1px solid ${bg ? 'rgba(80,20,20,.4)' : 'var(--navy-border)'}`, padding: 16, marginBottom: 10 }}>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{c.company_name}</div>
            <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 4 }}>Score: {c.score} · {c.violation_count} violations</div>
            <div style={{ fontSize: 11, color, marginTop: 6 }}>{c.key_issue}</div>
            {'rescue_day' in c && c.rescue_day && (
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 4, background: 'var(--navy-border)', marginBottom: 4 }}>
                  <div style={{ height: 4, background: '#a03030', width: `${Math.min((c.rescue_day / 90) * 100, 100)}%` }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--white-3)' }}>Day {c.rescue_day} of 90-day rescue plan</div>
                <button className="nlc-btn-sm" style={{ width: '100%', marginTop: 10, fontSize: 10 }}>View Rescue Plan</button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <div style={{ fontSize: 12, color: 'var(--white-3)', padding: 16, textAlign: 'center' }}>None currently</div>}
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          <Column title="RED BAND" items={red} color="#e07070" border="#a03030" />
          <Column title="BLACK BAND" items={black} color="#cc9999" border="#550000" bg="rgba(80,20,20,.15)" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#5dd4a0', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid var(--green)' }}>
              RECOVERED ({recovered.length})
            </div>
            {recovered.map(c => (
              <div key={c.id} style={{ background: 'var(--green-bg)', border: '1px solid rgba(26,122,82,.3)', padding: 16, marginBottom: 10 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{c.company_name}</div>
                <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 4 }}>Score: {c.score} ↑ from {c.prev_score ?? '—'}</div>
                <div style={{ fontSize: 11, color: '#5dd4a0', marginTop: 6 }}>{c.key_issue}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="nlc-card" style={{ padding: 20, marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            ['Total in Pipeline', red.length + black.length, '#e07070'],
            ['Avg Rescue Day', black.reduce((a,b) => a + (b.rescue_day||0), 0) || 14, '#e0b84a'],
            ['Recovered This Month', recovered.length, '#5dd4a0'],
          ].map(([label, val, color]) => (
            <div key={String(label)} style={{ textAlign: 'center' }}>
              <div className="font-cormorant" style={{ fontSize: 32, fontWeight: 700, color: String(color), lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--white-3)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
