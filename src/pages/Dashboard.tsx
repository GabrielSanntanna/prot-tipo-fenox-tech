import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MainLayout from '@/components/layout/MainLayout';
import { CardEstatistica } from '@/components/shared/CardEstatistica';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { isSupabaseConfigured } from '@/integrations/supabase/client';
import {
  Users,
  Calendar,
  Clock,
  Cake,
  UserPlus,
  Building2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const statusLabels: Record<string, string> = {
  active: 'Ativos',
  on_leave: 'Afastados',
  terminated: 'Desligados',
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(30, 80%, 55%)',
];

export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (!isSupabaseConfigured) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Supabase não configurado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Configure a conexão com o Supabase para visualizar as estatísticas do dashboard.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema de gerenciamento empresarial
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* KPIs principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <CardEstatistica
                title="Colaboradores Ativos"
                value={stats?.activeEmployees?.toString() || '0'}
                description={`de ${stats?.totalEmployees || 0} total`}
                icon={Users}
              />
              <CardEstatistica
                title="Férias Aprovadas"
                value={stats?.approvedVacationsThisMonth?.toString() || '0'}
                description="Este mês"
                icon={Calendar}
              />
              <CardEstatistica
                title="Solicitações Pendentes"
                value={stats?.pendingVacations?.toString() || '0'}
                description="Aguardando aprovação"
                icon={Clock}
              />
              <CardEstatistica
                title="Aniversariantes"
                value={stats?.birthdaysThisMonth?.length?.toString() || '0'}
                description="Este mês"
                icon={Cake}
              />
            </>
          )}
        </div>

        {/* Segunda linha - Status dos colaboradores */}
        <div className="grid gap-4 md:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-500/10 p-3">
                      <UserCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ativos</p>
                      <p className="text-2xl font-bold">{stats?.activeEmployees || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-yellow-500/10 p-3">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Afastados</p>
                      <p className="text-2xl font-bold">{stats?.onLeaveEmployees || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-red-500/10 p-3">
                      <UserX className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Desligados</p>
                      <p className="text-2xl font-bold">{stats?.terminatedEmployees || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico por Departamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Colaboradores por Departamento
              </CardTitle>
              <CardDescription>
                Distribuição de colaboradores ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : stats?.employeesByDepartment && stats.employeesByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.employeesByDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="department" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                      name="Colaboradores"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Status dos Colaboradores
              </CardTitle>
              <CardDescription>
                Distribuição por situação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : stats?.employeesByStatus && stats.employeesByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={stats.employeesByStatus.map(s => ({
                        ...s,
                        name: statusLabels[s.status] || s.status,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.employeesByStatus.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Listas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Aniversariantes do Mês */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Cake className="h-5 w-5 text-primary" />
                  Aniversariantes do Mês
                </CardTitle>
                <CardDescription>
                  {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.birthdaysThisMonth && stats.birthdaysThisMonth.length > 0 ? (
                <div className="space-y-4">
                  {stats.birthdaysThisMonth.slice(0, 5).map((person) => (
                    <div key={person.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {person.first_name[0]}{person.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {person.first_name} {person.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {person.department || 'Sem departamento'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {format(new Date(person.birth_date), 'dd/MM')}
                      </Badge>
                    </div>
                  ))}
                  {stats.birthdaysThisMonth.length > 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/rh/colaboradores">
                        Ver todos ({stats.birthdaysThisMonth.length})
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum aniversariante este mês
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contratações Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Contratações Recentes
                </CardTitle>
                <CardDescription>
                  Últimos 30 dias
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/rh/colaboradores/novo">
                  Nova contratação
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentHires && stats.recentHires.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentHires.slice(0, 5).map((person) => (
                    <div key={person.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-green-500/10 text-green-600">
                          {person.first_name[0]}{person.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {person.first_name} {person.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {person.department || 'Sem departamento'}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {format(new Date(person.hire_date), 'dd/MM/yyyy')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma contratação recente
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Atalhos rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link to="/rh/colaboradores">
                  <Users className="h-6 w-6" />
                  <span>Colaboradores</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link to="/rh/ferias">
                  <Calendar className="h-6 w-6" />
                  <span>Férias</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link to="/rh/ponto">
                  <Clock className="h-6 w-6" />
                  <span>Ponto Eletrônico</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                <Link to="/rh/colaboradores/novo">
                  <UserPlus className="h-6 w-6" />
                  <span>Novo Colaborador</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
