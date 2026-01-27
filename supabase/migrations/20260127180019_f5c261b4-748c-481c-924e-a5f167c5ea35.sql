-- Corrigir telefones inválidos (completar para 11 dígitos)
UPDATE public.employees 
SET phone = LPAD(phone, 11, '0')
WHERE phone IS NOT NULL AND LENGTH(phone) < 11;

-- Remover telefones que ainda não são numéricos ou têm tamanho errado
UPDATE public.employees 
SET phone = NULL
WHERE phone IS NOT NULL AND phone !~ '^\d{11}$';