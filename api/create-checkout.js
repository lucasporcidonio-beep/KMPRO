export default async function handler(req, res) {
  // Configuração de CORS se necessário
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { plano, userId, userEmail, userName } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'Usuário não autenticado (userId obrigatório).' });
    }

    const tagRaw = process.env.INFINITEPAY_TAG || 'lucasporcidonio';
    const handle = tagRaw.replace('$', '').trim();

    const isAnual = plano === 'anual';
    const priceInCents = isAnual ? 8900 : 990;
    const planDesc = isAnual
      ? 'KMPRO Premium - Plano Anual (Acesso 12 Meses)'
      : 'KMPRO Premium - Plano Mensal (Acesso 30 Dias)';

    // Determina o host da Vercel ou domínio de produção
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'kmpro.vercel.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${proto}://${host}`;

    // order_nsu carrega o userId e o plano escolhido
    const orderNsu = `${userId}__${isAnual ? 'anual' : 'mensal'}__${Date.now()}`;

    const payload = {
      handle: handle,
      redirect_url: `${baseUrl}/?payment=success&order=${orderNsu}`,
      webhook_url: `${baseUrl}/api/webhook-infinitepay`,
      order_nsu: orderNsu,
      customer: {
        name: userName || 'Motorista KMPRO',
        email: userEmail || 'contato@kmpro.app'
      },
      items: [
        {
          quantity: 1,
          price: priceInCents,
          description: planDesc
        }
      ]
    };

    const response = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      console.error('Erro retornado pela API da InfinitePay:', data);
      return res.status(response.status || 500).json({
        error: 'Não foi possível gerar o link de pagamento na InfinitePay.',
        details: data
      });
    }

    return res.status(200).json({
      url: data.url,
      orderNsu: orderNsu
    });
  } catch (error) {
    console.error('Erro interno na criação do checkout:', error);
    return res.status(500).json({
      error: 'Erro no servidor ao se comunicar com a InfinitePay.',
      message: error.message
    });
  }
}
