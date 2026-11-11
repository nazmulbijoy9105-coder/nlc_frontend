export type Band = 'GREEN' | 'YELLOW' | 'RED' | 'BLACK' | 'NOT_EVALUATED'

export type EvaluationStatus =
  | 'EVALUATED'
  | 'NOT_EVALUATED'
  | 'PENDING'
  | 'STALE'
  | 'FAILED'

export interface ScoreDiagnostic {
  category: string
  raw_deduction?: number
  applied_deduction?: number
  finding_count?: number
  capped?: boolean
  [key: string]: unknown
}

export interface User {
  id: string
  email: string
  full_name: string
  role: 'SUPER_ADMIN' | 'ADMIN_STAFF' | 'LEGAL_STAFF' | 'CLIENT_DIRECTOR' | 'CLIENT_VIEW_ONLY'
  is_active: boolean
  totp_enabled: boolean
}

export interface ScoreBreakdown {
  /** Headline score 0-100 when product scoring is released; null when withheld. */
  final_score: number | null
  risk_band: Band
  /** Authoritative additive path used for the headline score. */
  category_deductions?: Record<string, number> | null
  total_applied_category_deduction?: number | null
  /** Module scores are descriptive diagnostics and are never additive. */
  diagnostic_module_scores_are_additive?: false
  diagnostic_module_score_semantics?: string
  /** Evaluation/data status; NOT_EVALUATED is never a risk band substitute. */
  evaluation_status?: EvaluationStatus | null
  /** Explanatory diagnostics only; never add these to category_deductions. */
  diagnostics?: ScoreDiagnostic[] | null
  // Legacy/diagnostic module fields (non-additive; do not sum to final_score).
  agm_score?: number | null
  audit_score?: number | null
  annual_return_score?: number | null
  director_score?: number | null
  shareholding_score?: number | null
  capital_score?: number | null
  office_score?: number | null
  register_score?: number | null
  tax_score?: number | null
  raw_total?: number | null
  override_applied?: boolean
  override_reason?: string | null
  exposure_band?: Band | null
  revenue_tier?: string | null
  active_flag_count?: number
  black_flag_count?: number
  red_flag_count?: number
  yellow_flag_count?: number
  green_flag_count?: number
  /** Input completeness indicator — not fraction of rules verified. */
  input_coverage?: number | null
  score_hash?: string | null
}

export interface ComplianceFlag {
  flag_id: string
  rule_id: string
  rule_name: string
  severity: Band
  score_impact: number
  evaluation_state:
    | 'COMPLIANT'
    | 'NON_COMPLIANT'
    | 'UNKNOWN'
    | 'CONTRADICTORY'
    | 'NOT_APPLICABLE'
    | 'REQUIRES_LAWYER_JUDGMENT'
    | 'LEGACY_UNCLASSIFIED'
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED' | 'ESCALATED' | 'DUPLICATE'
  is_black_override: boolean
  triggered_at: string
  resolved_at: string | null
  resolution_note: string | null
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
  current_risk_band?: Band | null
  compliance_score?: number | null
  band?: string | null
  evaluation_status?: EvaluationStatus | null
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

/** Display-only diagnostic groupings; not additive scoring inputs. */
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
  not_evaluated_count: number
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
