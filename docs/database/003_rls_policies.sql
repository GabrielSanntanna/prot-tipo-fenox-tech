-- =====================================================
-- SGE - SCRIPT 003: POLÍTICAS RLS
-- Execute no SQL Editor do Supabase APÓS os scripts anteriores
-- =====================================================

-- =====================================================
-- PROFILES
-- =====================================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin/RH podem ver todos os perfis
CREATE POLICY "Admin/RH can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_admin_access(auth.uid()));

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin/RH podem atualizar qualquer perfil
CREATE POLICY "Admin/RH can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_admin_access(auth.uid()));

-- =====================================================
-- USER_ROLES (Crítico para segurança)
-- =====================================================

-- Apenas admin pode ver todas as roles
CREATE POLICY "Admin can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas admin pode inserir roles
CREATE POLICY "Only admin can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Apenas admin pode atualizar roles
CREATE POLICY "Only admin can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Apenas admin pode deletar roles
CREATE POLICY "Only admin can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- DEPARTMENTS
-- =====================================================

-- Todos autenticados podem ver departamentos
CREATE POLICY "Authenticated can view departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin/RH podem gerenciar departamentos
CREATE POLICY "Admin/RH can insert departments"
  ON public.departments FOR INSERT
  WITH CHECK (public.has_admin_access(auth.uid()));

CREATE POLICY "Admin/RH can update departments"
  ON public.departments FOR UPDATE
  USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Admin can delete departments"
  ON public.departments FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- POSITIONS
-- =====================================================

-- Todos autenticados podem ver cargos
CREATE POLICY "Authenticated can view positions"
  ON public.positions FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin/RH podem gerenciar cargos
CREATE POLICY "Admin/RH can insert positions"
  ON public.positions FOR INSERT
  WITH CHECK (public.has_admin_access(auth.uid()));

CREATE POLICY "Admin/RH can update positions"
  ON public.positions FOR UPDATE
  USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Admin can delete positions"
  ON public.positions FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- EMPLOYEES
-- =====================================================

-- Admin/RH podem ver todos os colaboradores
CREATE POLICY "Admin/RH can view all employees"
  ON public.employees FOR SELECT
  USING (public.has_admin_access(auth.uid()));

-- Colaboradores podem ver seus próprios dados
CREATE POLICY "Employees can view own data"
  ON public.employees FOR SELECT
  USING (public.is_employee_owner(auth.uid(), id));

-- Managers podem ver seus subordinados
CREATE POLICY "Managers can view subordinates"
  ON public.employees FOR SELECT
  USING (
    public.is_manager(auth.uid()) 
    AND public.is_subordinate(auth.uid(), id)
  );

-- Admin/RH podem inserir colaboradores
CREATE POLICY "Admin/RH can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (public.has_admin_access(auth.uid()));

-- Admin/RH podem atualizar colaboradores
CREATE POLICY "Admin/RH can update employees"
  ON public.employees FOR UPDATE
  USING (public.has_admin_access(auth.uid()));

-- Admin pode deletar colaboradores
CREATE POLICY "Admin can delete employees"
  ON public.employees FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- VACATIONS
-- =====================================================

-- Admin/RH podem ver todas as férias
CREATE POLICY "Admin/RH can view all vacations"
  ON public.vacations FOR SELECT
  USING (public.has_admin_access(auth.uid()));

-- Colaboradores podem ver suas próprias férias
CREATE POLICY "Employees can view own vacations"
  ON public.vacations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id
        AND e.user_id = auth.uid()
    )
  );

-- Managers podem ver férias dos subordinados
CREATE POLICY "Managers can view subordinate vacations"
  ON public.vacations FOR SELECT
  USING (
    public.is_manager(auth.uid())
    AND public.is_subordinate(auth.uid(), employee_id)
  );

-- Colaboradores podem solicitar suas próprias férias
CREATE POLICY "Employees can request own vacations"
  ON public.vacations FOR INSERT
  WITH CHECK (
    auth.uid() = requested_by
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id
        AND e.user_id = auth.uid()
    )
  );

-- Admin/RH podem inserir férias para qualquer um
CREATE POLICY "Admin/RH can insert vacations"
  ON public.vacations FOR INSERT
  WITH CHECK (public.has_admin_access(auth.uid()));

-- Admin/RH/Manager podem atualizar férias
CREATE POLICY "Admin/RH can update vacations"
  ON public.vacations FOR UPDATE
  USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Managers can update subordinate vacations"
  ON public.vacations FOR UPDATE
  USING (
    public.is_manager(auth.uid())
    AND public.is_subordinate(auth.uid(), employee_id)
  );

-- Admin/RH podem deletar férias
CREATE POLICY "Admin/RH can delete vacations"
  ON public.vacations FOR DELETE
  USING (public.has_admin_access(auth.uid()));

-- =====================================================
-- TIME_RECORDS
-- =====================================================

-- Admin/RH podem ver todos os registros de ponto
CREATE POLICY "Admin/RH can view all time_records"
  ON public.time_records FOR SELECT
  USING (public.has_admin_access(auth.uid()));

-- Colaboradores podem ver seus próprios registros
CREATE POLICY "Employees can view own time_records"
  ON public.time_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id
        AND e.user_id = auth.uid()
    )
  );

-- Managers podem ver registros dos subordinados
CREATE POLICY "Managers can view subordinate time_records"
  ON public.time_records FOR SELECT
  USING (
    public.is_manager(auth.uid())
    AND public.is_subordinate(auth.uid(), employee_id)
  );

-- Colaboradores podem registrar seu próprio ponto
CREATE POLICY "Employees can insert own time_records"
  ON public.time_records FOR INSERT
  WITH CHECK (
    auth.uid() = recorded_by
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id
        AND e.user_id = auth.uid()
    )
  );

-- Admin/RH podem inserir registros para qualquer um
CREATE POLICY "Admin/RH can insert time_records"
  ON public.time_records FOR INSERT
  WITH CHECK (public.has_admin_access(auth.uid()));

-- Admin/RH podem atualizar registros
CREATE POLICY "Admin/RH can update time_records"
  ON public.time_records FOR UPDATE
  USING (public.has_admin_access(auth.uid()));

-- Admin/RH podem deletar registros
CREATE POLICY "Admin/RH can delete time_records"
  ON public.time_records FOR DELETE
  USING (public.has_admin_access(auth.uid()));
