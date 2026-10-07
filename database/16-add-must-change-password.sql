-- ============================================================
-- SCRIPT SQL: Adicionar coluna must_change_password para Primeiro Acesso
-- Execute este script no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Atualizar empresas já criadas para não exigir troca se não for primeiro acesso
UPDATE public.users 
SET must_change_password = false 
WHERE must_change_password IS NULL;
