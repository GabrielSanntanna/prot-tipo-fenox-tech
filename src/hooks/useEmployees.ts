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
          position:positions(*),
          manager:employees!employees_manager_id_fkey(id, first_name, last_name)
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
      
      // Transform manager array to single object (Supabase returns array for self-joins)
      return (data || []).map(emp => ({
        ...emp,
        manager: Array.isArray(emp.manager) ? emp.manager[0] || null : emp.manager
      })) as Employee[];
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
          position:positions(*),
          manager:employees!employees_manager_id_fkey(id, first_name, last_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      // Transform manager array to single object
      return {
        ...data,
        manager: Array.isArray(data.manager) ? data.manager[0] || null : data.manager
      } as Employee;
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

      const { data: employee, error } = await supabase
        .from('employees')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Colaborador cadastrado',
        description: 'O colaborador foi cadastrado com sucesso.',
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

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase não configurado');
      }

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: 'Colaborador removido',
        description: 'O colaborador foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
