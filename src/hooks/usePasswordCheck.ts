import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePasswordCheck() {
  const { user } = useAuth();

  const { data: mustChangePassword, isLoading } = useQuery({
    queryKey: ['password-check', user?.id],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase || !user) {
        return false;
      }

      const { data, error } = await supabase
        .from('employees')
        .select('must_change_password')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking password status:', error);
        return false;
      }

      return data?.must_change_password ?? false;
    },
    enabled: !!user && isSupabaseConfigured,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return { mustChangePassword: mustChangePassword ?? false, isLoading };
}
