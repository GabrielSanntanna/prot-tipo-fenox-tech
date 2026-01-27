-- PARTE 1: Apenas adicionar novos valores ao enum app_role
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'diretoria'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dp'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'infraestrutura'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'desenvolvimento'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'suporte'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mesa_analise'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Criar enum adjustment_status
DO $$ BEGIN CREATE TYPE public.adjustment_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;