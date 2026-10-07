-- ============================================================
-- SCRIPT SQL: ADICIONAR IMAGEM MOBILE SEPARADA NO CARROSSEL
-- Arquivo: database/22-add-mobile-url-to-carousel.sql
-- Execute este script no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

ALTER TABLE public.carousel_images 
ADD COLUMN IF NOT EXISTS mobile_url TEXT;

COMMENT ON COLUMN public.carousel_images.mobile_url IS 'URL da imagem otimizada para telas de celulares';
