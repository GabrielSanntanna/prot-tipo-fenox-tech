// Database types matching Supabase schema

export type AppRole = 'admin' | 'manager' | 'rh' | 'user';
export type VacationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type TimeRecordType = 'entry' | 'lunch_out' | 'lunch_in' | 'exit';
export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';

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
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  department?: Department;
  position?: Position;
  manager?: { id: string; first_name: string; last_name: string } | null;
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
  notes: string | null;
  created_at: string;
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
}
