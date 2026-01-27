-- ============================================
-- FASE 1 PARTE 2: ESTRUTURA FMS
-- ============================================

-- 1.1 Habilitar extensão citext
CREATE EXTENSION IF NOT EXISTS citext;

-- 1.2 Alterar coluna email para citext e adicionar UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_email_unique') THEN
    ALTER TABLE public.employees ALTER COLUMN email TYPE citext USING email::citext;
    ALTER TABLE public.employees ADD CONSTRAINT employees_email_unique UNIQUE (email);
  END IF;
END $$;

-- 1.3 Adicionar novos campos à tabela employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(18),
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(4) DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS contract_type VARCHAR(10) DEFAULT 'clt',
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(10) DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS work_schedule TEXT,
  ADD COLUMN IF NOT EXISTS lgpd_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lgpd_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS biometry_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS biometry_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);

-- Adicionar constraints
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_document_type_check') THEN ALTER TABLE public.employees ADD CONSTRAINT employees_document_type_check CHECK (document_type IN ('cpf', 'cnpj')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_contract_type_check') THEN ALTER TABLE public.employees ADD CONSTRAINT employees_contract_type_check CHECK (contract_type IN ('clt', 'pj')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_payment_type_check') THEN ALTER TABLE public.employees ADD CONSTRAINT employees_payment_type_check CHECK (payment_type IN ('hourly', 'fixed')); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_cpf_cnpj_unique') THEN ALTER TABLE public.employees ADD CONSTRAINT employees_cpf_cnpj_unique UNIQUE (cpf_cnpj); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_phone_format') THEN ALTER TABLE public.employees ADD CONSTRAINT employees_phone_format CHECK (phone IS NULL OR phone ~ '^\d{11}$'); END IF; END $$;

-- 1.4 Criar tabela N:N para múltiplos departamentos
CREATE TABLE IF NOT EXISTS public.employee_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, department_id)
);

ALTER TABLE public.employee_departments ENABLE ROW LEVEL SECURITY;

-- RLS para employee_departments
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_departments' AND policyname = 'Authenticated can view employee_departments') THEN CREATE POLICY "Authenticated can view employee_departments" ON public.employee_departments FOR SELECT TO authenticated USING (true); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_departments' AND policyname = 'Admin/RH can insert employee_departments') THEN CREATE POLICY "Admin/RH can insert employee_departments" ON public.employee_departments FOR INSERT TO authenticated WITH CHECK (has_admin_access(auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_departments' AND policyname = 'Admin/RH can update employee_departments') THEN CREATE POLICY "Admin/RH can update employee_departments" ON public.employee_departments FOR UPDATE TO authenticated USING (has_admin_access(auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_departments' AND policyname = 'Admin/RH can delete employee_departments') THEN CREATE POLICY "Admin/RH can delete employee_departments" ON public.employee_departments FOR DELETE TO authenticated USING (has_admin_access(auth.uid())); END IF; END $$;

-- 1.5 Criar tabela de ajustes de ponto
CREATE TABLE IF NOT EXISTS public.time_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  original_time TIMESTAMPTZ,
  requested_time TIMESTAMPTZ NOT NULL,
  record_type public.time_record_type NOT NULL,
  justification TEXT NOT NULL,
  attachment_url TEXT,
  status public.adjustment_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.time_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS para time_adjustments
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_adjustments' AND policyname = 'Employees can view own adjustments') THEN CREATE POLICY "Employees can view own adjustments" ON public.time_adjustments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = time_adjustments.employee_id AND e.user_id = auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_adjustments' AND policyname = 'Employees can request own adjustments') THEN CREATE POLICY "Employees can request own adjustments" ON public.time_adjustments FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = time_adjustments.employee_id AND e.user_id = auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_adjustments' AND policyname = 'Admin/RH can view all adjustments') THEN CREATE POLICY "Admin/RH can view all adjustments" ON public.time_adjustments FOR SELECT TO authenticated USING (has_admin_access(auth.uid())); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_adjustments' AND policyname = 'Admin/RH can manage adjustments') THEN CREATE POLICY "Admin/RH can manage adjustments" ON public.time_adjustments FOR UPDATE TO authenticated USING (has_admin_access(auth.uid())); END IF; END $$;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_time_adjustments_updated_at ON public.time_adjustments;
CREATE TRIGGER update_time_adjustments_updated_at BEFORE UPDATE ON public.time_adjustments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.6 Bloquear DELETE físico na tabela employees
CREATE OR REPLACE FUNCTION public.prevent_employee_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'DELETE não permitido na tabela employees. Use soft delete (status = terminated).';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS employees_prevent_delete ON public.employees;
CREATE TRIGGER employees_prevent_delete BEFORE DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.prevent_employee_delete();

-- 1.7 Bucket para atestados médicos
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-certificates', 'medical-certificates', false) ON CONFLICT (id) DO NOTHING;

-- 1.8 Atualizar função has_admin_access
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'rh', 'dp', 'diretoria'))
$$;

-- 1.9 Corrigir funções com search_path mutável
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;