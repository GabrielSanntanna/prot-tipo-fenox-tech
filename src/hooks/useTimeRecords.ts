import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { TimeRecord, TimeRecordType } from '@/types/database';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export interface TimeRecordFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
}

// Get time records with filters
export function useTimeRecords(filters?: TimeRecordFilters) {
  return useQuery({
    queryKey: ['time-records', filters],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');

      let query = supabase
        .from('time_records')
        .select(`
          *,
          employee:employees(id, first_name, last_name, department:departments(id, name))
        `)
        .order('record_date', { ascending: false })
        .order('record_time', { ascending: true });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.date) {
        query = query.eq('record_date', filters.date);
      }
      if (filters?.startDate) {
        query = query.gte('record_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('record_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (TimeRecord & {
        employee: {
          id: string;
          first_name: string;
          last_name: string;
          department: { id: string; name: string } | null;
        };
      })[];
    },
    enabled: isSupabaseConfigured,
  });
}

// Get today's records for an employee
export function useTodayRecords(employeeId: string | undefined) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['time-records', 'today', employeeId, today],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('record_date', today)
        .order('record_time', { ascending: true });

      if (error) throw error;
      return data as TimeRecord[];
    },
    enabled: isSupabaseConfigured && !!employeeId,
  });
}

// Get monthly summary for an employee
export function useMonthlyRecords(employeeId: string | undefined, year: number, month: number) {
  const startDate = format(startOfMonth(new Date(year, month)), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date(year, month)), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['time-records', 'monthly', employeeId, year, month],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .order('record_date', { ascending: true })
        .order('record_time', { ascending: true });

      if (error) throw error;
      return data as TimeRecord[];
    },
    enabled: isSupabaseConfigured && !!employeeId,
  });
}

// Create time record
export interface CreateTimeRecordData {
  employee_id: string;
  type: TimeRecordType;
  location?: string;
  notes?: string;
}

export function useCreateTimeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimeRecordData) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      
      const { data: result, error } = await supabase
        .from('time_records')
        .insert({
          ...data,
          recorded_by: user.id,
          record_date: format(now, 'yyyy-MM-dd'),
          record_time: now.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-records'] });
    },
  });
}

// Calculate worked hours from records
export function calculateWorkedHours(records: TimeRecord[]): {
  totalMinutes: number;
  formattedTime: string;
  breakdown: { entry?: string; lunchOut?: string; lunchIn?: string; exit?: string };
} {
  const breakdown: { entry?: string; lunchOut?: string; lunchIn?: string; exit?: string } = {};
  let totalMinutes = 0;

  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.record_time).getTime() - new Date(b.record_time).getTime()
  );

  for (const record of sortedRecords) {
    const time = format(new Date(record.record_time), 'HH:mm');
    switch (record.type) {
      case 'entry':
        breakdown.entry = time;
        break;
      case 'lunch_out':
        breakdown.lunchOut = time;
        break;
      case 'lunch_in':
        breakdown.lunchIn = time;
        break;
      case 'exit':
        breakdown.exit = time;
        break;
    }
  }

  // Calculate morning period
  if (breakdown.entry && breakdown.lunchOut) {
    const entry = new Date(`2000-01-01T${breakdown.entry}:00`);
    const lunchOut = new Date(`2000-01-01T${breakdown.lunchOut}:00`);
    totalMinutes += (lunchOut.getTime() - entry.getTime()) / (1000 * 60);
  }

  // Calculate afternoon period
  if (breakdown.lunchIn && breakdown.exit) {
    const lunchIn = new Date(`2000-01-01T${breakdown.lunchIn}:00`);
    const exit = new Date(`2000-01-01T${breakdown.exit}:00`);
    totalMinutes += (exit.getTime() - lunchIn.getTime()) / (1000 * 60);
  }

  // If no lunch, calculate entry to exit
  if (breakdown.entry && breakdown.exit && !breakdown.lunchOut && !breakdown.lunchIn) {
    const entry = new Date(`2000-01-01T${breakdown.entry}:00`);
    const exit = new Date(`2000-01-01T${breakdown.exit}:00`);
    totalMinutes = (exit.getTime() - entry.getTime()) / (1000 * 60);
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  const formattedTime = `${hours}h ${minutes.toString().padStart(2, '0')}min`;

  return { totalMinutes, formattedTime, breakdown };
}

// Get the next expected record type
export function getNextRecordType(records: TimeRecord[]): TimeRecordType | null {
  if (records.length === 0) return 'entry';
  
  const types = records.map(r => r.type);
  
  if (!types.includes('entry')) return 'entry';
  if (!types.includes('lunch_out')) return 'lunch_out';
  if (!types.includes('lunch_in')) return 'lunch_in';
  if (!types.includes('exit')) return 'exit';
  
  return null; // All records done for the day
}

export const recordTypeLabels: Record<TimeRecordType, string> = {
  entry: 'Entrada',
  lunch_out: 'Saída Almoço',
  lunch_in: 'Retorno Almoço',
  exit: 'Saída',
};

export const recordTypeIcons: Record<TimeRecordType, string> = {
  entry: '🟢',
  lunch_out: '🍽️',
  lunch_in: '🔄',
  exit: '🔴',
};
