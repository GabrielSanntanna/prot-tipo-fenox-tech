import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from '@/hooks/useEmployees';
import {
  useTodayRecords,
  useCreateTimeRecord,
  calculateWorkedHours,
  getNextRecordType,
  recordTypeLabels,
} from '@/hooks/useTimeRecords';
import { TimeRecordType } from '@/types/database';
import { Clock, Calendar, FileText, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import HistoricoPonto from '@/components/rh/HistoricoPonto';
import RelatorioMensal from '@/components/rh/RelatorioMensal';

export default function Ponto() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: todayRecords, isLoading: loadingRecords } = useTodayRecords(selectedEmployee || undefined);
  const createRecord = useCreateTimeRecord();

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select first employee (in real app, this would be the logged-in user's employee)
  useEffect(() => {
    if (employees && employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].id);
    }
  }, [employees, selectedEmployee]);

  const nextRecordType = todayRecords ? getNextRecordType(todayRecords) : 'entry';
  const workedHours = todayRecords ? calculateWorkedHours(todayRecords) : null;

  const handleRegisterPoint = async (type: TimeRecordType) => {
    if (!selectedEmployee) return;

    try {
      await createRecord.mutateAsync({
        employee_id: selectedEmployee,
        type,
      });
      toast({
        title: 'Ponto registrado',
        description: `${recordTypeLabels[type]} registrada às ${format(new Date(), 'HH:mm')}`,
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o ponto.',
        variant: 'destructive',
      });
    }
  };

  const selectedEmployeeData = employees?.find(e => e.id === selectedEmployee);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ponto Eletrônico</h1>
          <p className="text-muted-foreground">
            Registre seu ponto e visualize seu histórico
          </p>
        </div>

        <Tabs defaultValue="registro" className="space-y-4">
          <TabsList>
            <TabsTrigger value="registro" className="gap-2">
              <Clock className="h-4 w-4" />
              Registro
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <Calendar className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="relatorio" className="gap-2">
              <FileText className="h-4 w-4" />
              Relatório Mensal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registro" className="space-y-6">
            {/* Employee Selector - in production, this would be the logged-in user */}
            {loadingEmployees ? (
              <Skeleton className="h-10 w-64" />
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Colaborador:</span>
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Time Clock Card */}
              <Card className="md:col-span-1">
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl font-bold tabular-nums">
                    {format(currentTime, 'HH:mm:ss')}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingRecords ? (
                    <Skeleton className="h-12 w-full" />
                  ) : nextRecordType ? (
                    <Button
                      size="lg"
                      className="w-full text-lg h-14"
                      onClick={() => handleRegisterPoint(nextRecordType)}
                      disabled={createRecord.isPending}
                    >
                      {createRecord.isPending ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Clock className="mr-2 h-5 w-5" />
                      )}
                      Registrar {recordTypeLabels[nextRecordType]}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Todos os registros do dia concluídos</span>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {(['entry', 'lunch_out', 'lunch_in', 'exit'] as TimeRecordType[]).map((type) => {
                      const isRegistered = todayRecords?.some(r => r.type === type);
                      return (
                        <Button
                          key={type}
                          variant={isRegistered ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => handleRegisterPoint(type)}
                          disabled={createRecord.isPending || isRegistered}
                          className="justify-start"
                        >
                          {isRegistered && <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />}
                          {recordTypeLabels[type]}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Dia</CardTitle>
                  <CardDescription>
                    Registros de {format(currentTime, "dd/MM/yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingRecords ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : (
                    <>
                      {/* Records Timeline */}
                      <div className="space-y-3">
                        {todayRecords && todayRecords.length > 0 ? (
                          todayRecords.map((record) => (
                            <div
                              key={record.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                  <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{recordTypeLabels[record.type]}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(record.record_time), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">
                                {recordTypeLabels[record.type]}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            Nenhum registro hoje
                          </div>
                        )}
                      </div>

                      {/* Worked Hours */}
                      {workedHours && workedHours.totalMinutes > 0 && (
                        <div className="rounded-lg border bg-muted/50 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Horas trabalhadas</span>
                            <span className="text-2xl font-bold text-primary">
                              {workedHours.formattedTime}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoPonto employeeId={selectedEmployee || undefined} />
          </TabsContent>

          <TabsContent value="relatorio">
            <RelatorioMensal employeeId={selectedEmployee || undefined} employeeName={selectedEmployeeData ? `${selectedEmployeeData.first_name} ${selectedEmployeeData.last_name}` : ''} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
