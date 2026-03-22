'use client'
import { useEffect, useState } from 'react'
import { dashboardApi } from '@/lib/api'
import type { DashboardStats, ActivityLog, Deadline } from '@/types'
import Topbar from '@/components/Topbar'
import Link from 'next/link'

function StatCard({ num, label, delta, color }: { num: number; label: string; delta: string; color?: string }) {
  return (
    <div className="nlc-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gold-line)' }} />
      <div className="font-cormorant" style={{ fontSize: 36, fontWeight: 600, color: color || 'var(--gold)', lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: 11, color: 'var(--white-2)', marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 10, marginTop: 8, color: color || 'var(--white-3)' }}>{delta}</div>
    </div>
  )
}

function BandBadge({ band }: { band: string }) {
  const map: Record<string, string> = { GREEN: 'badge-green', YELLOW: 'badge-yellow', RED: 'badge-red', BLACK: 'badge-red' }
  return <span className={`badge-pill ${map[band] || 'badge-neutral'}`} style={{ padding: '4px 10px', fontSize: 10, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' }}>{band}</span>
}

function ScoreBar({ score, band }: { score: number; band: string }) {
  const color = band === 'GREEN' ? 'var(--green)' : band === 'YELLOW' ? '#b8860b' : '#a03030'
  const textColor = band === 'GREEN' ? '#5dd4a0' : band === 'YELLOW' ? '#e0b84a' : '#e07070'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--navy-border)' }}>
        <div style={{ height: 4, background: color, width: `${score}%` }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, minWidth: 28, textAlign: 'right', color: textColor }}>{score}</div>
    </div>
  )
}

// Fallback mock data when API isn't connected yet
const MOCK_STATS: DashboardStats = { total_companies: 24, green_count: 16, yellow_count: 5, red_black_count: 3, upcoming_deadlines: 3 }
const MOCK_DEADLINES: Deadline[] = [
  { company_name: 'Dhaka Trade House Ltd.', filing_type: 'Annual Return Filing — RJSC', due_date: '', days_remaining: 3 },
  { company_name: 'Sahara Crafts Partnership', filing_type: 'AGM Notice — 21 Days Prior', due_date: '', days_remaining: 12 },
  { company_name: 'Global Academy Hub Ltd.', filing_type: 'Form XII — Director Change', due_date: '', days_remaining: 28 },
]
const MOCK_ACTIVITY: ActivityLog[] = [
  { id: '1', message: 'Compliance evaluation run for NB Tech Solutions Ltd. — Score: 91/100', actor: 'Super Admin', created_at: '', type: 'EVALUATION' },
  { id: '2', message: 'AI-drafted Annual Return approved and released for Global Academy Hub', actor: 'Md Nazmul Islam', created_at: '', type: 'DOCUMENT' },
  { id: '3', message: 'Dhaka Trade House Ltd. escalated to RED band — 4 ILRMF rule violations', actor: 'Rule Engine', created_at: '', type: 'VIOLATION' },
  { id: '4', message: 'Sahara Crafts reconstitution — NRB partner BIDA compliance flagged', actor: 'Legal Staff', created_at: '', type: 'SYSTEM' },
]
const MOCK_COMPANIES = [
  { id: '1', name: 'Global Academy Hub Ltd.', registration_number: 'C-87654/2019', compliance_score: 88, band: 'GREEN', last_evaluated_at: '22 Mar 2026' },
  { id: '2', name: 'Sahara Crafts Partnership', registration_number: 'P-32110/2021', compliance_score: 62, band: 'YELLOW', last_evaluated_at: '21 Mar 2026' },
  { id: '3', name: 'NB Tech Solutions Ltd.', registration_number: 'C-11204/2025', compliance_score: 91, band: 'GREEN', last_evaluated_at: '23 Mar 2026' },
  { id: '4', name: 'Dhaka Trade House Ltd.', registration_number: 'C-44320/2017', compliance_score: 34, band: 'RED', last_evaluated_at: '20 Mar 2026' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [deadlines, setDeadlines] = useState<Deadline[]>(MOCK_DEADLINES)
  const [activity, setActivity] = useState<ActivityLog[]>(MOCK_ACTIVITY)

  useEffect(() => {
    dashboardApi.stats().then(r => setStats(r.data)).catch(() => {})
    dashboardApi.upcomingDeadlines().then(r => setDeadlines(r.data)).catch(() => {})
    dashboardApi.recentActivity().then(r => setActivity(r.data)).catch(() => {})
  }, [])

  const dotColor: Record<string, string> = { EVALUATION: 'var(--gold)', DOCUMENT: 'var(--green)', VIOLATION: '#a03030', SYSTEM: 'var(--gold)', FILING: 'var(--gold)' }

  return (
    <>
      <Topbar title="Dashboard" />
      <div style={{ padding: 28 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard num={stats.total_companies} label="Active Companies" delta="↑ 3 this month" color="var(--gold)" />
          <StatCard num={stats.green_count} label="GREEN Band" delta="Score ≥ 75" color="#5dd4a0" />
          <StatCard num={stats.yellow_count} label="YELLOW Band" delta="⚠ Needs attention" color="#e0b84a" />
          <StatCard num={stats.red_black_count} label="RED / BLACK" delta="● Urgent action" color="#e07070" />
        </div>

        {/* Companies */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <div className="font-garamond" style={{ fontSize: 17, fontWeight: 600, whiteSpace: 'nowrap' }}>Companies</div>
          <div style={{ flex: 1, height: 1, background: 'var(--navy-border)' }} />
          <Link href="/dashboard/companies"><button className="nlc-btn-sm">View All</button></Link>
        </div>
        <table className="nlc-table" style={{ marginBottom: 28 }}>
          <thead><tr><th>Company</th><th>Reg No</th><th>Compliance Score</th><th>Band</th><th>Last Evaluated</th><th></th></tr></thead>
          <tbody>
            {MOCK_COMPANIES.map(c => (
              <tr key={c.id}>
                <td><div style={{ fontWeight: 500 }}>{c.name}</div></td>
                <td style={{ fontSize: 12, color: 'var(--white-2)' }}>{c.registration_number}</td>
                <td><ScoreBar score={c.compliance_score} band={c.band} /></td>
                <td><BandBadge band={c.band} /></td>
                <td style={{ fontSize: 11, color: 'var(--white-3)' }}>{c.last_evaluated_at}</td>
                <td><Link href="/dashboard/companies"><button className="nlc-btn-sm" style={{ padding: '4px 10px', fontSize: 10 }}>View</button></Link></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Deadlines */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <div className="font-garamond" style={{ fontSize: 17, fontWeight: 600 }}>Upcoming Deadlines</div>
          <div style={{ flex: 1, height: 1, background: 'var(--navy-border)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
          {deadlines.map((d, i) => {
            const c = d.days_remaining <= 7 ? '#e07070' : d.days_remaining <= 20 ? '#e0b84a' : '#5dd4a0'
            return (
              <div key={i} className="nlc-card" style={{ padding: 18 }}>
                <div className="font-cormorant" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: c }}>{d.days_remaining}</div>
                <div style={{ fontSize: 10, color: 'var(--white-3)', letterSpacing: '.8px', textTransform: 'uppercase', marginTop: 2 }}>Days Remaining</div>
                <div style={{ fontSize: 12, marginTop: 10, fontWeight: 500 }}>{d.company_name}</div>
                <div style={{ fontSize: 11, color: 'var(--white-2)', marginTop: 2 }}>{d.filing_type}</div>
              </div>
            )
          })}
        </div>

        {/* Activity */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 16 }}>
          <div className="font-garamond" style={{ fontSize: 17, fontWeight: 600 }}>Recent Activity</div>
          <div style={{ flex: 1, height: 1, background: 'var(--navy-border)' }} />
        </div>
        <div className="nlc-card">
          {activity.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: i < activity.length - 1 ? '1px solid rgba(42,63,107,.4)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: dotColor[a.type] || 'var(--gold)' }} />
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{a.message}</div>
                <div style={{ fontSize: 10, color: 'var(--white-3)', marginTop: 3 }}>{a.actor}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
