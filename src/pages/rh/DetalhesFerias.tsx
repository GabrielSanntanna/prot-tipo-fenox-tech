import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useVacation } from '@/hooks/useVacations';
import { VacationStatus } from '@/types/database';
import { ArrowLeft, Calendar, User, Building2, Clock, FileText } from 'lucide-react';

const statusLabels: Record<VacationStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
};

const statusColors: Record<VacationStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  approved: 'bg-green-500/10 text-green-600 border-green-500/30',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/30',
  cancelled: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

export default function DetalhesFerias() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vacation, isLoading, error } = useVacation(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !vacation) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Solicitação não encontrada</p>
              <Button variant="link" onClick={() => navigate('/rh/ferias')}>
                Voltar para lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Detalhes da Solicitação
              </h1>
              <Badge variant="outline" className={statusColors[vacation.status]}>
                {statusLabels[vacation.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Solicitado em {format(new Date(vacation.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-lg font-semibold">
                  {vacation.employee?.first_name?.[0]}{vacation.employee?.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium">
                  {vacation.employee?.first_name} {vacation.employee?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {vacation.employee?.email}
                </p>
                {vacation.employee?.department && (
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {vacation.employee.department.name}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período Solicitado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Início</p>
                <p className="text-lg font-semibold">
                  {format(new Date(vacation.start_date), "dd/MM/yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(vacation.start_date), "EEEE", { locale: ptBR })}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Término</p>
                <p className="text-lg font-semibold">
                  {format(new Date(vacation.end_date), "dd/MM/yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(vacation.end_date), "EEEE", { locale: ptBR })}
                </p>
              </div>
              <div className="rounded-lg border bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  {vacation.days_count}
                </p>
                <p className="text-sm text-muted-foreground">dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {vacation.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{vacation.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Status Info */}
        {(vacation.status === 'approved' || vacation.status === 'rejected') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vacation.status === 'approved' && vacation.approved_at && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-green-600">Aprovado</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(vacation.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
              {vacation.status === 'rejected' && vacation.rejection_reason && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500" />
                  <div>
                    <p className="font-medium text-red-600">Rejeitado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Motivo: {vacation.rejection_reason}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => navigate('/rh/ferias')}>
            Voltar para lista
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
