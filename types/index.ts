export type Band = 'GREEN' | 'YELLOW' | 'RED' | 'BLACK'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'SUPER_ADMIN' | 'ADMIN_STAFF' | 'LEGAL_STAFF' | 'CLIENT_DIRECTOR' | 'CLIENT_VIEW_ONLY'
  is_active: boolean
  totp_enabled: boolean
}

export interface ScoreBreakdown {
  agm_score: number
  audit_score: number
  annual_return_score: number
  director_score: number
  shareholding_score: number
  capital_score: number
  office_score: number
  register_score: number
  tax_score: number
  raw_total: number
  final_score: number
  override_applied: boolean
  override_reason: string | null
  risk_band: string
  exposure_band: string
  revenue_tier: string
  active_flag_count: number
  black_flag_count: number
  red_flag_count: number
  yellow_flag_count: number
  green_flag_count: number
  score_hash: string
}

export interface Company {
  id: string
  company_name?: string
  name?: string
  registration_number: string
  incorporation_date: string
  company_type: string
  company_status: string
  current_compliance_score?: number | null
  current_risk_band?: string | null
  compliance_score?: number | null
  band?: string | null
  last_evaluated_at: string | null
  registered_address: string | null
  financial_year_end: string | null
  revenue_tier: string | null
  is_fdi_registered: boolean | null
  is_dormant: boolean | null
  created_at: string
  director_count?: number
  violation_count?: number
  // Tax Compliance v3
  trade_license_obtained?: boolean | null
  trade_license_expiry?: string | null
  tax_return_filed_for_current_fy?: boolean | null
  advance_tax_q1_paid?: boolean | null
  advance_tax_q2_paid?: boolean | null
  advance_tax_q3_paid?: boolean | null
  advance_tax_q4_paid?: boolean | null
  tds_deposited_up_to_date?: boolean | null
  last_tds_deposit_date?: string | null
  last_vat_return_filed?: string | null
  vat_annual_return_filed_for_fy?: boolean | null
  minimum_tax_paid?: boolean | null
  tax_clearance_obtained?: boolean | null
  tax_return_deadline_extended?: boolean | null
  // Enforcement
  any_director_disqualified?: boolean | null
  penalty_notices_received?: number | null
  penalty_notices_resolved?: number | null
}

export interface ModuleScore {
  module_name: string
  score: number
  max_score: number
  violation_count: number
}

export interface Violation {
  id: string
  rule_code: string
  rule_name: string
  description: string
  score_impact: number
  statute_reference: string
  detected_at: string
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL'
}

export interface Filing {
  id: string
  company_id: string
  company_name: string
  filing_type: string
  form_number: string
  due_date: string
  filed_date?: string
  status: 'PENDING' | 'FILED' | 'OVERDUE' | 'IN_PROGRESS'
}

export interface Document {
  id: string
  company_id: string
  company_name: string
  title: string
  template_code: string
  ai_model: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'RELEASED'
  created_at: string
}

export interface RescueCase {
  id: string
  company_id: string
  company_name: string
  band: 'RED' | 'BLACK'
  score: number
  violation_count: number
  rescue_day?: number
  key_issue: string
}

export interface DashboardStats {
  total_companies: number
  green_count: number
  yellow_count: number
  red_black_count: number
  upcoming_deadlines: number
}

export interface ActivityLog {
  id: string
  message: string
  actor: string
  created_at: string
  type: 'EVALUATION' | 'DOCUMENT' | 'VIOLATION' | 'FILING' | 'SYSTEM'
}

export interface Deadline {
  company_name: string
  filing_type: string
  due_date: string
  days_remaining: number
}
