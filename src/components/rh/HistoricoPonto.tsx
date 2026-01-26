import { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTimeRecords, calculateWorkedHours, recordTypeLabels } from '@/hooks/useTimeRecords';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock } from 'lucide-react';

interface HistoricoPontoProps {
  employeeId?: string;
}

export default function HistoricoPonto({ employeeId }: HistoricoPontoProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const { data: records, isLoading } = useTimeRecords({
    employeeId,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to, 'yyyy-MM-dd'),
  });

  // Group records by date
  const recordsByDate = records?.reduce((acc, record) => {
    const date = record.record_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, typeof records>);

  const sortedDates = recordsByDate 
    ? Object.keys(recordsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    : [];

  const quickFilters = [
    { label: 'Últimos 7 dias', days: 7 },
    { label: 'Últimos 15 dias', days: 15 },
    { label: 'Últimos 30 dias', days: 30 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Histórico de Ponto</CardTitle>
        <div className="flex items-center gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.days}
              variant="outline"
              size="sm"
              onClick={() => setDateRange({
                from: subDays(new Date(), filter.days),
                to: new Date(),
              })}
            >
              {filter.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum registro encontrado no período
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const dayRecords = recordsByDate![date];
              const workedHours = calculateWorkedHours(dayRecords);
              const dateObj = new Date(date + 'T12:00:00');

              return (
                <div key={date} className="rounded-lg border">
                  <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{format(dateObj, 'dd')}</p>
                        <p className="text-xs uppercase text-muted-foreground">
                          {format(dateObj, 'MMM', { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(dateObj, "EEEE", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {dayRecords.length} registro(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Horas trabalhadas</p>
                      <p className="text-xl font-bold text-primary">
                        {workedHours.formattedTime}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4">
                    {(['entry', 'lunch_out', 'lunch_in', 'exit'] as const).map((type) => {
                      const record = dayRecords.find(r => r.type === type);
                      return (
                        <div key={type} className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">
                            {recordTypeLabels[type]}
                          </p>
                          {record ? (
                            <Badge variant="outline" className="font-mono">
                              {format(new Date(record.record_time), 'HH:mm')}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">--:--</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
