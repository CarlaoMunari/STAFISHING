-- ============================================================
-- SCRIPT SQL: Criar / Redefinir Login da Clínica do Pescador
-- Execute este script no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'clinicapescador@pescaesportiva.com.br';
    v_password TEXT := 'Pesca@2026';
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
            '{"name":"Clínica do Pescador","role":"company"}',
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
        RAISE NOTICE 'Usuário criado em auth.users com sucesso!';
    ELSE
        UPDATE auth.users
        SET 
            encrypted_password = crypt(v_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_user_id;
        RAISE NOTICE 'Senha do usuário atualizada em auth.users!';
    END IF;

    -- Sincronizar na tabela public.users
    INSERT INTO public.users (id, email, name, role, slug, updated_at)
    VALUES (
        v_user_id,
        v_email,
        'Clínica do Pescador',
        'company',
        'clinicapescador',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        slug = EXCLUDED.slug,
        updated_at = NOW();

    RAISE NOTICE 'Usuário sincronizado na tabela public.users!';
END $$;
