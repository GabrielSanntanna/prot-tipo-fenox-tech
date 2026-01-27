-- Adicionar coluna para senha inicial temporária (hashada)
-- O RH define esta senha ao criar o colaborador
-- No primeiro login, o colaborador será orientado a trocar a senha
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS initial_password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;