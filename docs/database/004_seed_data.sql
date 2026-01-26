-- =====================================================
-- SGE - SCRIPT 004: DADOS INICIAIS
-- Execute no SQL Editor do Supabase APÓS os scripts anteriores
-- =====================================================

-- Inserir departamentos padrão
INSERT INTO public.departments (name, description) VALUES
  ('Recursos Humanos', 'Gestão de pessoas e processos de RH'),
  ('Financeiro', 'Gestão financeira e contábil'),
  ('Tecnologia', 'Desenvolvimento e infraestrutura de TI'),
  ('Comercial', 'Vendas e relacionamento com clientes'),
  ('Operações', 'Gestão operacional e logística'),
  ('Administrativo', 'Serviços administrativos gerais')
ON CONFLICT (name) DO NOTHING;

-- Inserir cargos padrão (após departamentos)
INSERT INTO public.positions (name, department_id, description)
SELECT 'Diretor', id, 'Direção geral do departamento'
FROM public.departments WHERE name = 'Administrativo';

INSERT INTO public.positions (name, department_id, description)
SELECT 'Gerente de RH', id, 'Gerência de Recursos Humanos'
FROM public.departments WHERE name = 'Recursos Humanos';

INSERT INTO public.positions (name, department_id, description)
SELECT 'Analista de RH', id, 'Análise e processos de RH'
FROM public.departments WHERE name = 'Recursos Humanos';

INSERT INTO public.positions (name, department_id, description)
SELECT 'Gerente Financeiro', id, 'Gerência Financeira'
FROM public.departments WHERE name = 'Financeiro';

INSERT INTO public.positions (name, department_id, description)
SELECT 'Analista Financeiro', id, 'Análise financeira e contábil'
FROM public.departments WHERE name = 'Financeiro';

INSERT INTO public.positions (name, department_id, description)
SELECT 'Gerente de TI', id, 'Gerência de Tecnologia da Informação'
FROM public.departments WHERE name = 'Tecnologia';

INSERT INTO public.positions (name, department_id, description)
SELECT 'Desenvolvedor', id, 'Desenvolvimento de software'
FROM public.departments WHERE name = 'Tecnologia';

INSERT INTO public.positions (name, department_id, description)
SELECT 'Gerente Comercial', id, 'Gerência Comercial'
FROM public.departments WHERE name = 'Comercial';

INSERT INTO public.positions (name, department_id, description)
SELECT 'Vendedor', id, 'Vendas e prospecção'
FROM public.departments WHERE name = 'Comercial';

-- =====================================================
-- CRIAR PRIMEIRO USUÁRIO ADMIN
-- =====================================================
-- Após criar um usuário via autenticação, execute:
--
-- 1. Encontre o UUID do usuário:
-- SELECT id, email FROM auth.users;
--
-- 2. Adicione a role admin:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('UUID_DO_USUARIO_AQUI', 'admin');
--
-- =====================================================
