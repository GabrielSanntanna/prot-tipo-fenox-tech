import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface DashboardStats {
  activeEmployees: number;
  onLeaveEmployees: number;
  terminatedEmployees: number;
  totalEmployees: number;
  approvedVacationsThisMonth: number;
  pendingVacations: number;
  birthdaysThisMonth: { id: string; first_name: string; last_name: string; birth_date: string; department?: string }[];
  employeesByDepartment: { department: string; count: number }[];
  employeesByStatus: { status: string; count: number }[];
  recentHires: { id: string; first_name: string; last_name: string; hire_date: string; department?: string }[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      if (!supabase) throw new Error('Supabase not configured');

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      // Fetch all employees with department info
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, birth_date, hire_date, status, department:departments(name)');

      if (empError) throw empError;

      // Fetch vacations for this month
      const { data: vacations, error: vacError } = await supabase
        .from('vacations')
        .select('id, status, start_date, end_date')
        .or(`start_date.gte.${monthStart},end_date.lte.${monthEnd}`);

      if (vacError) throw vacError;

      // Calculate employee stats
      const activeEmployees = employees?.filter(e => e.status === 'active').length || 0;
      const onLeaveEmployees = employees?.filter(e => e.status === 'on_leave').length || 0;
      const terminatedEmployees = employees?.filter(e => e.status === 'terminated').length || 0;
      const totalEmployees = employees?.length || 0;

      // Calculate vacation stats
      const approvedVacationsThisMonth = vacations?.filter(v => v.status === 'approved').length || 0;
      const pendingVacations = vacations?.filter(v => v.status === 'pending').length || 0;

      // Find birthdays this month
      const birthdaysThisMonth = employees
        ?.filter(e => {
          if (!e.birth_date) return false;
          const birthMonth = new Date(e.birth_date).getMonth() + 1;
          return birthMonth === currentMonth && e.status === 'active';
        })
        .map(e => ({
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          birth_date: e.birth_date!,
          department: (e.department as { name: string } | null)?.name,
        }))
        .sort((a, b) => {
          const dayA = new Date(a.birth_date).getDate();
          const dayB = new Date(b.birth_date).getDate();
          return dayA - dayB;
        }) || [];

      // Group employees by department
      const deptCounts: Record<string, number> = {};
      employees?.forEach(e => {
        if (e.status !== 'active') return;
        const deptName = (e.department as { name: string } | null)?.name || 'Sem departamento';
        deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
      });
      const employeesByDepartment = Object.entries(deptCounts)
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count);

      // Group employees by status
      const statusCounts: Record<string, number> = {};
      employees?.forEach(e => {
        statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
      });
      const employeesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // Recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentHires = employees
        ?.filter(e => new Date(e.hire_date) >= thirtyDaysAgo)
        .map(e => ({
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          hire_date: e.hire_date,
          department: (e.department as { name: string } | null)?.name,
        }))
        .sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime()) || [];

      return {
        activeEmployees,
        onLeaveEmployees,
        terminatedEmployees,
        totalEmployees,
        approvedVacationsThisMonth,
        pendingVacations,
        birthdaysThisMonth,
        employeesByDepartment,
        employeesByStatus,
        recentHires,
      };
    },
    enabled: isSupabaseConfigured,
  });
}
