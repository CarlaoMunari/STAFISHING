import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/STAFISHING/',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0', // Permite acesso de IPs externos (não apenas localhost)
        port: 3000, // Porta interna (RB redireciona 5544 externa -> 3000 interna)
        strictPort: true, // Falha se a porta já estiver em uso
    }
})
