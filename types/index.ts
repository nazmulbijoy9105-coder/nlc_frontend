export type Band = 'GREEN' | 'YELLOW' | 'RED' | 'BLACK'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'SUPER_ADMIN' | 'ADMIN_STAFF' | 'LEGAL_STAFF' | 'CLIENT_DIRECTOR' | 'CLIENT_VIEW_ONLY'
  is_active: boolean
  totp_enabled: boolean
}

export interface Company {
  id: string
  name: string
  registration_number: string
  incorporation_date: string
  compliance_score: number
  band: Band
  last_evaluated_at: string
  director_count: number
  violation_count: number
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
