import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Loader2,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  UserCircle,
  DollarSign,
  Trash2,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ModalConfirmacao } from '@/components/shared/ModalConfirmacao';
import { useEmployee, useDeleteEmployee } from '@/hooks/useEmployees';
import { EmployeeStatus } from '@/types/database';
import { useState } from 'react';

const statusLabels: Record<EmployeeStatus, string> = {
  active: 'Ativo',
  on_leave: 'Afastado',
  terminated: 'Desligado',
};

const statusColors: Record<EmployeeStatus, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  on_leave: 'secondary',
  terminated: 'destructive',
};

function formatDate(date: string | null) {
  if (!date) return '-';
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function formatCurrency(value: number | null) {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function PerfilColaborador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id);
  const deleteEmployee = useDeleteEmployee();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    if (!id) return;
    deleteEmployee.mutate(id, {
      onSuccess: () => {
        navigate('/rh/colaboradores');
      },
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!employee) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Colaborador não encontrado.</p>
              <Button className="mt-4" onClick={() => navigate('/rh/colaboradores')}>
                Voltar para Lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
                {employee.first_name[0]}{employee.last_name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {employee.first_name} {employee.last_name}
                </h1>
                <p className="text-muted-foreground">
                  {employee.position?.name || 'Sem cargo definido'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/rh/colaboradores/${employee.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCircle className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
              {employee.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.address}</span>
                </div>
              )}
              {employee.birth_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Nascimento: {formatDate(employee.birth_date)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={statusColors[employee.status]}>
                  {statusLabels[employee.status]}
                </Badge>
              </div>
              <Separator />
              {employee.employee_code && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Código</span>
                  <span className="font-mono">{employee.employee_code}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Admissão</span>
                <span>{formatDate(employee.hire_date)}</span>
              </div>
              {employee.department && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.department.name}</span>
                </div>
              )}
              {employee.position && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.position.name}</span>
                </div>
              )}
              {employee.manager && (
                <div className="flex items-center gap-3 text-sm">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Gestor: {employee.manager.first_name} {employee.manager.last_name}</span>
                </div>
              )}
              {employee.salary && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatCurrency(employee.salary)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          {employee.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {employee.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ModalConfirmacao
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Excluir colaborador"
        description={`Tem certeza que deseja excluir ${employee.first_name} ${employee.last_name}? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        confirmText="Excluir"
        variant="destructive"
      />
    </MainLayout>
  );
}
