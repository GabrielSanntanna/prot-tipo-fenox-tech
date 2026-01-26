import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMonthlyRecords, calculateWorkedHours, recordTypeLabels } from '@/hooks/useTimeRecords';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface RelatorioMensalProps {
  employeeId?: string;
  employeeName?: string;
}

const EXPECTED_DAILY_HOURS = 8; // 8 hours per day
const EXPECTED_DAILY_MINUTES = EXPECTED_DAILY_HOURS * 60;

export default function RelatorioMensal({ employeeId, employeeName }: RelatorioMensalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: records, isLoading } = useMonthlyRecords(employeeId, year, month);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!records) return null;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const workDays = allDays.filter(day => !isWeekend(day) && day <= new Date());

    // Group by date
    const recordsByDate: Record<string, typeof records> = {};
    records.forEach(record => {
      if (!recordsByDate[record.record_date]) {
        recordsByDate[record.record_date] = [];
      }
      recordsByDate[record.record_date].push(record);
    });

    let totalMinutes = 0;
    let daysWorked = 0;
    let daysWithIssues = 0;
    const dailyData: Array<{
      date: Date;
      records: typeof records;
      workedMinutes: number;
      status: 'complete' | 'incomplete' | 'missing' | 'weekend' | 'future';
    }> = [];

    allDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayRecords = recordsByDate[dateStr] || [];
      const isWeekendDay = isWeekend(day);
      const isFuture = day > new Date();

      if (isWeekendDay) {
        dailyData.push({
          date: day,
          records: dayRecords,
          workedMinutes: 0,
          status: 'weekend',
        });
        return;
      }

      if (isFuture) {
        dailyData.push({
          date: day,
          records: [],
          workedMinutes: 0,
          status: 'future',
        });
        return;
      }

      if (dayRecords.length === 0) {
        dailyData.push({
          date: day,
          records: [],
          workedMinutes: 0,
          status: 'missing',
        });
        daysWithIssues++;
        return;
      }

      const { totalMinutes: dayMinutes } = calculateWorkedHours(dayRecords);
      totalMinutes += dayMinutes;
      daysWorked++;

      const hasAllRecords = ['entry', 'lunch_out', 'lunch_in', 'exit'].every(
        type => dayRecords.some(r => r.type === type)
      );

      dailyData.push({
        date: day,
        records: dayRecords,
        workedMinutes: dayMinutes,
        status: hasAllRecords ? 'complete' : 'incomplete',
      });

      if (!hasAllRecords) {
        daysWithIssues++;
      }
    });

    const expectedMinutes = workDays.length * EXPECTED_DAILY_MINUTES;
    const balance = totalMinutes - expectedMinutes;

    return {
      totalMinutes,
      expectedMinutes,
      balance,
      daysWorked,
      workDays: workDays.length,
      daysWithIssues,
      dailyData,
    };
  }, [records, currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((current) =>
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  const formatMinutes = (minutes: number) => {
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = Math.round(absMinutes % 60);
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${hours}h ${mins.toString().padStart(2, '0')}min`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Relatório Mensal</CardTitle>
            <CardDescription>
              {employeeName || 'Colaborador'} - {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Horas Trabalhadas</span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {stats ? formatMinutes(stats.totalMinutes) : '--'}
              </p>
              <p className="text-sm text-muted-foreground">
                de {stats ? formatMinutes(stats.expectedMinutes) : '--'} esperadas
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Saldo</span>
              </div>
              <p className={cn(
                "mt-2 text-2xl font-bold",
                stats?.balance && stats.balance >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {stats ? formatMinutes(stats.balance) : '--'}
              </p>
              <Progress
                value={stats ? Math.min((stats.totalMinutes / stats.expectedMinutes) * 100, 100) : 0}
                className="mt-2"
              />
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Dias Trabalhados</span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {stats?.daysWorked || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                de {stats?.workDays || 0} dias úteis
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Pendências</span>
              </div>
              <p className={cn(
                "mt-2 text-2xl font-bold",
                stats?.daysWithIssues && stats.daysWithIssues > 0 ? "text-yellow-600" : "text-green-600"
              )}>
                {stats?.daysWithIssues || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                dias com registros incompletos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Diário</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída Almoço</TableHead>
                <TableHead>Retorno</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.dailyData.map((day) => {
                const result = day.records.length > 0
                  ? calculateWorkedHours(day.records)
                  : null;
                const breakdown = result?.breakdown;

                return (
                  <TableRow
                    key={day.date.toISOString()}
                    className={cn(
                      day.status === 'weekend' && 'bg-muted/50',
                      day.status === 'future' && 'opacity-50',
                      day.status === 'missing' && 'bg-destructive/5'
                    )}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(day.date, 'dd/MM')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(day.date, 'EEE', { locale: ptBR })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {breakdown?.entry || '--:--'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {breakdown?.lunchOut || '--:--'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {breakdown?.lunchIn || '--:--'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {breakdown?.exit || '--:--'}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {day.workedMinutes > 0 ? formatMinutes(day.workedMinutes) : '--'}
                    </TableCell>
                    <TableCell>
                      {day.status === 'complete' && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                          Completo
                        </Badge>
                      )}
                      {day.status === 'incomplete' && (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                          Incompleto
                        </Badge>
                      )}
                      {day.status === 'missing' && (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                          Sem registro
                        </Badge>
                      )}
                      {day.status === 'weekend' && (
                        <Badge variant="outline">Fim de semana</Badge>
                      )}
                      {day.status === 'future' && (
                        <Badge variant="outline">--</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
