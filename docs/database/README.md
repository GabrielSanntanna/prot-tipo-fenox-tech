# SGE - Scripts SQL para Supabase

Este diretório contém os scripts SQL que devem ser executados no seu projeto Supabase.

## Ordem de Execução

Execute os scripts no **SQL Editor** do Supabase Dashboard na seguinte ordem:

1. `001_base_tables.sql` - Cria tipos e tabelas base
2. `002_helper_functions.sql` - Funções helper para RLS
3. `003_rls_policies.sql` - Políticas de segurança RLS
4. `004_seed_data.sql` - Dados iniciais (departamentos e cargos)

## Como Executar

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor**
3. Copie e cole o conteúdo de cada arquivo
4. Clique em **Run** (ou Ctrl/Cmd + Enter)
5. Repita para cada arquivo na ordem

## Após a Configuração

Para criar o primeiro usuário admin:

1. Crie um usuário através da autenticação (login/signup)
2. Encontre o UUID do usuário na tabela `auth.users`
3. Execute o comando:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID_DO_USUARIO', 'admin');
```

## Estrutura do Banco

### Tabelas
- `profiles` - Perfis de usuários (vinculado a auth.users)
- `user_roles` - Roles de usuários (admin, manager, rh, user)
- `departments` - Departamentos da empresa
- `positions` - Cargos
- `employees` - Colaboradores
- `vacations` - Solicitações de férias
- `time_records` - Registros de ponto

### Tipos Enum
- `app_role` - admin, manager, rh, user
- `vacation_status` - pending, approved, rejected, cancelled
- `time_record_type` - entry, lunch_out, lunch_in, exit
- `employee_status` - active, on_leave, terminated
