-- ============================================================
-- SCRIPT SQL: ATIVAR E CONFIRMAR USUÁRIOS NO SUPABASE AUTH
-- Arquivo: database/19-fix-user-auth-and-confirm-emails.sql
-- Execute este script no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ATIVAR E REDEFINIR SUPER ADMIN (carlao.basket@gmail.com / Admin@2025)
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'carlao.basket@gmail.com';
    v_password TEXT := 'Admin@2025';
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            v_email,
            crypt(v_password, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Super Admin","role":"super_admin"}',
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    ELSE
        UPDATE auth.users
        SET 
            encrypted_password = crypt(v_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    -- Sincronizar na tabela public.users
    INSERT INTO public.users (id, email, name, role, updated_at)
    VALUES (
        v_user_id,
        v_email,
        'Super Admin',
        'super_admin',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW();
END $$;

-- 2. CONFIRMAR TODOS OS E-MAILS DA TABELA AUTH.USERS
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
