import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useVacations, useUpdateVacationStatus, useDeleteVacation } from '@/hooks/useVacations';
import { VacationStatus } from '@/types/database';
import { Plus, Search, Calendar, Check, X, Trash2, Eye, CalendarDays } from 'lucide-react';
import CalendarioFerias from '@/components/rh/CalendarioFerias';

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

export default function Ferias() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VacationStatus | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { toast } = useToast();

  const { data: vacations, isLoading, error } = useVacations(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const updateStatus = useUpdateVacationStatus();
  const deleteVacation = useDeleteVacation();

  const filteredVacations = vacations?.filter((vacation) => {
    const employeeName = `${vacation.employee?.first_name} ${vacation.employee?.last_name}`.toLowerCase();
    return employeeName.includes(search.toLowerCase());
  });

  const handleApprove = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'approved' });
      toast({
        title: 'Férias aprovadas',
        description: 'A solicitação de férias foi aprovada com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar as férias.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await updateStatus.mutateAsync({
        id: rejectId,
        status: 'rejected',
        rejection_reason: rejectReason,
      });
      toast({
        title: 'Férias rejeitadas',
        description: 'A solicitação de férias foi rejeitada.',
      });
      setRejectId(null);
      setRejectReason('');
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar as férias.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVacation.mutateAsync(deleteId);
      toast({
        title: 'Solicitação cancelada',
        description: 'A solicitação de férias foi cancelada e pode ser visualizada no filtro "Cancelado".',
      });
      setDeleteId(null);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a solicitação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Férias</h1>
            <p className="text-muted-foreground">
              Gerencie solicitações de férias dos colaboradores
            </p>
          </div>
          <Button asChild>
            <Link to="/rh/ferias/solicitar">
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista" className="gap-2">
              <Calendar className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por colaborador..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as VacationStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Solicitado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-destructive">
                        Erro ao carregar férias
                      </TableCell>
                    </TableRow>
                  ) : filteredVacations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhuma solicitação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVacations?.map((vacation) => (
                      <TableRow key={vacation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {vacation.employee?.first_name} {vacation.employee?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {vacation.employee?.department?.name || 'Sem departamento'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(vacation.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          {' - '}
                          {format(new Date(vacation.end_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{vacation.days_count} dias</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[vacation.status]}>
                            {statusLabels[vacation.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(vacation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {vacation.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApprove(vacation.id)}
                                  title="Aprovar"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setRejectId(vacation.id)}
                                  title="Rejeitar"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Ver detalhes"
                            >
                              <Link to={`/rh/ferias/${vacation.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(vacation.id)}
                              title="Excluir"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="calendario">
            <CalendarioFerias />
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Dialog (Soft Delete) */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar solicitação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta solicitação será cancelada e poderá ser visualizada no filtro "Cancelado". Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Solicitação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para o colaborador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da rejeição</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
