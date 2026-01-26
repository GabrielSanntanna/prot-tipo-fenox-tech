import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Users } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ModalConfirmacao } from '@/components/shared/ModalConfirmacao';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { EmployeeStatus } from '@/types/database';
import { isSupabaseConfigured } from '@/integrations/supabase/client';

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

export default function Colaboradores() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EmployeeStatus | 'all'>('all');
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: employees, isLoading } = useEmployees({
    search: search || undefined,
    status,
    department_id: departmentId !== 'all' ? departmentId : undefined,
  });

  const { data: departments } = useDepartments();
  const deleteEmployee = useDeleteEmployee();

  const handleDelete = () => {
    if (deleteId) {
      deleteEmployee.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Módulo de RH
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configure as variáveis de ambiente do Supabase para acessar o módulo de colaboradores.
              </p>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Colaboradores</h1>
            <p className="text-muted-foreground">
              Gerencie os colaboradores da empresa
            </p>
          </div>
          <Button asChild>
            <Link to="/rh/colaboradores/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Colaborador
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={status} onValueChange={(v) => setStatus(v as EmployeeStatus | 'all')}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="on_leave">Afastado</SelectItem>
                  <SelectItem value="terminated">Desligado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : employees?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhum colaborador encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees?.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                            {employee.first_name[0]}{employee.last_name[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {employee.employee_code || '-'}
                      </TableCell>
                      <TableCell>{employee.department?.name || '-'}</TableCell>
                      <TableCell>{employee.position?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[employee.status]}>
                          {statusLabels[employee.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/rh/colaboradores/${employee.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Perfil
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/rh/colaboradores/${employee.id}/editar`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(employee.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ModalConfirmacao
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir colaborador"
        description="Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        confirmText="Excluir"
        variant="destructive"
      />
    </MainLayout>
  );
}
