-- ============================================
-- SCRIPT 23: Corrigir RLS para Inscri��es e Upload de Comprovante PIX
-- ============================================
-- IMPORTANTE: No SQL Editor do Supabase, certifique-se de N�O deixar nenhum texto selecionado/grifado ao clicar em RUN.

-- 1. Habilitar RLS na tabela payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Permitir inser��o p�blica de pagamentos ao se inscrever
DROP POLICY IF EXISTS "Allow public insert payments" ON public.payments;
CREATE POLICY "Allow public insert payments" ON public.payments FOR INSERT TO public WITH CHECK (true);

-- Permitir visualiza��o dos pagamentos
DROP POLICY IF EXISTS "Companies can view own payments" ON public.payments;
CREATE POLICY "Companies can view own payments" ON public.payments FOR SELECT TO public USING (true);

-- Permitir atualiza��o/gerenciamento de pagamentos
DROP POLICY IF EXISTS "Companies can manage own payments" ON public.payments;
CREATE POLICY "Companies can manage own payments" ON public.payments FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. Bucket 'images' no Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permitir upload de comprovantes no bucket 'images'
DROP POLICY IF EXISTS "Allow public upload to payment-proofs" ON storage.objects;
CREATE POLICY "Allow public upload to payment-proofs" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'images');

-- Permitir leitura de arquivos do bucket 'images'
DROP POLICY IF EXISTS "Allow public read images bucket" ON storage.objects;
CREATE POLICY "Allow public read images bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');
