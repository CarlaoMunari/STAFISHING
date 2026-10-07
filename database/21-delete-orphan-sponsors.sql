-- ============================================================
-- SCRIPT SQL: REMOVER PATROCINADORES ÓRFÃOS SEM EMPRESA VINCULADA
-- Arquivo: database/21-delete-orphan-sponsors.sql
-- Execute no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

DELETE FROM public.sponsor_logos WHERE company_id IS NULL;
