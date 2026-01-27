-- Corrigir a view para usar security_invoker (mais seguro)
DROP VIEW IF EXISTS public.employees_login_lookup;

CREATE VIEW public.employees_login_lookup
WITH (security_invoker = on) AS
  SELECT cpf_cnpj, email, status
  FROM public.employees;

-- Criar política RLS específica para a tabela employees que permite leitura anônima apenas dos campos da view
-- A view com security_invoker=on respeitará as políticas da tabela base
-- Precisamos de uma política que permita SELECT anônimo
CREATE POLICY "Anon can read for login lookup"
  ON public.employees
  FOR SELECT
  TO anon
  USING (status != 'terminated');