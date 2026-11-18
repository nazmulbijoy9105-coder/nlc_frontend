/** API contracts mirrored from the backend Pydantic response/request models.
 * Keep these wire-format names in snake_case; dates are ISO-8601 strings.
 */
export interface CompanyApiResponse {
  id: string;
  name: string;
  registration_number: string;
  incorporation_date: string;
  compliance_score: number | null;
  band: string | null;
  evaluation_status: string;
  last_evaluated_at: string | null;
  director_count: number;
  violation_count: number;
  company_type: string | null;
  company_status: string | null;
  financial_year_end: string | null;
  registered_address: string | null;
  revenue_tier: string | null;
  is_fdi_registered: boolean | null;
  is_dormant: boolean | null;
  created_at: string | null;
  active_flags: number;
  black_flags: number;
  red_flags: number;
  yellow_flags: number;
  trade_license_obtained: boolean | null;
  trade_license_expiry: string | null;
  tax_return_filed_for_current_fy: boolean | null;
  advance_tax_q1_paid: boolean | null;
  advance_tax_q2_paid: boolean | null;
  advance_tax_q3_paid: boolean | null;
  advance_tax_q4_paid: boolean | null;
  any_director_disqualified: boolean | null;
  penalty_notices_received: number | null;
  penalty_notices_resolved: number | null;
  is_manufacturing: boolean | null;
}
export interface CompanyCreateRequest {
  company_name: string;
  registration_number: string;
  incorporation_date: string;
  registered_address: string;
  company_type?: string;
  financial_year_end?: string | null;
  revenue_tier?: string | null;
  assigned_staff_id?: string | null;
  trade_license_obtained?: boolean;
  trade_license_expiry?: string | null;
  tax_return_filed_for_current_fy?: boolean;
  advance_tax_q1_paid?: boolean;
  advance_tax_q2_paid?: boolean;
  advance_tax_q3_paid?: boolean;
  advance_tax_q4_paid?: boolean;
  tds_deposited_up_to_date?: boolean;
  last_tds_deposit_date?: string | null;
  last_vat_return_filed?: string | null;
  vat_annual_return_filed_for_fy?: boolean;
  minimum_tax_paid?: boolean;
  tax_clearance_obtained?: boolean;
  tax_return_deadline_extended?: boolean;
  any_director_disqualified?: boolean;
  penalty_notices_received?: number;
  penalty_notices_resolved?: number;
  is_manufacturing?: boolean | null;
}
export interface CompanyUpdateRequest {
  company_name?: string | null;
  registered_address?: string | null;
  financial_year_end?: string | null;
  revenue_tier?: string | null;
  assigned_staff_id?: string | null;
  internal_notes?: string | null;
  trade_license_obtained?: boolean | null;
  trade_license_expiry?: string | null;
  tax_return_filed_for_current_fy?: boolean | null;
  last_tax_return_filed?: string | null;
  advance_tax_q1_paid?: boolean | null;
  advance_tax_q2_paid?: boolean | null;
  advance_tax_q3_paid?: boolean | null;
  advance_tax_q4_paid?: boolean | null;
  tds_deposited_up_to_date?: boolean | null;
  last_tds_deposit_date?: string | null;
  last_vat_return_filed?: string | null;
  vat_annual_return_filed_for_fy?: boolean | null;
  minimum_tax_paid?: boolean | null;
  tax_clearance_obtained?: boolean | null;
  tax_return_deadline_extended?: boolean | null;
  any_director_disqualified?: boolean | null;
  disqualification_details?: string[] | null;
  penalty_notices_received?: number | null;
  penalty_notices_resolved?: number | null;
}
export interface AGMRecord {
  agm_id: string; company_id: string; financial_year: number;
  agm_due_date: string | null; held_date: string | null; held_status_verified: boolean;
  filed_date: string | null; quorum_met: boolean | null; quorum_required: number | null;
  quorum_basis: string | null; venue: string | null; members_present: number | null;
  auditor_reappointed: boolean | null; accounts_adopted: boolean | null;
  agm_held_without_audit: boolean | null; minutes_prepared: boolean | null;
  is_default: boolean | null; created_at: string;
}
export interface AuditRecord {
  audit_id: string; company_id: string; financial_year: number; is_complete: boolean;
  signed_date: string | null; auditor_firm: string | null; audit_opinion: string | null; created_at: string;
}
export interface AnnualReturnRecord {
  return_id: string; company_id: string; financial_year: number; is_filed: boolean;
  filing_evidence_status: string; filing_status_verified: boolean;
  filing_status_evidence_ref: string | null; filing_status_verified_at: string | null;
  filing_status_verified_by: string | null; filing_deadline: string | null;
  is_default: boolean | null; filed_date: string | null;
  rjsc_acknowledgment_number: string | null; late_fee_paid: boolean; created_at: string;
}
export interface FilingPortfolioResponse {
  agms: AGMRecord[]; audits: AuditRecord[]; annual_returns: AnnualReturnRecord[];
}
export interface AGMCreateRequest { company_id: string; financial_year: number; agm_due_date: string; scheduled_date?: string | null; notice_sent_date?: string | null; }
export interface AuditCreateRequest { company_id: string; financial_year: number; auditor_firm?: string | null; auditor_icab_number?: string | null; }
export interface AnnualReturnCreateRequest { company_id: string; financial_year: number; agm_date?: string | null; }
export interface DocumentApiResponse {
  document_id: string; company_id: string; document_type: string; template_name: string | null;
  title: string | null; human_approved: boolean; in_review_queue: boolean; auto_sent_blocked: boolean;
  is_client_visible: boolean; status: string; approved_by_id: string | null; approved_at: string | null;
  client_released_at: string | null; has_pdf: boolean; created_at: string; notes: string | null;
}
export interface DocumentTemplateResponse {
  template_name: string; document_type: string; description: string | null;
  required_placeholders: string[]; optional_placeholders: string[] | null; is_active: boolean;
}
export interface DocumentGenerateRequest {
  company_id: string; document_type: string; template_name: string;
  template_params?: Record<string, unknown>; notes?: string | null;
}
export interface DocumentGenerateResponse { job_queued: boolean; document_id: string | null; message: string; estimated_seconds: number; }
export interface ApiMessageResponse { message: string; success: boolean; document_id?: string | null; }
