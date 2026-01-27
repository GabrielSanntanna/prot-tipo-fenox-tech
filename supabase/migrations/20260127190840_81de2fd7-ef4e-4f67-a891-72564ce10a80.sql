-- Adicionar campo must_change_password para controlar troca obrigatória de senha
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;

-- Atualizar registros existentes que já trocaram senha
UPDATE public.employees 
SET must_change_password = FALSE 
WHERE password_changed = TRUE;

-- Comentário para documentação
COMMENT ON COLUMN public.employees.must_change_password IS 
  'Flag que indica se o colaborador deve trocar a senha no próximo login';

-- Adicionar política RLS para permitir que usuários atualizem seu próprio must_change_password
CREATE POLICY "Users can update own password flags"
ON public.employees
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());