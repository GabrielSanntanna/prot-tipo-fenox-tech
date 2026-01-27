import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Vacation, VacationStatus } from '@/types/database';

export interface VacationFilters {
  status?: VacationStatus;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}

export function useVacations(filters?: VacationFilters) {
  return useQuery({
    queryKey: ['vacations', filters],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');

      let query = supabase
        .from('vacations')
        .select(`
          *,
          employee:employees(id, first_name, last_name, email, department:departments(id, name))
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Vacation & { 
        employee: { 
          id: string; 
          first_name: string; 
          last_name: string; 
          email: string;
          department: { id: string; name: string } | null;
        } 
      })[];
    },
    enabled: isSupabaseConfigured,
  });
}

export function useVacation(id: string | undefined) {
  return useQuery({
    queryKey: ['vacation', id],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');
      if (!id) return null;

      const { data, error } = await supabase
        .from('vacations')
        .select(`
          *,
          employee:employees(id, first_name, last_name, email, department:departments(id, name))
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as (Vacation & { 
        employee: { 
          id: string; 
          first_name: string; 
          last_name: string; 
          email: string;
          department: { id: string; name: string } | null;
        } 
      }) | null;
    },
    enabled: isSupabaseConfigured && !!id,
  });
}

export interface CreateVacationData {
  employee_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  notes?: string;
}

export function useCreateVacation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVacationData) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('vacations')
        .insert({
          ...data,
          requested_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
    },
  });
}

export interface UpdateVacationStatusData {
  id: string;
  status: VacationStatus;
  rejection_reason?: string;
}

export function useUpdateVacationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: UpdateVacationStatusData) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = { status };
      
      if (status === 'approved') {
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
      } else if (status === 'rejected' && rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }

      const { data: result, error } = await supabase
        .from('vacations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
    },
  });
}

// Soft delete - changes status to 'cancelled' instead of physical deletion
export function useDeleteVacation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not configured');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current status before updating
      const { data: current, error: fetchError } = await supabase
        .from('vacations')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Soft delete - update status to cancelled
      const { error: updateError } = await supabase
        .from('vacations')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Log the action in audit_logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'vacation',
          entity_id: id,
          action: 'soft_delete',
          previous_status: current.status,
          new_status: 'cancelled',
          performed_by: user.id,
        });

      if (auditError) {
        console.error('Failed to create audit log:', auditError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
    },
  });
}

// Get all approved vacations for calendar view
export function useApprovedVacations(year?: number, month?: number) {
  return useQuery({
    queryKey: ['vacations', 'approved', year, month],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');

      let query = supabase
        .from('vacations')
        .select(`
          *,
          employee:employees(id, first_name, last_name, department:departments(id, name))
        `)
        .eq('status', 'approved')
        .order('start_date', { ascending: true });

      if (year && month !== undefined) {
        const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
        const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
        query = query
          .or(`start_date.lte.${endOfMonth},end_date.gte.${startOfMonth}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Vacation & { 
        employee: { 
          id: string; 
          first_name: string; 
          last_name: string;
          department: { id: string; name: string } | null;
        } 
      })[];
    },
    enabled: isSupabaseConfigured,
  });
}
