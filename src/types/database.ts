// Database types matching Supabase schema

export type AppRole = 'admin' | 'manager' | 'rh' | 'user' | 'diretoria' | 'dp' | 'financeiro' | 'infraestrutura' | 'desenvolvimento' | 'suporte' | 'mesa_analise';
export type VacationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type TimeRecordType = 'entry' | 'lunch_out' | 'lunch_in' | 'exit';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';
export type DocumentType = 'cpf' | 'cnpj';
export type ContractType = 'clt' | 'pj';
export type PaymentType = 'hourly' | 'fixed';
export type AdjustmentStatus = 'pending' | 'approved' | 'rejected';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  name: string;
  department_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string | null;
  employee_code: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  hire_date: string;
  termination_date: string | null;
  department_id: string | null;
  position_id: string | null;
  manager_id: string | null;
  salary: number | null;
  status: EmployeeStatus;
  address: string | null;
  notes: string | null;
  pin: string | null;
  pin_hash: string | null;
  photo_url: string | null;
  // FMS new fields
  cpf_cnpj: string | null;
  document_type: DocumentType;
  contract_type: ContractType;
  payment_type: PaymentType;
  work_schedule: string | null;
  lgpd_consent: boolean;
  lgpd_consent_at: string | null;
  biometry_consent: boolean;
  biometry_consent_at: string | null;
  // Password management
  initial_password: string | null;
  password_changed: boolean;
  password_changed_at: string | null;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  department?: Department;
  position?: Position;
  manager?: { id: string; first_name: string; last_name: string } | null;
}

export interface EmployeeDepartment {
  id: string;
  employee_id: string;
  department_id: string;
  is_primary: boolean;
  created_at: string;
  // Joined fields
  department?: Department;
}

export interface Vacation {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: VacationStatus;
  requested_by: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: Employee;
}

export interface TimeRecord {
  id: string;
  employee_id: string;
  record_date: string;
  record_time: string;
  type: TimeRecordType;
  recorded_by: string;
  location: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  employee?: Employee;
}

export interface TimeAdjustment {
  id: string;
  employee_id: string;
  record_date: string;
  original_time: string | null;
  requested_time: string;
  record_type: TimeRecordType;
  justification: string;
  attachment_url: string | null;
  status: AdjustmentStatus;
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: Employee;
}

// Audit log for tracking soft deletes and reactivations
export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  performed_by: string;
  performed_at: string;
  notes: string | null;
  created_at: string;
}

// Form types
export interface EmployeeFormData {
  employee_code?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  hire_date: string;
  department_id?: string;
  position_id?: string;
  manager_id?: string;
  salary?: number;
  status: EmployeeStatus;
  address?: string;
  notes?: string;
  pin?: string;
  // FMS new fields
  cpf_cnpj?: string;
  document_type?: DocumentType;
  contract_type?: ContractType;
  payment_type?: PaymentType;
  work_schedule?: string;
  // Password field for new employee
  initial_password?: string;
}
