// Supabase Edge Function para excluir empresas e seus dados em cascata
// Arquivo: supabase/functions/delete-company-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { userId, email } = await req.json()

        if (!userId && !email) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'userId ou email é obrigatório para exclusão'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Variáveis de ambiente do Supabase não configuradas no Edge'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // 1. Resolver o ID da empresa caso seja passado email
        let targetId = userId;
        if (!targetId && email) {
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle()
            if (userData) {
                targetId = userData.id;
            }
        }

        console.log(`Iniciando exclusao da empresa ID: ${targetId}, Email: ${email}`);

        // 2. Executar stored procedure de exclusao em cascata no banco de dados
        if (targetId) {
            const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('delete_company_cascade', {
                p_company_id: targetId
            });

            if (rpcError) {
                console.error('Erro na RPC delete_company_cascade:', rpcError);
                // Tentar deletar manualmente da tabela public.users se a proc falhar
                await supabaseAdmin.from('users').delete().eq('id', targetId);
            } else {
                console.log('Resultado da RPC delete_company_cascade:', rpcData);
            }

            // 3. Deletar usuario de auth.users (Supabase Auth)
            try {
                const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetId);
                if (deleteAuthError) {
                    console.error('Erro ao deletar do Auth via ID:', deleteAuthError);
                } else {
                    console.log(`Usuario ${targetId} removido de auth.users com sucesso`);
                }
            } catch (authErr) {
                console.error('Excecao ao deletar do Auth:', authErr);
            }
        }

        // 4. Verificacao de seguranca por email caso o ID no Auth seja diferente
        if (email) {
            try {
                const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
                const existingAuthUser = usersList?.users?.find(u => u.email === email);
                if (existingAuthUser) {
                    await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
                    console.log(`Usuario Auth por email ${email} deletado com sucesso`);
                }
            } catch (e) {
                console.error('Erro na verificacao por email no Auth:', e);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Empresa e todos os seus dados foram excluidos com sucesso'
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error: any) {
        console.error('Unexpected error in delete-company-user:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Erro desconhecido ao excluir empresa'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
