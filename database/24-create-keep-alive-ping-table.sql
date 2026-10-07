-- ============================================
-- SCRIPT 24: Tabela Interna de Keep-Alive (Prevenir Pausa por Inatividade)
-- ============================================

-- 1. Criar tabela de pings do sistema
CREATE TABLE IF NOT EXISTS public.system_pings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ping_time TIMESTAMPTZ DEFAULT now(),
    source TEXT DEFAULT 'keep-alive-cron'
);

-- 2. Configurar RLS (Row Level Security) para acesso p�blico
ALTER TABLE public.system_pings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert system_pings" ON public.system_pings;
CREATE POLICY "Allow public insert system_pings" ON public.system_pings FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select system_pings" ON public.system_pings;
CREATE POLICY "Allow public select system_pings" ON public.system_pings FOR SELECT TO public USING (true);

-- 3. Fun��o para auto-limpeza autom�tica (descarta pings com mais de 30 dias)
CREATE OR REPLACE FUNCTION public.clean_old_pings() 
RETURNS trigger AS $$
BEGIN
    DELETE FROM public.system_pings 
    WHERE ping_time < now() - INTERVAL '30 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clean_old_pings ON public.system_pings;
CREATE TRIGGER trigger_clean_old_pings
    AFTER INSERT ON public.system_pings
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.clean_old_pings();
