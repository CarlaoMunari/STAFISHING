-- ============================================================
-- SCRIPT SQL: EXCLUSÃO TOTAL EM CASCATA DE EMPRESAS (TODAS AS TABELAS)
-- Arquivo: database/17-cascade-delete-company.sql
-- Execute no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

-- 1. ADICIONAR ON DELETE CASCADE EM TODAS AS CHAVES ESTRANGEIRAS QUE APONTAM PARA USERS E ETAPAS

-- Circuits -> Users
ALTER TABLE public.circuits 
DROP CONSTRAINT IF EXISTS circuits_company_id_fkey;
ALTER TABLE public.circuits 
ADD CONSTRAINT circuits_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Stages -> Circuits
ALTER TABLE public.stages 
DROP CONSTRAINT IF EXISTS stages_circuit_id_fkey;
ALTER TABLE public.stages 
ADD CONSTRAINT stages_circuit_id_fkey 
FOREIGN KEY (circuit_id) REFERENCES public.circuits(id) ON DELETE CASCADE;

-- Stages -> Users
ALTER TABLE public.stages 
DROP CONSTRAINT IF EXISTS stages_company_id_fkey;
ALTER TABLE public.stages 
ADD CONSTRAINT stages_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Teams -> Stages
ALTER TABLE public.teams 
DROP CONSTRAINT IF EXISTS teams_stage_id_fkey;
ALTER TABLE public.teams 
ADD CONSTRAINT teams_stage_id_fkey 
FOREIGN KEY (stage_id) REFERENCES public.stages(id) ON DELETE CASCADE;

-- Teams -> Users
ALTER TABLE public.teams 
DROP CONSTRAINT IF EXISTS teams_company_id_fkey;
ALTER TABLE public.teams 
ADD CONSTRAINT teams_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Results -> Stages
ALTER TABLE public.results 
DROP CONSTRAINT IF EXISTS results_stage_id_fkey;
ALTER TABLE public.results 
ADD CONSTRAINT results_stage_id_fkey 
FOREIGN KEY (stage_id) REFERENCES public.stages(id) ON DELETE CASCADE;

-- Results -> Teams
ALTER TABLE public.results 
DROP CONSTRAINT IF EXISTS results_team_id_fkey;
ALTER TABLE public.results 
ADD CONSTRAINT results_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- Results -> Users
ALTER TABLE public.results 
DROP CONSTRAINT IF EXISTS results_company_id_fkey;
ALTER TABLE public.results 
ADD CONSTRAINT results_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Event Logos -> Users
ALTER TABLE public.event_logos 
DROP CONSTRAINT IF EXISTS event_logos_company_id_fkey;
ALTER TABLE public.event_logos 
ADD CONSTRAINT event_logos_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Sponsor Logos -> Users
ALTER TABLE public.sponsor_logos 
DROP CONSTRAINT IF EXISTS sponsor_logos_company_id_fkey;
ALTER TABLE public.sponsor_logos 
ADD CONSTRAINT sponsor_logos_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Carousel Images -> Users
ALTER TABLE public.carousel_images 
DROP CONSTRAINT IF EXISTS carousel_images_company_id_fkey;
ALTER TABLE public.carousel_images 
ADD CONSTRAINT carousel_images_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Company Settings -> Users
IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_settings') THEN
    ALTER TABLE public.company_settings 
    DROP CONSTRAINT IF EXISTS company_settings_company_id_fkey;
    ALTER TABLE public.company_settings 
    ADD CONSTRAINT company_settings_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;
END IF;

-- GPS Access Keys -> Users
IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gps_access_keys') THEN
    ALTER TABLE public.gps_access_keys 
    DROP CONSTRAINT IF EXISTS gps_access_keys_company_id_fkey;
    ALTER TABLE public.gps_access_keys 
    ADD CONSTRAINT gps_access_keys_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;
END IF;

-- GPS Locations -> Users
IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gps_locations') THEN
    ALTER TABLE public.gps_locations 
    DROP CONSTRAINT IF EXISTS gps_locations_company_id_fkey;
    ALTER TABLE public.gps_locations 
    ADD CONSTRAINT gps_locations_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.users(id) ON DELETE CASCADE;
END IF;

-- 2. FUNÇÃO STORED PROCEDURE DE EXCLUSÃO
CREATE OR REPLACE FUNCTION public.delete_company_cascade(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_company_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Empresa nao encontrada em public.users'
        );
    END IF;

    -- 1. Registros de GPS
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gps_locations') THEN
        DELETE FROM public.gps_locations 
        WHERE company_id = p_company_id
           OR stage_id IN (
                SELECT s.id FROM public.stages s
                LEFT JOIN public.circuits c ON s.circuit_id = c.id
                WHERE c.company_id = p_company_id OR s.company_id = p_company_id
           );
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gps_access_keys') THEN
        DELETE FROM public.gps_access_keys 
        WHERE company_id = p_company_id
           OR stage_id IN (
                SELECT s.id FROM public.stages s
                LEFT JOIN public.circuits c ON s.circuit_id = c.id
                WHERE c.company_id = p_company_id OR s.company_id = p_company_id
           );
    END IF;

    -- 2. Pontuações e resultados
    DELETE FROM public.results 
    WHERE company_id = p_company_id
       OR stage_id IN (
            SELECT s.id FROM public.stages s
            LEFT JOIN public.circuits c ON s.circuit_id = c.id
            WHERE c.company_id = p_company_id OR s.company_id = p_company_id
       );

    -- 3. Pagamentos
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_registrations') THEN
        DELETE FROM public.payment_registrations 
        WHERE company_id = p_company_id
           OR stage_id IN (
                SELECT s.id FROM public.stages s
                LEFT JOIN public.circuits c ON s.circuit_id = c.id
                WHERE c.company_id = p_company_id OR s.company_id = p_company_id
           );
    END IF;

    -- 4. Imagens, Logos e Galerias
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stage_images') THEN
        DELETE FROM public.stage_images 
        WHERE stage_id IN (
            SELECT s.id FROM public.stages s
            LEFT JOIN public.circuits c ON s.circuit_id = c.id
            WHERE c.company_id = p_company_id OR s.company_id = p_company_id
        );
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'champion_gallery') THEN
        DELETE FROM public.champion_gallery 
        WHERE stage_id IN (
            SELECT s.id FROM public.stages s
            LEFT JOIN public.circuits c ON s.circuit_id = c.id
            WHERE c.company_id = p_company_id OR s.company_id = p_company_id
        );
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sponsor_logos') THEN
        DELETE FROM public.sponsor_logos WHERE company_id = p_company_id;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_logos') THEN
        DELETE FROM public.event_logos WHERE company_id = p_company_id;
    END IF;

    DELETE FROM public.carousel_images WHERE company_id = p_company_id;

    -- 5. Configurações da empresa
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_settings') THEN
        DELETE FROM public.company_settings WHERE company_id = p_company_id;
    END IF;

    -- 6. Equipes, Etapas e Circuitos
    DELETE FROM public.teams 
    WHERE company_id = p_company_id
       OR stage_id IN (
            SELECT s.id FROM public.stages s
            LEFT JOIN public.circuits c ON s.circuit_id = c.id
            WHERE c.company_id = p_company_id OR s.company_id = p_company_id
       );

    DELETE FROM public.stages 
    WHERE company_id = p_company_id
       OR circuit_id IN (
            SELECT id FROM public.circuits WHERE company_id = p_company_id
       );

    DELETE FROM public.circuits WHERE company_id = p_company_id;

    -- 7. Usuário na tabela public.users
    DELETE FROM public.users WHERE id = p_company_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Empresa e todos os dados vinculados foram excluidos com sucesso'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.delete_company_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_company_cascade(UUID) TO service_role;
