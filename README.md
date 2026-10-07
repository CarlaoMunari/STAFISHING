# STA FISHING

Sistema completo de gestão de circuitos de pesca esportiva com área pública e painel administrativo.

## 🎣 Funcionalidades

### Área Pública
- **Landing Page** com carrossel de imagens gerenciável
- **Listagem de Circuitos** ativos e suas etapas
- **Inscrição de Equipes** com validação de 3-4 integrantes
- **Checkout** com opções de pagamento (PIX e Cartão - mock)

### Painel Administrativo
- **Dashboard** com estatísticas
- **Gerenciamento de Carrossel** (upload de imagens)
- **Gerenciamento de Circuitos** (CRUD completo)
- **Gerenciamento de Etapas** (CRUD vinculado a circuitos)
- **Visualização de Inscrições**
- **Lançamento de Medidas** com regra crítica de pontuação (divisão por 6)
- **Rankings** por etapa e circuito geral

## 🚀 Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **React Router** (navegação)
- **Firebase** (autenticação e banco de dados)
- **Lucide React** (ícones)

## 📋 Pré-requisitos

- Node.js 16+ e npm
- Conta Firebase (para configuração do backend)

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Firebase

Edite o arquivo `src/lib/firebase.ts` e substitua as credenciais de exemplo pelas suas:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

### 3. Configurar Firestore

No console do Firebase, crie as seguintes coleções:

- `users` - Usuários do sistema
- `carousel` - Imagens do carrossel
- `circuits` - Circuitos de pesca
- `stages` - Etapas dos circuitos
- `teams` - Equipes inscritas
- `results` - Resultados das equipes

### 4. Criar Usuário Admin

No Firebase Authentication, crie um usuário e adicione um documento na coleção `users`:

```json
{
  "email": "admin@exemplo.com",
  "name": "Administrador",
  "role": "super_admin",
  "createdAt": "timestamp"
}
```

## 🏃 Executar o Projeto

### Modo Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Build de Produção

```bash
npm run build
npm run preview
```

## 👥 Níveis de Acesso

- **Super Admin**: Acesso total a todas as funcionalidades
- **Judge/Staff**: Acesso apenas ao lançamento de medidas e rankings
- **Captain**: Acesso à área pública e inscrição de equipes

## 🎯 Regra Crítica de Pontuação

**IMPORTANTE**: A pontuação é calculada dividindo a soma das medidas **SEMPRE por 6** (cota máxima), independentemente de quantos peixes foram capturados.

**Exemplos**:
- 2 peixes (30cm + 40cm) = (30 + 40 + 0 + 0 + 0 + 0) / 6 = **11.67 pontos**
- 6 peixes (30 + 35 + 40 + 32 + 38 + 36) = 211 / 6 = **35.17 pontos**

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop
- Tablet
- Mobile

## 🎨 Paleta de Cores

- **Ocean** (Azul): Tema principal relacionado à água
- **Fishing** (Verde): Tema secundário relacionado à natureza
- **Grays**: Tons neutros para UI

## 📄 Licença

Este é um projeto de demonstração.
