import MainLayout from '@/components/layout/MainLayout';
import { CardEstatistica } from '@/components/shared/CardEstatistica';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock, DollarSign, FolderKanban, Headphones, TrendingUp, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gerenciamento empresarial
          </p>
        </div>

        {/* KPIs principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardEstatistica
            title="Total de Colaboradores"
            value="48"
            description="Ativos no sistema"
            icon={Users}
            trend={{ value: 4.5, isPositive: true }}
          />
          <CardEstatistica
            title="Férias em Andamento"
            value="5"
            description="Colaboradores de férias"
            icon={Calendar}
          />
          <CardEstatistica
            title="Horas Trabalhadas"
            value="1.840"
            description="Este mês"
            icon={Clock}
            trend={{ value: 2.1, isPositive: true }}
          />
          <CardEstatistica
            title="Projetos Ativos"
            value="12"
            description="Em desenvolvimento"
            icon={FolderKanban}
          />
        </div>

        {/* Segunda linha de KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardEstatistica
            title="Receita Mensal"
            value="R$ 285.400"
            description="Realizado"
            icon={DollarSign}
            trend={{ value: 8.2, isPositive: true }}
          />
          <CardEstatistica
            title="Chamados Abertos"
            value="23"
            description="Aguardando atendimento"
            icon={Headphones}
            trend={{ value: 12, isPositive: false }}
          />
          <CardEstatistica
            title="Leads Ativos"
            value="67"
            description="No funil de vendas"
            icon={TrendingUp}
            trend={{ value: 15, isPositive: true }}
          />
          <CardEstatistica
            title="Tarefas Concluídas"
            value="142"
            description="Esta semana"
            icon={CheckCircle}
          />
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Recursos Humanos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Colaboradores ativos</span>
                  <span className="font-medium">48</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Em férias</span>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Afastados</span>
                  <span className="font-medium">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Solicitações pendentes</span>
                  <span className="font-medium">8</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Receitas do mês</span>
                  <span className="font-medium text-success">R$ 285.400</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Despesas do mês</span>
                  <span className="font-medium text-destructive">R$ 198.200</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Contas a receber</span>
                  <span className="font-medium">R$ 45.800</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contas a pagar</span>
                  <span className="font-medium">R$ 32.100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
