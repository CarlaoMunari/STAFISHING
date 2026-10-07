import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

// Criar cliente do Supabase com configurações otimizadas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Desabilitar detecção de session na URL
        flowType: 'pkce', // Usar PKCE flow
    },
    global: {
        headers: {
            'X-Client-Info': 'supabase-js-web',
        },
    },
    db: {
        schema: 'public',
    },
});

// Teste de saúde ao inicializar
console.log('🔄 Supabase client initialized');
console.log('📍 URL:', supabaseUrl);

// Teste assíncrono de conectividade
setTimeout(async () => {
    try {
        console.log('🧪 Testando conectividade...');
        const startTime = Date.now();

        // Teste simples: verificar health endpoint
        const response = await fetch(`${supabaseUrl}/auth/v1/health`);
        const elapsed = Date.now() - startTime;

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Supabase Health OK! (${elapsed}ms)`, data);
        } else {
            console.warn(`⚠️ Supabase Health status: ${response.status}`);
        }
    } catch (error: any) {
        console.error('❌ Erro no teste de conectividade:', error.message);
    }
}, 1000);
