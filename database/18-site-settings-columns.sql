-- ============================================================
-- SCRIPT SQL: Adicionar Colunas de Texto do Site na Tabela company_settings
-- Arquivo: database/18-site-settings-columns.sql
-- Execute este script no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS footer_description TEXT;
