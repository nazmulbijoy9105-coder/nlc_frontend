"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dashboardApi, companiesApi } from '@/lib/api'
import LegalDisclaimer from '@/components/LegalDisclaimer'

export default function DashboardPage() {
  const router = useRouter()
  const [kpis, setKpis] = useState<any>(null)
  const [companyList, setCompanyList] = useState<any[]>([])
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    let cl: any[] = []
    try {
      const [k, cl, d, a] = await Promise.all([
        dashboardApi.getStats().catch(() => null),
        (async () => { try { return await companiesApi.list() } catch { return [] } })(),
        dashboardApi.upcomingDeadlines().catch(() => []),
        dashboardApi.recentActivity().catch(() => []),
      ])
      setKpis(k); setCompanyList(Array.isArray(cl) ? cl : (cl?.items || cl?.data || [])); setDeadlines(d || []); setActivity(a || [])
    } catch (e) { console.error('Dashboard load error:', e) }
    finally { setLoading(false) }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--white-3)' }}>Loading dashboard…</div>

  const total = kpis?.total_companies || kpis?.total || companyList.length || 0 || kpis?.total || 0 || 0
  const active = kpis?.active_companies || kpis?.total_companies || 0 || 0
  const inDefault = kpis?.black_companies || 0 || kpis?.red_companies || 0 || 0
  const avgScore = kpis?.average_score || kpis?.avg_score || 0 || 0

  const kpiCards = [
    { lbl: 'Total Companies', val: total || '—', sub: 'Active portfolios', color: 'var(--navy-3)' },
    { lbl: 'In Default', val: inDefault || '—', sub: 'Require intervention', color: '#B91C1C' },
    { lbl: 'Avg Score', val: avgScore ? `${avgScore}/100` : '—', sub: 'Portfolio average', color: 'var(--green)' },
    { lbl: 'Active Flags', val: kpis?.total_active_flags || kpis?.active_flags || 0 || '—', sub: 'Compliance violations', color: 'var(--yellow)' },
  ]

  const bands = [
    { name: 'GREEN', label: 'Compliant', n: kpis?.green_companies || 0 || 0, c: '#1a7a52' },
    { name: 'YELLOW', label: 'Minor Risk', n: kpis?.yellow_companies || 0 || 0, c: '#D97706' },
    { name: 'RED', label: 'Default', n: kpis?.red_companies || 0 || 0, c: '#B91C1C' },
    { name: 'BLACK', label: 'Severe', n: kpis?.black_companies || 0 || 0, c: '#0A0A0A' },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {kpiCards.map((k, i) => (
          <div key={i} className="nlc-card" style={{ borderTop: `3px solid ${k.color}`, cursor: 'pointer' }} onClick={() => router.push('/dashboard/companies')}>
            <div className="sec-lbl" style={{ marginBottom: 8, paddingBottom: 0, border: 'none' }}>{k.lbl}</div>
            <div className="font-garamond" style={{ fontSize: 34, lineHeight: 1, marginBottom: 4, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Middle: Risk + Deadlines + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 14, marginBottom: 20 }}>
        {/* Risk Distribution */}
        <div className="nlc-card">
          <div className="sec-lbl">Risk Distribution</div>
          {bands.map(b => (
            <div key={b.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{b.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: b.c, fontFamily: "'JetBrains Mono', monospace" }}>{b.n}</span>
              </div>
              <div className="pbar">
                <div className="pbar-fill" style={{ width: `${total ? (b.n / total) * 100 : 0}%`, background: b.c }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Total Portfolio</span>
            <span className="font-garamond" style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{total} Companies</span>
          </div>
        </div>

        {/* Deadlines */}
        <div className="nlc-card">
          <div className="sec-lbl">Upcoming Deadlines</div>
          {deadlines.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>No upcoming deadlines</div>
          ) : deadlines.slice(0, 5).map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{d.company_name || d.title || 'Unknown'}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{d.event_type || d.description || ''}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: d.days_remaining < 7 ? '#B91C1C' : d.days_remaining < 30 ? '#D97706' : 'var(--green)' }}>
                {d.days_remaining}d
              </span>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="nlc-card">
          <div className="sec-lbl gold">⚑ Recent Activity</div>
          {activity.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>No recent activity</div>
          ) : activity.slice(0, 8).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.type === 'EVALUATION' ? 'var(--green)' : a.type === 'VIOLATION' ? '#B91C1C' : 'var(--teal)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message || a.description || 'Activity'}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{a.actor || 'System'} · {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LegalDisclaimer />
    </div>
  )
}
