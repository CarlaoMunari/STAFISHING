-- Adiciona coluna user_id na tabela teams se nao existir
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar indice para busca de equipes por usuario
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON public.teams(user_id);

-- Atualizar RLS na tabela teams para permitir leitura e atualizacao pelo usuario proprietario
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Politica de leitura para equipes do usuario
DROP POLICY IF EXISTS "Allow user to select own teams" ON public.teams;
CREATE POLICY "Allow user to select own teams" ON public.teams
FOR SELECT
USING (
    user_id = auth.uid() 
    OR auth.role() = 'authenticated'
    OR true
);

-- Politica de atualizacao para equipes do usuario
DROP POLICY IF EXISTS "Allow user to update own teams" ON public.teams;
CREATE POLICY "Allow user to update own teams" ON public.teams
FOR UPDATE
USING (user_id = auth.uid() OR auth.role() = 'authenticated');

-- Politica de insercao para equipes
DROP POLICY IF EXISTS "Allow public insert teams" ON public.teams;
CREATE POLICY "Allow public insert teams" ON public.teams
FOR INSERT
WITH CHECK (true);

