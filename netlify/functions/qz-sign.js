import crypto from 'crypto';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Metodo nao permitido.' });
  }

  const rawKey = process.env.QZ_PRIVATE_KEY;
  if (!rawKey) {
    return json(500, { error: 'Variavel QZ_PRIVATE_KEY nao configurada no Netlify.' });
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}').data;
  } catch {
    return json(400, { error: 'JSON invalido.' });
  }

  if (typeof data !== 'string' || data.length === 0) {
    return json(400, { error: 'Campo data obrigatorio.' });
  }

  try {
    const pem = rawKey
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\r\n/g, '\n')
      .trim();

    const keyObject = crypto.createPrivateKey({ key: pem, format: 'pem', type: 'pkcs8' });
    const signature = crypto.sign('sha512', Buffer.from(data, 'utf8'), keyObject).toString('base64');
    return json(200, { signature });
  } catch (err) {
    return json(500, { error: `Falha ao assinar requisicao QZ: ${err.message}` });
  }
};
