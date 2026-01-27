-- Criar política para permitir busca de email por CPF no login (antes da autenticação)
CREATE POLICY "Allow CPF lookup for login"
  ON public.employees
  FOR SELECT
  TO anon
  USING (true);

-- Restringir a política anon para retornar apenas campos necessários via view
-- Por segurança, vamos criar uma view específica para login
DROP POLICY IF EXISTS "Allow CPF lookup for login" ON public.employees;

-- Criar view segura para login que expõe apenas o necessário
CREATE VIEW public.employees_login_lookup
WITH (security_invoker = false) AS
  SELECT cpf_cnpj, email, status
  FROM public.employees
  WHERE status != 'terminated';

-- Permitir acesso anônimo à view
GRANT SELECT ON public.employees_login_lookup TO anon;