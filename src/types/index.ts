export interface PatientRecord {
  patient_id: string
  full_name: string
  staff_code: string
  serial_number?: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  department: string
  company_name: string
  date_of_visit: string
  time_of_visit: string
  complaints: string
  vital_signs: VitalSigns
  diagnosis: string
  treatment: string
  drugs_dispensed: DrugDispensed[]
  attending_medic_id: string
  status: 'Active' | 'Archived'
  created_at: string
  updated_at: string
}

export interface VitalSigns {
  blood_pressure: string
  pulse_rate: number
  temperature: number
  respiratory_rate: number
  oxygen_saturation: number
  weight: number
  height: number
  BMI?: number
}

export interface DrugDispensed {
  drug_id: string
  drug_name: string
  quantity_dispensed: number
  unit: string
}

export interface MedicProfile {
  medic_id: string
  full_name: string
  email: string
  phone_number?: string
  role: UserRole
  company_name: string
  site_location?: string
  license_number?: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export type UserRole = 'Medic' | 'Manager' | 'Admin' | 'SuperAdmin'

export interface DrugInventory {
  drug_id: string
  drug_name: string
  category?: string
  unit: string
  company_name: string
  quantity_in_stock: number
  low_stock_threshold: number
  cost_per_unit?: number
  expiry_date?: string
  supplier_name?: string
  last_restocked_at?: string
  updated_at: string
}

export interface ConsultationLog {
  log_id: string
  patient_id: string
  medic_id: string
  company_name: string
  shift: 'Morning' | 'Afternoon' | 'Night'
  date: string
  total_drugs_used: DrugDispensed[]
  notes?: string
  synced: boolean
  created_at: string
}

export interface Report {
  report_id: string
  generated_by: string
  report_type: 'Daily' | 'Weekly' | 'Monthly' | 'Custom'
  date_range: { from: string; to: string }
  company_name: string
  total_patients_seen: number
  total_drugs_used: DrugDispensed[]
  medic_breakdown: { medic_id: string; patients_seen: number }[]
  export_format: 'PDF' | 'Excel'
  sent_via_email: boolean
  recipient_email?: string
  status: 'Pending' | 'Sent' | 'Failed'
  created_at: string
}

export interface AuditLog {
  audit_id: string
  performed_by: string
  action: string
  target_record_id?: string
  target_record_type?: string
  timestamp: string
  ip_address?: string
  device_info?: string
}

export interface Subscription {
  subscription_id: string
  company_name: string
  plan: string
  status: 'Active' | 'Inactive' | 'PastDue' | 'Cancelled'
  current_period_start?: string
  current_period_end?: string
  flutterwave_tx_ref?: string
  flutterwave_transaction_id?: string
  amount_paid?: number
  currency: string
  created_at: string
  updated_at: string
}

export interface PaymentEvent {
  event_id: string
  company_name: string
  event_type: string
  tx_ref?: string
  transaction_id?: string
  amount?: number
  currency?: string
  status: string
  customer_email?: string
  meta?: Record<string, unknown>
  created_at: string
}

export interface InitiatePaymentInput {
  company_name: string
  admin_id: string
  plan: string
  amount_ngn: number
  email: string
}

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }
