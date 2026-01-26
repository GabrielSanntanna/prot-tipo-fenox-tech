import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Position } from '@/types/database';

export function usePositions(departmentId?: string) {
  return useQuery({
    queryKey: ['positions', departmentId],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [];
      }

      let query = supabase
        .from('positions')
        .select('*')
        .order('name');

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Position[];
    },
    enabled: isSupabaseConfigured,
  });
}
