
# Plano de Implementacao: Onboarding de Usuarios com Senha e Troca Obrigatoria

## Analise do Estado Atual

### Campos ja existentes na tabela `employees`:
- `initial_password` (VARCHAR) - para senha temporaria
- `password_changed` (BOOLEAN, default false) - rastreamento de troca
- `password_changed_at` (TIMESTAMPTZ) - timestamp da troca
- `user_id` (UUID) - vinculo com auth.users

### O que precisa ser implementado:
1. Campo `must_change_password` na tabela employees
2. Campos de senha no formulario de cadastro
3. Edge function para criar employee + auth user na ordem correta
4. Tela de troca obrigatoria de senha
5. Guard de rota para bloquear acesso sem trocar senha
6. Tela de alteracao de senha para usuario
7. Funcionalidade de reset de senha pelo RH

---

## Fase 1: Migracao de Banco de Dados

### 1.1 Adicionar campo `must_change_password`

```sql
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;

-- Atualizar registros existentes que ja trocaram senha
UPDATE public.employees 
SET must_change_password = FALSE 
WHERE password_changed = TRUE;

-- Comentario para documentacao
COMMENT ON COLUMN public.employees.must_change_password IS 
  'Flag que indica se o colaborador deve trocar a senha no proximo login';
```

---

## Fase 2: Edge Function para Criar Colaborador

### 2.1 Criar `supabase/functions/create-employee/index.ts`

Esta function garante a ordem correta de criacao:
1. Criar registro em `employees` (sem user_id)
2. Criar usuario em `auth.users` com service role
3. Atualizar `employees.user_id` com o ID do auth user
4. Adicionar role padrao em `user_roles`

**Fluxo de rollback logico:**
- Se falhar ao criar auth user: manter employee sem user_id
- Se falhar ao vincular: log de erro, employee fica sem acesso

```text
Parametros aceitos:
- first_name, last_name, email, cpf_cnpj
- password (senha inicial)
- pin, phone, department_id, etc
- role (default: 'user')

Resposta:
- employee_id
- user_id
- credentials (email, cpf para login)
```

---

## Fase 3: Atualizar Formulario de Colaborador

### 3.1 Adicionar campos de senha no schema Zod

```typescript
// Novos campos no formSchema
initial_password: z.string()
  .min(8, 'Senha deve ter no minimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter letra maiuscula')
  .regex(/[0-9]/, 'Senha deve conter numero')
  .optional()
  .or(z.literal('')),

confirm_password: z.string().optional().or(z.literal('')),

// Refinement para validar confirmacao
.refine((data) => {
  if (data.initial_password && data.confirm_password) {
    return data.initial_password === data.confirm_password;
  }
  return true;
}, {
  message: 'Senhas nao conferem',
  path: ['confirm_password'],
});
```

### 3.2 Adicionar Card de Credenciais no formulario

```text
Card "Credenciais de Acesso" (apenas para novo colaborador):
+----------------------------------+
| Senha Inicial *                  |
| [**********] [eye icon]          |
| Minimo 8 caracteres, 1 maiuscula |
+----------------------------------+
| Confirmar Senha *                |
| [**********] [eye icon]          |
+----------------------------------+
| [!] Aviso: Esta e uma senha      |
| temporaria. O colaborador sera   |
| obrigado a troca-la no primeiro  |
| acesso ao sistema.               |
+----------------------------------+
```

### 3.3 Modificar `useCreateEmployee` hook

```typescript
// Chamar edge function em vez de insert direto
const response = await supabase.functions.invoke('create-employee', {
  body: {
    ...employeeData,
    password: data.initial_password,
    role: 'user'
  }
});
```

---

## Fase 4: Verificacao de Primeiro Acesso

### 4.1 Criar hook `usePasswordCheck`

```typescript
// src/hooks/usePasswordCheck.ts
export function usePasswordCheck() {
  const { user } = useAuth();
  
  const { data: mustChangePassword, isLoading } = useQuery({
    queryKey: ['password-check', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('must_change_password')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      return data?.must_change_password ?? false;
    },
    enabled: !!user,
  });
  
  return { mustChangePassword, isLoading };
}
```

### 4.2 Modificar `ProtectedRoute`

```typescript
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { mustChangePassword, isLoading: checkLoading } = usePasswordCheck();
  const location = useLocation();
  
  if (authLoading || checkLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Bloquear acesso se deve trocar senha (exceto pagina de troca)
  if (mustChangePassword && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }
  
  return <>{children}</>;
}
```

---

## Fase 5: Tela de Troca Obrigatoria de Senha

### 5.1 Criar `src/pages/auth/TrocarSenha.tsx`

```text
Layout da pagina:
+----------------------------------------+
|            [Logo FMS]                  |
|                                        |
|   Troca de Senha Obrigatoria           |
|   Por seguranca, voce deve alterar     |
|   sua senha no primeiro acesso.        |
|                                        |
| +------------------------------------+ |
| | Nova Senha *                       | |
| | [**********] [eye]                 | |
| | Min 8 chars, 1 maiuscula, 1 numero | |
| +------------------------------------+ |
| | Confirmar Nova Senha *             | |
| | [**********] [eye]                 | |
| +------------------------------------+ |
|                                        |
|      [Alterar Senha e Continuar]       |
+----------------------------------------+
```

### 5.2 Logica de troca

```typescript
const handleSubmit = async (values) => {
  // 1. Atualizar senha no Supabase Auth
  const { error: authError } = await supabase.auth.updateUser({
    password: values.new_password
  });
  
  if (authError) throw authError;
  
  // 2. Atualizar flags no employee
  const { error: empError } = await supabase
    .from('employees')
    .update({
      must_change_password: false,
      password_changed: true,
      password_changed_at: new Date().toISOString()
    })
    .eq('user_id', user.id);
  
  if (empError) throw empError;
  
  // 3. Redirecionar para dashboard
  navigate('/dashboard');
};
```

---

## Fase 6: Alteracao de Senha pelo Usuario

### 6.1 Criar `src/pages/configuracoes/AlterarSenha.tsx`

```text
Pagina acessivel via menu do usuario:
+----------------------------------------+
|   Alterar Minha Senha                  |
|                                        |
| +------------------------------------+ |
| | Senha Atual *                      | |
| | [**********] [eye]                 | |
| +------------------------------------+ |
| | Nova Senha *                       | |
| | [**********] [eye]                 | |
| +------------------------------------+ |
| | Confirmar Nova Senha *             | |
| | [**********] [eye]                 | |
| +------------------------------------+ |
|                                        |
|   [Cancelar]      [Salvar]             |
+----------------------------------------+
```

### 6.2 Validacao de senha atual

```typescript
// Verificar senha atual antes de permitir troca
const { error } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: currentPassword
});

if (error) {
  setError('current_password', { message: 'Senha atual incorreta' });
  return;
}
```

---

## Fase 7: Reset de Senha pelo RH

### 7.1 Criar `src/components/rh/ResetSenhaModal.tsx`

```text
Modal acionado pelo RH na listagem de colaboradores:
+----------------------------------------+
|   Resetar Senha - [Nome Colaborador]   |
|                                        |
| +------------------------------------+ |
| | Nova Senha Temporaria *            | |
| | [**********] [eye] [gerar]         | |
| +------------------------------------+ |
| | Confirmar Senha *                  | |
| | [**********] [eye]                 | |
| +------------------------------------+ |
|                                        |
| [!] O colaborador sera obrigado a      |
| trocar esta senha no proximo login.    |
|                                        |
|   [Cancelar]      [Resetar Senha]      |
+----------------------------------------+
```

### 7.2 Edge function para reset

```typescript
// supabase/functions/reset-employee-password/index.ts
// Usa service role para atualizar senha no auth.users
// E atualiza must_change_password = true no employee
```

---

## Fase 8: RLS e Seguranca

### 8.1 Proteger campo `user_id`

```sql
-- Apenas service role pode alterar user_id
-- RLS ja impede usuarios comuns de UPDATE em employees
-- Mas adicionar verificacao extra na edge function
```

### 8.2 Verificacoes de permissao

```text
Usuario comum:
- Pode alterar apenas propria senha via Supabase Auth
- Nao pode acessar initial_password de outros

RH/Admin:
- Pode resetar senha via edge function
- Pode ver status must_change_password
- Nao ve senha atual de ninguem (armazenada no Auth)
```

---

## Resumo de Arquivos

### Novos arquivos:
| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/create-employee/index.ts` | Criar employee + auth user |
| `supabase/functions/reset-employee-password/index.ts` | Reset senha pelo RH |
| `src/pages/auth/TrocarSenha.tsx` | Tela de troca obrigatoria |
| `src/pages/configuracoes/AlterarSenha.tsx` | Tela de alteracao de senha |
| `src/hooks/usePasswordCheck.ts` | Hook para verificar must_change_password |
| `src/components/rh/ResetSenhaModal.tsx` | Modal de reset pelo RH |

### Arquivos modificados:
| Arquivo | Alteracao |
|---------|-----------|
| `src/components/rh/FormularioColaborador.tsx` | Adicionar campos de senha |
| `src/hooks/useEmployees.ts` | Usar edge function para criar |
| `src/components/auth/ProtectedRoute.tsx` | Verificar must_change_password |
| `src/types/database.ts` | Adicionar must_change_password |
| `src/App.tsx` | Adicionar rota /trocar-senha |

### Migracoes SQL:
| Migracao | Descricao |
|----------|-----------|
| `add_must_change_password.sql` | Campo must_change_password |

---

## Ordem de Implementacao

1. **Migracao DB** - Adicionar campo must_change_password
2. **Edge function create-employee** - Garantir ordem correta
3. **Formulario colaborador** - Campos de senha
4. **Hook usePasswordCheck** - Verificacao de primeiro acesso
5. **ProtectedRoute** - Guard de rota
6. **Tela TrocarSenha** - Troca obrigatoria
7. **Tela AlterarSenha** - Usuario altera propria senha
8. **Edge function reset-password** - RH reseta senha
9. **Modal ResetSenha** - UI para RH

---

## Consideracoes de Seguranca

- Senhas NUNCA armazenadas fora do Supabase Auth
- `initial_password` armazena apenas para referencia do RH (opcional remover)
- Edge functions usam service role para operacoes privilegiadas
- RLS impede usuarios de modificar dados de outros
- Guard de rota impede bypass por URL
- Validacao de senha atual antes de permitir alteracao
