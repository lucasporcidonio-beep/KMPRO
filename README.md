# 🚗 KMPRO - Gestão Financeira para Motoristas de Aplicativo

**KMPRO** é um Micro-SaaS projetado especificamente para motoristas de aplicativo (Uber, 99, InDrive e particulares). O sistema calcula o lucro líquido real, custo por quilômetro e rentabilidade por hora, considerando o consumo do veículo e o tempo no horímetro.

---

## 🚀 Funcionalidades Principais

- 🔐 **Autenticação Multi-usuário:** Login com Google em 1 clique e cadastro com E-mail e Senha.
- 🛡️ **Isolamento de Dados Seguro:** Cada motorista tem seus próprios dados isolados no banco de dados (`users/{userId}/...`).
- ⏱️ **Horímetro Integrado (HH:MM):** Lançamento direto das horas do computador de bordo ou por horário de início/fim.
- 📊 **Cálculo Real de Rentabilidade:**
  - Consumo real (Km/L) e custo exato do combustível por dia.
  - Indicador de R$/hora e R$/KM.
  - Avaliação de qualidade do dia:
    - **Dias curtos (≤ 4h):** Verde se R$/hora ≥ R$ 25 **OU** R$/km ≥ R$ 1,20.
    - **Dias longos (> 4h):** Verde se lucro líquido ≥ média do mês.
- 📅 **Calendário Interativo:** Visão mensal colorida com modal detalhado de cada dia trabalhado ao clicar.
- 📈 **Gráfico de Faturamento Diário:** Gráfico interativo com barras coloridas e clique direto no dia.
- 🎯 **Meta Mensal Inteligente:** Acompanhamento com barra de progresso dinâmica e valor restante.
- 📱 **Instalável no Celular (PWA):** Funciona como aplicativo nativo e offline via Service Worker.
- 📥 **Exportação para Excel:** Download dos dados do mês com um clique para declaração de imposto de renda ou controle pessoal.
- 💳 **Checkout InfinitePay Integrado:** Cobrança automatizada via Pix e Cartão de Crédito para planos Mensal (R$ 9,90) e Anual (R$ 89,00).
- ⚡ **Webhook Serverless:** Ativação automática e em tempo real do status PRO do motorista após a confirmação do pagamento.
- 🌙 **Modo Escuro / Claro:** Alternância suave com persistência local.

---

## 🛠️ Configuração do Firebase para Produção

Projeto oficial: `kmpro-1627b`

### 1. Ativar Autenticação (Authentication)
1. Acesse o [Firebase Console](https://console.firebase.google.com/) no projeto `kmpro-1627b`.
2. No menu lateral, clique em **Authentication** -> **Começar (Get started)**.
3. Na aba **Sign-in method**, ative:
   - **Google** (adicione o e-mail de suporte).
   - **Email/Senha** (marque como ativado).
4. Na aba **Settings** -> **Authorized domains**, adicione o domínio gerado na Vercel (ex: `kmpro.vercel.app`).

### 2. Configurar as Regras de Segurança do Firestore
No menu lateral do Firebase Console:
1. Vá em **Firestore Database** -> aba **Regras (Rules)**.
2. Substitua o conteúdo pelas regras de `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. Clique em **Publicar (Publish)**.

---

## 💳 Configuração de Pagamento (InfinitePay + Vercel)

O KMPRO já vem com rotas serverless na pasta `/api`:
- `/api/create-checkout.js`: Gera o link de pagamento na InfinitePay apontando para a InfiniteTag `$lucasporcidonio`.
- `/api/webhook-infinitepay.js`: Recebe a confirmação de pagamento da InfinitePay e atualiza o usuário para `isPro: true` no Firestore.

### Variáveis de Ambiente na Vercel (Project Settings > Environment Variables):

| Variável | Valor Padrão / Exemplo | Descrição |
|---|---|---|
| `INFINITEPAY_TAG` | `lucasporcidonio` | Sua InfiniteTag (sem o `$`) |
| `FIREBASE_SERVICE_ACCOUNT` | Conteúdo do JSON da chave privada | Chave privada para o webhook atualizar o Firestore |

> **Como obter o FIREBASE_SERVICE_ACCOUNT:**
> 1. No Firebase Console, vá em **⚙️ Configurações do projeto** > **Contas de serviço (Service accounts)**.
> 2. Clique em **Gerar nova chave privada**.
> 3. Abra o arquivo `.json` baixado, copie todo o conteúdo e cole na variável de ambiente na Vercel.

---

## 📦 Como Publicar na Vercel

1. Acesse a [Vercel](https://vercel.com/) e importe o repositório `lucasporcidonio-beep/KMPRO`.
2. Em **Environment Variables**, adicione as variáveis acima.
3. Clique em **Deploy**.
