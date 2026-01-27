import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Employee, EmployeeFormData, EmployeeStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface EmployeeFilters {
  search?: string;
  status?: EmployeeStatus | 'all';
  department_id?: string;
}

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [];
      }

      let query = supabase
        .from('employees')
        .select(`
          *,
          department:departments(*),
          position:positions(*)
        `)
        .order('first_name');

      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []) as Employee[];
    },
    enabled: isSupabaseConfigured,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase || !id) {
        return null;
      }

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(*),
          position:positions(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      return data as Employee | null;
    },
    enabled: isSupabaseConfigured && !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase não configurado');
      }

      // If initial_password is provided, use edge function for proper user creation
      if (data.initial_password) {
        const { data: result, error: fnError } = await supabase.functions.invoke('create-employee', {
          body: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password: data.initial_password,
            cpf_cnpj: data.cpf_cnpj,
            phone: data.phone,
            birth_date: data.birth_date,
            hire_date: data.hire_date,
            department_id: data.department_id,
            position_id: data.position_id,
            manager_id: data.manager_id,
            salary: data.salary,
            address: data.address,
            notes: data.notes,
            pin: data.pin,
            document_type: data.document_type,
            contract_type: data.contract_type,
            payment_type: data.payment_type,
            work_schedule: data.work_schedule,
            employee_code: data.employee_code,
            role: 'user',
          },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (result?.error) {
          throw new Error(result.error);
        }

        return result;
      }

      // Fallback to direct insert (without auth user) - for testing only
      const { initial_password, ...employeeData } = data;
      const { data: employee, error } = await supabase
        .from('employees')
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Colaborador cadastrado',
        description: 'O colaborador foi cadastrado com sucesso e pode acessar o sistema.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase não configurado');
      }

      const { data: employee, error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return employee;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast({
        title: 'Colaborador atualizado',
        description: 'Os dados foram atualizados com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Soft delete - changes status to 'terminated' instead of physical deletion
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase não configurado');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get current status before updating
      const { data: current, error: fetchError } = await supabase
        .from('employees')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Soft delete - update status to terminated
      const { error: updateError } = await supabase
        .from('employees')
        .update({ status: 'terminated' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Log the action in audit_logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'employee',
          entity_id: id,
          action: 'soft_delete',
          previous_status: current.status,
          new_status: 'terminated',
          performed_by: user.id,
        });

      if (auditError) {
        console.error('Failed to create audit log:', auditError);
        // Don't throw - the main action succeeded
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Colaborador inativado',
        description: 'O colaborador foi inativado e pode ser visualizado no filtro "Desligado".',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao inativar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Reactivate employee - changes status from 'terminated' back to 'active'
export function useReactivateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase não configurado');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get current status before updating
      const { data: current, error: fetchError } = await supabase
        .from('employees')
        .select('status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Reactivate - update status to active
      const { error: updateError } = await supabase
        .from('employees')
        .update({ status: 'active' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Log the action in audit_logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'employee',
          entity_id: id,
          action: 'reactivate',
          previous_status: current.status,
          new_status: 'active',
          performed_by: user.id,
        });

      if (auditError) {
        console.error('Failed to create audit log:', auditError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Colaborador reativado',
        description: 'O colaborador foi reativado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao reativar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
