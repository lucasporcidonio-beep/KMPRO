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
- 🌙 **Modo Escuro / Claro:** Alternância suave com persistência local.

---

## 🛠️ Configuração do Firebase para Produção

Para ativar o sistema multi-usuário com segurança no Firebase Console:

### 1. Ativar Autenticação (Authentication)
1. Acesse o [Firebase Console](https://console.firebase.google.com/) no seu projeto.
2. No menu lateral, clique em **Authentication** -> **Começar (Get started)**.
3. Na aba **Sign-in method**, ative:
   - **Google** (adicione o e-mail de suporte).
   - **Email/Senha** (marque como ativado).

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
3. Clique em **Publicar (Publish)**. Agora cada motorista só consegue acessar e modificar suas próprias finanças.

---

## 📦 Como Publicar na Vercel

1. Crie um repositório no seu GitHub chamado `kmpro`.
2. Faça o push dos arquivos desta pasta.
3. Acesse a [Vercel](https://vercel.com/) e importe o repositório `kmpro`.
4. Deploy com 1 clique (como é HTML estático, não precisa de build command).
