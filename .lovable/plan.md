
# SGE - Sistema de Gerenciamento Empresarial Total

## Visão Geral
Sistema ERP corporativo completo para empresa média (10-50 usuários), com design corporativo clássico, autenticação por email/senha e sistema de permissões granulares por módulo.

---

## Fase 1: Fundação e Autenticação
**Base estrutural do sistema**

### Autenticação e Segurança
- **Tela de Login** com email/senha e recuperação de senha
- **Tela de Cadastro** para novos usuários (controlado por admin)
- Sistema de **permissões granulares** com tabela de roles separada
- Controle de acesso por módulo (Visualizar, Criar, Editar, Excluir)

### Estrutura Visual
- **Layout Principal** com barra lateral de navegação colapsável
- **Cabeçalho** com nome do usuário, notificações e logout
- **Design corporativo** em tons de azul/cinza profissional
- **Responsivo** para desktop e tablet

### Componentes Base
- **TabelaDados**: Tabela genérica com paginação, filtros e ordenação
- **FormularioGenerico**: Formulários dinâmicos para CRUD
- **CardEstatistica**: Cards para métricas e KPIs
- **ModalConfirmacao**: Diálogos de confirmação de ações

---

## Fase 2: Módulo de RH (Prioridade Principal)

### Gestão de Colaboradores
- **Listagem** com busca por nome, departamento, cargo
- **Cadastro completo**: dados pessoais, cargo, departamento, salário, data de admissão
- **Perfil do colaborador** com histórico e documentos
- **Status**: Ativo, Afastado, Desligado

### Gestão de Férias
- **Solicitação de férias** pelo colaborador
- **Fluxo de aprovação** pelo gestor
- **Calendário visual** mostrando férias da equipe
- **Saldo de férias** automático

### Registro de Ponto
- **Marcação de ponto** (entrada/saída/almoço)
- **Relatório de horas** por colaborador e período
- **Alertas** de inconsistências (horas extras, faltas)
- **Visualização em cronograma** semanal/mensal

---

## Fase 3: Módulo Financeiro

### Contas a Pagar
- Cadastro de despesas e fornecedores
- Controle de vencimentos e pagamentos
- Status: Pendente, Pago, Atrasado, Cancelado
- Alertas de vencimento próximo

### Contas a Receber
- Registro de receitas e clientes
- Controle de recebimentos
- Geração de boletos/faturas (integração futura)

### Fluxo de Caixa
- Dashboard visual com gráficos de entradas/saídas
- Projeção de fluxo de caixa futuro
- Saldo atual e histórico

---

## Fase 4: Módulo de Desenvolvimento

### Gestão de Projetos
- Cadastro de projetos com cronograma
- Alocação de equipe por projeto
- Status e progresso do projeto
- Timeline de entregas

### Kanban de Tarefas
- Quadro visual arrastar-e-soltar
- Colunas: A Fazer, Em Andamento, Revisão, Concluído
- Atribuição de responsáveis e prazos
- Priorização e etiquetas

---

## Fase 5: Módulo de Suporte

### Sistema de Chamados
- Abertura de chamados com categoria e prioridade
- Atribuição automática ou manual
- Histórico de interações
- SLA e métricas de atendimento

### Base de Conhecimento
- Artigos organizados por categoria
- Busca textual
- FAQ com perguntas frequentes

---

## Fase 6: Módulo Comercial

### CRM e Leads
- Cadastro de leads com origem e status
- Pipeline de vendas visual
- Histórico de contatos e interações
- Conversão de lead para cliente

### Vendas
- Registro de vendas com produtos/serviços
- Acompanhamento de metas
- Comissões (se aplicável)

---

## Fase 7: Análise e Diretoria

### Dashboards Personalizados
- Criação de painéis customizáveis
- Gráficos de diferentes tipos (barras, linhas, pizza)
- Filtros por período e departamento

### KPIs Estratégicos
- Indicadores-chave por módulo
- Comparativo com metas
- Tendências e alertas

### Aprovações
- Fluxo de aprovações centralizado
- Histórico de decisões
- Delegação de aprovação

---

## Fase 8: Configurações e Administração

### Gestão de Usuários e Permissões
- Cadastro de usuários do sistema
- Definição de perfis de acesso por módulo
- Matriz de permissões (Visualizar/Criar/Editar/Excluir)

### Configurações Gerais
- Dados da empresa
- Departamentos e cargos
- Parâmetros do sistema

### Log de Auditoria
- Registro automático de todas as ações
- Filtros por usuário, data, ação
- Rastreabilidade completa

---

## Backend (Supabase/Lovable Cloud)

### Banco de Dados
- 18 tabelas com relacionamentos adequados
- RLS (Row Level Security) em todas as tabelas sensíveis
- Políticas de acesso por departamento e permissão

### Edge Functions
- Relatórios financeiros complexos
- Notificações de chamados
- Validação de permissões avançada

---

## Ordem de Implementação Sugerida
1. **Fundação**: Layout, autenticação, permissões (base para tudo)
2. **RH**: Colaboradores, férias, ponto (sua prioridade)
3. **Financeiro**: Contas, fluxo de caixa
4. **Desenvolvimento**: Projetos e Kanban
5. **Suporte**: Chamados e base de conhecimento
6. **Comercial**: Leads, CRM, vendas
7. **Diretoria**: Dashboards, KPIs, aprovações
8. **Configurações**: Usuários, permissões, auditoria
