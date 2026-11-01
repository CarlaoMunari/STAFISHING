# Regras de Desenvolvimento e Sincronização - STA FISHING

Este projeto é desenvolvido simultaneamente em múltiplas máquinas através do GitHub na branch `v2.0`.

## 🔄 Protocolo de Sincronização Obrigatório (Multi-Máquina)

Para garantir que o trabalho feito em uma máquina nunca seja sobrescrito pela outra:

### 1. Antes de Iniciar Qualquer Tarefa (Pre-Task)
Sempre execute o comando de sincronização antes de analisar arquivos ou modificar código:
```bash
git fetch origin
git pull origin v2.0
```
- Se houver alterações vindas da outra máquina, garanta que elas estejam integradas antes de continuar.
- Certifique-se de que a branch atual é a `v2.0`.

### 2. Ao Concluir Qualquer Tarefa (Post-Task)
Sempre valide e envie as alterações para o GitHub para que a outra máquina possa recebê-las:
1. Valide a integridade do projeto:
   ```bash
   npm run build
   ```
2. Faça o commit com mensagem clara e envie para a branch `v2.0`:
   ```bash
   git add -A
   git commit -m "feat/fix: descricao detalhada da melhoria"
   git push origin v2.0
   ```

### 3. Padrões do Projeto
- **Branch Ativa:** `v2.0`
- **Porta do Servidor:** `3000` (configurada no `vite.config.ts`)
- **Base URL:** `/STAFISHING/`
- **Tecnologias:** React 18, Vite, TypeScript, Tailwind CSS, Supabase, Capacitor.
- Otimização: manter rotas sob demanda via `React.lazy` para preservar a alta performance móvel obtida na v2.0.
