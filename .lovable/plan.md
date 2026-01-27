
# Plano de Evolução: Fenox Management System (FMS)

## Análise do Estado Atual

Após análise detalhada do código, identifiquei os seguintes pontos:

### O que já está implementado corretamente:
- Soft delete para colaboradores (status = 'terminated')
- Audit logs para ações de inativação/reativação
- RLS com roles (admin, manager, rh, user)
- Registro de ponto via tablet com PIN e geolocalização
- Filtros por status na listagem de colaboradores
- Sistema de férias com workflow de aprovação

### Gaps identificados vs requisitos FMS:

| Requisito | Status Atual | Ação Necessária |
|-----------|-------------|-----------------|
| Login via CPF | Login via email | Refatorar autenticação |
| Campos CPF/CNPJ | Não existe | Adicionar ao schema |
| Tipo contrato (CLT/PJ) | Não existe | Adicionar enum e campo |
| Tipo pagamento (Horista/Fixo) | Não existe | Adicionar enum e campo |
| Horário de trabalho | Não existe | Adicionar campo |
| PIN 4 dígitos hashado | PIN texto plano 4-6 | Ajustar para 4 fixo + hash |
| Email citext + unique | varchar sem constraint | Adicionar extensão e constraint |
| Telefone 11 dígitos | Sem validação | Adicionar CHECK + validação frontend |
| Múltiplos departamentos | 1:N (um dept por emp) | Criar tabela N:N |
| Roles expandidos | 4 roles atuais | Expandir enum |
| Regras de horas CLT/PJ/Horista | Não implementado | Criar lógica de cálculo |
| LGPD consent | Não existe | Adicionar flag + UI |
| Offline time clock | Sem suporte | Implementar com localStorage |
| Ajustes de ponto | Não existe | Criar módulo completo |
| Atestados médicos | Não existe | Criar upload + workflow |
| Bloquear DELETE físico | Apenas soft delete no código | Adicionar trigger no DB |

---

## Fase 1: Migrações de Banco de Dados

### 1.1 Habilitar citext e adicionar constraints de email

```sql
-- Habilitar extensão citext
CREATE EXTENSION IF NOT EXISTS citext;

-- Alterar coluna email para citext e adicionar UNIQUE
ALTER TABLE public.employees 
  ALTER COLUMN email TYPE citext;

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_email_unique UNIQUE (email);
```

### 1.2 Adicionar novos campos à tabela employees

```sql
-- Adicionar novos campos
ALTER TABLE public.employees
  ADD COLUMN cpf_cnpj VARCHAR(18),
  ADD COLUMN document_type VARCHAR(4) DEFAULT 'cpf' CHECK (document_type IN ('cpf', 'cnpj')),
  ADD COLUMN contract_type VARCHAR(10) DEFAULT 'clt' CHECK (contract_type IN ('clt', 'pj')),
  ADD COLUMN payment_type VARCHAR(10) DEFAULT 'fixed' CHECK (payment_type IN ('hourly', 'fixed')),
  ADD COLUMN work_schedule TEXT,
  ADD COLUMN lgpd_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN lgpd_consent_at TIMESTAMPTZ,
  ADD COLUMN biometry_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN biometry_consent_at TIMESTAMPTZ,
  ADD COLUMN pin_hash VARCHAR(255);

-- Constraint para CPF/CNPJ único
ALTER TABLE public.employees 
  ADD CONSTRAINT employees_cpf_cnpj_unique UNIQUE (cpf_cnpj);

-- Constraint para telefone (11 dígitos)
ALTER TABLE public.employees 
  ADD CONSTRAINT employees_phone_format 
  CHECK (phone IS NULL OR phone ~ '^\d{11}$');
```

### 1.3 Criar tabela N:N para múltiplos departamentos

```sql
CREATE TABLE public.employee_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, department_id)
);

ALTER TABLE public.employee_departments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view employee_departments"
  ON public.employee_departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/RH can manage employee_departments"
  ON public.employee_departments FOR ALL
  USING (has_admin_access(auth.uid()));
```

### 1.4 Expandir roles para novos perfis

```sql
-- Adicionar novos valores ao enum (PostgreSQL não permite remover, apenas adicionar)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'diretoria';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dp';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'infraestrutura';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'desenvolvimento';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'suporte';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mesa_analise';
```

### 1.5 Criar módulo de ajustes de ponto

```sql
-- Enum para status de ajuste
CREATE TYPE public.adjustment_status AS ENUM ('pending', 'approved', 'rejected');

-- Tabela de ajustes de ponto
CREATE TABLE public.time_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  original_time TIMESTAMPTZ,
  requested_time TIMESTAMPTZ NOT NULL,
  record_type time_record_type NOT NULL,
  justification TEXT NOT NULL,
  attachment_url TEXT,
  status adjustment_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.time_adjustments ENABLE ROW LEVEL SECURITY;
```

### 1.6 Bloquear DELETE físico no banco

```sql
-- Trigger para IMPEDIR DELETE físico em employees
CREATE OR REPLACE FUNCTION public.prevent_employee_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'DELETE não permitido na tabela employees. Use soft delete (status = terminated).';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_prevent_delete
  BEFORE DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_employee_delete();
```

---

## Fase 2: Refatorar Autenticação para CPF

### 2.1 Modificar AuthContext

| Arquivo | Alteração |
|---------|-----------|
| `src/contexts/AuthContext.tsx` | Alterar signIn para aceitar CPF, converter para email interno |

### Lógica de autenticação por CPF:

```text
1. Usuário digita CPF + senha
2. Sistema busca na tabela employees o email associado ao CPF
3. Usa o email para autenticar no Supabase Auth
4. Mantém compatibilidade com sistema existente
```

### 2.2 Atualizar página de Login

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/auth/Login.tsx` | Trocar campo email por CPF com máscara |
| | Adicionar validação de formato CPF |
| | Renomear labels e placeholders |

---

## Fase 3: Atualizar Formulário de Colaboradores

### 3.1 Modificar FormularioColaborador

| Campo Novo | Validação | Máscara |
|------------|-----------|---------|
| CPF/CNPJ | Algoritmo validador | 000.000.000-00 ou 00.000.000/0000-00 |
| Tipo documento | Radio CPF/CNPJ | - |
| Tipo contrato | Select CLT/PJ | - |
| Tipo pagamento | Select Horista/Fixo | - |
| Horário de trabalho | Texto | - |
| Telefone | 11 dígitos obrigatórios | (00) 00000-0000 |
| PIN | Exatamente 4 dígitos | 0000 (mascarado após salvar) |

### 3.2 Implementar hash do PIN

```typescript
// Usar bcrypt ou argon2 para hash do PIN antes de salvar
// No edge function tablet-time-clock, comparar hash
```

---

## Fase 4: Implementar Consentimento LGPD

### 4.1 Criar componente de Termos

| Arquivo Novo | Descrição |
|--------------|-----------|
| `src/components/auth/TermosLGPD.tsx` | Modal com termos e checkboxes |
| `src/pages/auth/ConsentimentoLGPD.tsx` | Página de consentimento pós-login |

### 4.2 Fluxo de consentimento

```text
1. Usuário faz login
2. Se lgpd_consent = false, redireciona para /consentimento
3. Usuário lê termos e marca checkboxes
4. Sistema atualiza employees com lgpd_consent = true e timestamp
5. Usuário pode acessar o sistema
```

---

## Fase 5: Regras de Cálculo de Horas

### 5.1 Criar serviço de cálculo

| Arquivo Novo | Descrição |
|--------------|-----------|
| `src/services/hoursCalculation.ts` | Lógica centralizada de cálculo |

### Regras implementadas:

```text
CLT:
- Jornada padrão: 8h
- Hora extra: após 11 minutos excedidos
- Atrasos: geram horas negativas
- Banco de horas quadrimestral

HORISTA:
- Qualquer minuto extra = hora positiva
- Nunca gera hora negativa

PJ:
- Apenas registro de presença
- Sem horas extras
```

---

## Fase 6: Módulo de Ajustes e Atestados

### 6.1 Criar páginas e componentes

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/rh/SolicitarAjuste.tsx` | Formulário para solicitar ajuste |
| `src/pages/rh/GerenciarAjustes.tsx` | Lista de ajustes para RH/DP aprovar |
| `src/hooks/useTimeAdjustments.ts` | CRUD de ajustes |
| `src/components/rh/UploadAtestado.tsx` | Upload de atestado médico |

### 6.2 Storage para atestados

```sql
-- Criar bucket para atestados
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-certificates', 'medical-certificates', false);
```

---

## Fase 7: Suporte Offline para Tablet

### 7.1 Implementar service worker

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/tablet/PontoTablet.tsx` | Adicionar lógica de offline |
| `public/sw.js` | Service worker para cache |

### Lógica offline:

```text
1. Detectar se está offline
2. Salvar registro no localStorage
3. Quando voltar online, sincronizar com Supabase
4. Exibir indicador visual de pendências
```

---

## Resumo de Arquivos

### Novos arquivos a criar:
- `src/services/hoursCalculation.ts`
- `src/components/auth/TermosLGPD.tsx`
- `src/pages/auth/ConsentimentoLGPD.tsx`
- `src/pages/rh/SolicitarAjuste.tsx`
- `src/pages/rh/GerenciarAjustes.tsx`
- `src/hooks/useTimeAdjustments.ts`
- `src/components/rh/UploadAtestado.tsx`
- `src/utils/cpfValidator.ts`
- `src/utils/pinHash.ts`

### Arquivos a modificar:
- `src/contexts/AuthContext.tsx` - Login por CPF
- `src/pages/auth/Login.tsx` - UI para CPF
- `src/components/rh/FormularioColaborador.tsx` - Novos campos
- `src/types/database.ts` - Novas interfaces
- `src/hooks/useEmployees.ts` - Hash de PIN
- `src/pages/tablet/PontoTablet.tsx` - Suporte offline
- `supabase/functions/tablet-time-clock/index.ts` - Comparar hash PIN

### Migrações SQL necessárias:
1. Extensão citext + constraint email
2. Novos campos employees
3. Tabela employee_departments
4. Expandir enum app_role
5. Tabela time_adjustments
6. Trigger prevent_employee_delete
7. Bucket medical-certificates

---

## Ordem de Implementação Recomendada

1. **Migrações de banco** (Fase 1) - Base para tudo
2. **Formulário colaboradores** (Fase 3) - Novos campos
3. **LGPD consent** (Fase 4) - Segurança/compliance
4. **Autenticação CPF** (Fase 2) - Requisito crítico
5. **Cálculo de horas** (Fase 5) - Regras de negócio
6. **Ajustes/Atestados** (Fase 6) - Funcionalidade RH
7. **Offline tablet** (Fase 7) - Nice to have

---

## Considerações de Segurança

- PIN será hashado com bcrypt antes de salvar
- DELETE físico bloqueado no banco por trigger
- RLS ativo em todas as tabelas sensíveis
- Consentimento LGPD obrigatório para acesso
- Atestados em bucket privado com RLS
- Validação de CPF/email em frontend, backend E banco
