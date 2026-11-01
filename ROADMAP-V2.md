# 🚀 STA FISHING - Versão 2.0 (v2.0)

Documento oficial de planejamento, arquitetura e evolução da **Versão 2.0** do sistema STA FISHING gerenciado via GitHub.

---

## 🎯 Objetivos da Versão 2.0

1. **Alta Performance Mobile (Lake-Ready):**
   - Carregamento instantâneo em conexões de baixa velocidade (3G/4G comuns em represas e rios).
   - Divisão de código sob demanda (*Code Splitting*) com `React.lazy` e `Suspense`.
   - Redução do pacote principal de **2.2 MB** para apenas **~94 KB** (~95% de economia).

2. **Gerenciamento e Fluxo no GitHub:**
   - Criação da branch oficial `v2.0` no repositório GitHub.
   - Automação de CI (Continuous Integration) via GitHub Actions para validação contínua de integridade do build.
   - Script direto de 1 clique (`ATUALIZAR_GITHUB_V2.bat`) para facilitar o envio de novidades para a nuvem.

3. **PWA e Modo Pescador:**
   - Resiliência na transmissão de telemetria GPS (`useGPSTracking`).
   - Melhorias na experiência visual do painel do pescador e do capitão da embarcação.

4. **Multiempresa e Isolamento de Dados:**
   - Suporte aprimorado para múltiplos circuitos e empresas com regras personalizadas de medição e pontuação.

---

## 📦 Otimizações de Código Implementadas na v2.0

| Recurso | Versão 1.0 | Versão 2.0 | Ganho |
| :--- | :---: | :---: | :---: |
| **Tamanho do Bundle Principal** | 2.233 KB (2.2 MB) | **94 KB** | **-95.7%** |
| **Tempo de Build** | ~35s | **~15s** | **-57%** |
| **Estratégia de Carregamento** | Monolítico (tudo no 1º load) | Sob demanda (*Code Splitting*) | Imediato para visitantes |
| **Integração GitHub Actions** | Apenas deploy estático | Deploy + CI automatizado | Zero quebras em produção |
| **Scripts de Publicação** | `ATUALIZAR_GITHUB_VERCEL.bat` | Adicionado `ATUALIZAR_GITHUB_V2.bat` | Prático e direto |

---

## 🌿 Estrutura de Branches no GitHub

- `main`: Versão estável em produção.
- `v2.0`: Branch de evolução contínua da nova versão 2.0.

### Como Enviar Atualizações para a v2.0:
1. Pelo terminal:
   ```bash
   git add -A
   git commit -m "feat: descricao da mudanca"
   git push origin v2.0
   ```
2. Ou simplesmente dando um duplo-clique no arquivo:
   `ATUALIZAR_GITHUB_V2.bat`

---

## 🗺️ Próximos Passos Recomendados para a v2.0
- [ ] Modo offline com IndexedDB para gravação de pontos GPS mesmo sem internet na água.
- [ ] Notificações Push nativas via PWA para avisos da comissão técnica e alertas de tempo de prova.
- [ ] Exportação aprimorada de relatórios e súmulas com QR Code de autenticação.
