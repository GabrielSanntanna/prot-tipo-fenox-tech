import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

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

export interface AuditLogFilters {
  entity_type?: string;
  entity_id?: string;
  action?: string;
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit_logs', filters],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('performed_at', { ascending: false });

      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters?.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: isSupabaseConfigured,
  });
}

export interface CreateAuditLogData {
  entity_type: string;
  entity_id: string;
  action: string;
  previous_status?: string | null;
  new_status?: string | null;
  notes?: string | null;
}

export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAuditLogData) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('audit_logs')
        .insert({
          ...data,
          performed_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
    },
  });
}
