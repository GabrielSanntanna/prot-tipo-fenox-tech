import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useApprovedVacations } from '@/hooks/useVacations';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Colors for different employees
const employeeColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-red-500',
];

export default function CalendarioFerias() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: vacations, isLoading } = useApprovedVacations(year, month);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate start padding for first day of month
  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  // Group vacations by employee with consistent colors
  const employeeColorMap = useMemo(() => {
    const map = new Map<string, string>();
    vacations?.forEach((vacation, index) => {
      if (!map.has(vacation.employee_id)) {
        map.set(vacation.employee_id, employeeColors[index % employeeColors.length]);
      }
    });
    return map;
  }, [vacations]);

  // Get vacations for a specific day
  const getVacationsForDay = (day: Date) => {
    if (!vacations) return [];
    return vacations.filter((vacation) => {
      const start = parseISO(vacation.start_date);
      const end = parseISO(vacation.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((current) => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="rounded-lg border">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {/* Padding for first week */}
              {paddingDays.map((_, index) => (
                <div key={`pad-${index}`} className="min-h-24 border-b border-r bg-muted/20 p-2" />
              ))}

              {/* Actual days */}
              {days.map((day, index) => {
                const dayVacations = getVacationsForDay(day);
                const isCurrentDay = isToday(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const showRightBorder = (startPadding + index + 1) % 7 !== 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-24 border-b p-2 transition-colors',
                      showRightBorder && 'border-r',
                      isWeekend && 'bg-muted/20',
                      isCurrentDay && 'bg-primary/5'
                    )}
                  >
                    <div className="flex justify-between">
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-sm',
                          isCurrentDay && 'bg-primary text-primary-foreground font-semibold'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Vacation indicators */}
                    <div className="mt-1 space-y-1">
                      <TooltipProvider>
                        {dayVacations.slice(0, 3).map((vacation) => (
                          <Tooltip key={vacation.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'truncate rounded px-1 py-0.5 text-xs text-white cursor-pointer',
                                  employeeColorMap.get(vacation.employee_id) || 'bg-gray-500'
                                )}
                              >
                                {vacation.employee?.first_name} {vacation.employee?.last_name?.[0]}.
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-medium">
                                  {vacation.employee?.first_name} {vacation.employee?.last_name}
                                </p>
                                <p className="text-muted-foreground">
                                  {format(parseISO(vacation.start_date), 'dd/MM')} - {format(parseISO(vacation.end_date), 'dd/MM')}
                                </p>
                                <p className="text-muted-foreground">
                                  {vacation.days_count} dias
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {dayVacations.length > 3 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-muted-foreground cursor-pointer">
                                +{dayVacations.length - 3} mais
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                {dayVacations.slice(3).map((vacation) => (
                                  <p key={vacation.id} className="text-sm">
                                    {vacation.employee?.first_name} {vacation.employee?.last_name}
                                  </p>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          {vacations && vacations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Colaboradores:</span>
              {Array.from(new Set(vacations.map(v => v.employee_id))).map((employeeId) => {
                const vacation = vacations.find(v => v.employee_id === employeeId);
                return (
                  <Badge
                    key={employeeId}
                    variant="outline"
                    className="gap-1"
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        employeeColorMap.get(employeeId) || 'bg-gray-500'
                      )}
                    />
                    {vacation?.employee?.first_name} {vacation?.employee?.last_name}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {(!vacations || vacations.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma férias aprovada para este mês
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
