
# Plano: Implementação de Soft Delete com Auditoria

## Resumo

Transformar todas as operações de "excluir" no sistema para apenas **inativar** os registros (soft delete), mantendo os dados no banco e permitindo visualização através de filtros de status.

## Contexto Atual

- **Colaboradores**: Usam `DELETE` físico no banco (`useDeleteEmployee`)
- **Férias**: Usam `DELETE` físico no banco (`useDeleteVacation`)
- **Status dos colaboradores**: Já existe enum `'active' | 'on_leave' | 'terminated'`
- **Férias**: Já possuem `cancelled` como status válido
- **Audit Log**: Não existe tabela de auditoria

## Arquitetura Proposta

```text
+-------------------+       +-------------------+
|   Botão Excluir   |  -->  |  UPDATE status    |
|   (Frontend)      |       |  + Audit Log      |
+-------------------+       +-------------------+
                                    |
                                    v
                    +-------------------------------+
                    |   Registro permanece no DB    |
                    |   status = 'terminated'       |
                    +-------------------------------+
```

## Alterações Necessárias

### 1. Banco de Dados (Migração SQL)

**Criar tabela `audit_logs`**:
- `id` (UUID)
- `entity_type` (varchar) - ex: 'employee', 'vacation'
- `entity_id` (UUID) - ID do registro afetado
- `action` (varchar) - 'soft_delete', 'reactivate', etc.
- `previous_status` (varchar)
- `new_status` (varchar)
- `performed_by` (UUID) - ID do usuário que realizou ação
- `performed_at` (timestamp)
- `notes` (text) - observações adicionais

**RLS para audit_logs**:
- Admin/RH podem visualizar todos os logs
- Usuários comuns podem ver apenas seus próprios logs

### 2. Types (`src/types/database.ts`)

| Alteração | Descrição |
|-----------|-----------|
| Adicionar `AuditLog` interface | Nova interface para logs de auditoria |

### 3. Hooks

**`src/hooks/useEmployees.ts`**:
| Função | Alteração |
|--------|-----------|
| `useDeleteEmployee` | Renomear para `useDeactivateEmployee` internamente, mas manter export com nome antigo para compatibilidade |
| Lógica | Trocar `DELETE` por `UPDATE status = 'terminated'` |
| Novo | Adicionar insert na tabela `audit_logs` |
| Toast | Alterar mensagem para "Colaborador inativado" |

**`src/hooks/useVacations.ts`**:
| Função | Alteração |
|--------|-----------|
| `useDeleteVacation` | Trocar `DELETE` por `UPDATE status = 'cancelled'` |
| Novo | Adicionar insert na tabela `audit_logs` |
| Toast | Alterar mensagem para "Solicitação cancelada" |

**`src/hooks/useAuditLogs.ts`** (novo):
| Função | Descrição |
|--------|-----------|
| `useAuditLogs` | Listar logs de auditoria com filtros |
| `useCreateAuditLog` | Inserir novo log (uso interno) |

### 4. Páginas

**`src/pages/rh/Colaboradores.tsx`**:
| Alteração | Descrição |
|-----------|-----------|
| Filtro padrão | Alterar estado inicial de `status` de `'all'` para `'active'` |
| Modal de confirmação | Alterar texto para "Este registro será inativado e poderá ser visualizado no filtro de inativos" |
| Botão Editar | Desabilitar para registros com status `terminated` |
| Novo filtro | Adicionar opção "Inativo" no Select de status (já existe como "Desligado") |

**`src/pages/rh/Ferias.tsx`**:
| Alteração | Descrição |
|-----------|-----------|
| Modal de exclusão | Alterar texto para indicar cancelamento |
| Feedback | Alterar mensagem de sucesso |

### 5. Reativação de Registros

**Novo hook `useReactivateEmployee`**:
- Apenas Admin/RH podem reativar
- Muda status de `terminated` para `active`
- Registra no audit log

**UI para reativação**:
- Adicionar botão "Reativar" no dropdown de ações
- Visível apenas para registros inativos
- Apenas para usuários com permissão

## Fluxo de Soft Delete

```text
1. Usuário clica "Excluir"
2. Modal exibe: "Este registro será inativado..."
3. Usuário confirma
4. Sistema executa:
   a. Busca status atual do registro
   b. UPDATE status = 'terminated' (ou 'cancelled' para férias)
   c. INSERT audit_log com detalhes
5. Query é invalidada
6. Registro some da listagem (filtro padrão = active)
7. Toast: "Colaborador inativado com sucesso"
```

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/XXX_audit_logs.sql` | Criar |
| `src/types/database.ts` | Modificar |
| `src/hooks/useEmployees.ts` | Modificar |
| `src/hooks/useVacations.ts` | Modificar |
| `src/hooks/useAuditLogs.ts` | Criar |
| `src/pages/rh/Colaboradores.tsx` | Modificar |
| `src/pages/rh/Ferias.tsx` | Modificar |

## Detalhes Técnicos

### Migração SQL para audit_logs

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  previous_status VARCHAR,
  new_status VARCHAR,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin/RH podem ver todos os logs
CREATE POLICY "Admin/RH can view all audit_logs"
  ON public.audit_logs FOR SELECT
  USING (has_admin_access(auth.uid()));

-- Usuários podem ver logs de suas próprias ações
CREATE POLICY "Users can view own audit_logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = performed_by);

-- Admin/RH podem inserir logs
CREATE POLICY "Admin/RH can insert audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (has_admin_access(auth.uid()));
```

### Lógica de useDeactivateEmployee

```typescript
// Pseudocódigo
async function deactivateEmployee(id: string) {
  // 1. Buscar status atual
  const { data: current } = await supabase
    .from('employees')
    .select('status')
    .eq('id', id)
    .single();

  // 2. Atualizar para inativo
  await supabase
    .from('employees')
    .update({ status: 'terminated' })
    .eq('id', id);

  // 3. Registrar auditoria
  await supabase.from('audit_logs').insert({
    entity_type: 'employee',
    entity_id: id,
    action: 'soft_delete',
    previous_status: current.status,
    new_status: 'terminated',
    performed_by: user.id,
  });
}
```

## Segurança

- Registros inativos não podem ser editados por usuários comuns
- Reativação apenas por Admin/RH
- Todas as ações são registradas no audit log
- RLS garante que apenas usuários autorizados vejam logs

## Resultado Esperado

1. Nenhum registro será fisicamente excluído do banco
2. Registros "excluídos" terão status `terminated` (colaboradores) ou `cancelled` (férias)
3. Listagem padrão mostra apenas registros ativos
4. Filtro permite visualizar registros inativos
5. Todas as ações são auditadas
6. Apenas Admin/RH podem reativar registros
