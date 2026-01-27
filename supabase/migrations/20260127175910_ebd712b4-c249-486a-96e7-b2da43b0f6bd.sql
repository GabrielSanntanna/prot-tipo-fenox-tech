-- Corrigir email duplicado antes de aplicar constraint UNIQUE
UPDATE public.employees 
SET email = 'victor.sales@fenox.temp.com'
WHERE id = '9a22d25b-7e0e-4bbc-8969-f3e4d3f2f3e0';