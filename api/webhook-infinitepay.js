import admin from 'firebase-admin';

// Inicializa o Firebase Admin garantindo instância única
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  let serviceAccount = null;

  if (serviceAccountEnv) {
    try {
      // Suporta tanto JSON puro quanto Base64
      const decoded = serviceAccountEnv.startsWith('{')
        ? serviceAccountEnv
        : Buffer.from(serviceAccountEnv, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decoded);
    } catch (err) {
      console.error('Falha ao decodificar FIREBASE_SERVICE_ACCOUNT:', err);
    }
  }

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  // Fallback para projeto local ou Google Application Default Credentials
  return admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'kmpro-1627b'
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    const payload = req.body || {};
    console.log('📬 Webhook InfinitePay recebido:', JSON.stringify(payload));

    const {
      invoice_slug,
      amount,
      paid_amount,
      installments,
      capture_method,
      transaction_nsu,
      order_nsu,
      receipt_url
    } = payload;

    if (!order_nsu) {
      console.warn('⚠️ Webhook recebido sem order_nsu');
      return res.status(400).json({ success: false, message: 'order_nsu não informado.' });
    }

    // O order_nsu segue a convenção: userId__plano__timestamp
    const parts = order_nsu.split('__');
    const userId = parts[0];
    const plano = parts[1] || 'mensal';

    if (!userId) {
      console.warn('⚠️ Não foi possível extrair o userId do order_nsu:', order_nsu);
      return res.status(400).json({ success: false, message: 'userId ausente no order_nsu.' });
    }

    const app = getFirebaseAdmin();
    const db = app.firestore();

    const isAnual = plano === 'anual';
    const diasValidade = isAnual ? 365 : 30;
    const agora = new Date();
    const dataExpiracao = new Date(agora.getTime() + diasValidade * 24 * 60 * 60 * 1000);

    // 1. Atualiza os dados do motorista para PRO ativo
    const userRef = db.collection('users').doc(userId);
    await userRef.set(
      {
        isPro: true,
        plano: plano,
        statusAssinatura: 'ativa',
        dataAtivacao: admin.firestore.FieldValue.serverTimestamp(),
        dataExpiracao: dataExpiracao.toISOString(),
        ultimaTransacao: {
          invoice_slug: invoice_slug || '',
          transaction_nsu: transaction_nsu || '',
          order_nsu: order_nsu,
          paid_amount: paid_amount || amount || 0,
          capture_method: capture_method || 'desconhecido',
          installments: installments || 1,
          receipt_url: receipt_url || '',
          atualizadoEm: agora.toISOString()
        }
      },
      { merge: true }
    );

    // 2. Registra o histórico em users/{userId}/pagamentos/{id}
    const paymentDocId = transaction_nsu || invoice_slug || String(Date.now());
    await userRef.collection('pagamentos').doc(paymentDocId).set(
      {
        invoice_slug: invoice_slug || '',
        transaction_nsu: transaction_nsu || '',
        order_nsu: order_nsu,
        amount: amount || 0,
        paid_amount: paid_amount || 0,
        capture_method: capture_method || '',
        installments: installments || 1,
        receipt_url: receipt_url || '',
        plano: plano,
        processadoEm: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    console.log(`🎉 Sucesso: Usuário ${userId} ativado como KMPRO ${plano.toUpperCase()} até ${dataExpiracao.toLocaleDateString('pt-BR')}!`);

    // Resposta esperada pela InfinitePay
    return res.status(200).json({ success: true, message: null });
  } catch (error) {
    console.error('❌ Erro no processamento do webhook InfinitePay:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
