-- ============================================================
-- SCRIPT SQL: ISOLAR PATROCINADORES POR EMPRESA
-- Arquivo: database/20-fix-sponsor-logos-company-isolation.sql
-- Execute este script no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

-- Garante que patrocinadores antigos sem company_id fiquem associados à empresa que os criou
DO $$
DECLARE
    v_torneio_id UUID;
BEGIN
    SELECT id INTO v_torneio_id 
    FROM public.users 
    WHERE name ILIKE '%Torneio entre Amigos%' OR slug ILIKE '%torneio%' 
    LIMIT 1;

    IF v_torneio_id IS NOT NULL THEN
        UPDATE public.sponsor_logos
        SET company_id = v_torneio_id
        WHERE company_id IS NULL;

        RAISE NOTICE 'Patrocinadores antigos associados ao Torneio entre Amigos!';
    END IF;
END $$;
