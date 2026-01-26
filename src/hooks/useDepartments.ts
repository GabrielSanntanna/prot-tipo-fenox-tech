import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { Department } from '@/types/database';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Department[];
    },
    enabled: isSupabaseConfigured,
  });
}
