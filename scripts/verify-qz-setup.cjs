/**
 * Script de diagnóstico para verificar se o certificado e a chave privada QZ
 * são um par válido (isto é, a chave privada corresponde ao certificado).
 *
 * Uso: node scripts/verify-qz-setup.cjs
 *
 * Opcional: se a QZ_PRIVATE_KEY estiver em uma única linha (Netlify),
 * passe como argumento:
 *   node scripts/verify-qz-setup.cjs "-----BEGIN PRIVATE KEY-----\nMII..."
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadPem(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim();
}

function normalizePem(key) {
  let pem = key.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\r\n/g, '\n').trim();
  if (pem.includes('\n') && pem.startsWith('-----BEGIN')) return pem;

  const match = pem.match(/^-----BEGIN (RSA )?PRIVATE KEY-----/);
  if (!match) return pem;

  const body = pem
    .replace(/^-----BEGIN (RSA )?PRIVATE KEY-----[\s\n]*/, '')
    .replace(/[\s\n]*-----END (RSA )?PRIVATE KEY-----.*$/, '')
    .replace(/\s+/g, '');

  return [
    '-----BEGIN PRIVATE KEY-----',
    body.match(/.{1,64}/g).join('\n'),
    '-----END PRIVATE KEY-----',
  ].join('\n');
}

function extractCertInfo(certPem) {
  let cert;
  try {
    cert = new crypto.X509Certificate(certPem);
  } catch {
    return { subject: '(indisponivel)', issuer: '(indisponivel)', validFrom: '(indisponivel)', validTo: '(indisponivel)', serial: '(indisponivel)' };
  }
  return {
    subject: cert.subject,
    issuer: cert.issuer,
    validFrom: cert.validFrom,
    validTo: cert.validTo,
    serial: cert.serialNumber,
  };
}

function checkKeyCertMatch(privateKeyPem, certPem) {
  const testData = 'QZ-Tray-Verification-' + Date.now();
  const signer = crypto.createSign('RSA-SHA512');
  signer.update(testData, 'utf8');
  signer.end();
  const signature = signer.sign(privateKeyPem, 'base64');

  let cert;
  try {
    cert = new crypto.X509Certificate(certPem);
  } catch {
    return { match: false, error: 'Nao foi possivel ler o certificado (Node.js X509Certificate indisponivel).' };
  }

  const verifier = crypto.createVerify('RSA-SHA512');
  verifier.update(testData, 'utf8');
  verifier.end();
  const ok = verifier.verify(cert.publicKey, signature, 'base64');
  return { match: ok };
}

function main() {
  const projectRoot = path.join(__dirname, '..');

  // Caminhos relativos ao projeto
  const certPath = path.join(projectRoot, 'public', 'qz', 'digital-certificate.txt');
  const keyPath = path.join(projectRoot, 'public', 'qz', 'private-key.pem');

  // 1. Carregar certificado
  if (!fs.existsSync(certPath)) {
    console.error('ERRO: certificado nao encontrado em:', certPath);
    console.error('Execute primeiro: node scripts/generate-qz-cert.cjs');
    process.exit(1);
  }
  const certPem = loadPem(certPath);

  // 2. Carregar chave privada (local ou via argumento)
  let privateKeyPem;
  const argKey = process.argv[2];

  if (argKey) {
    console.log('[INFO] Usando chave privada fornecida via argumento (formato Netlify).');
    privateKeyPem = normalizePem(argKey);
  } else if (fs.existsSync(keyPath)) {
    console.log('[INFO] Usando chave privada de public/qz/private-key.pem');
    privateKeyPem = loadPem(keyPath);
  } else {
    console.error('ERRO: private-key.pem nao encontrado em:', keyPath);
    console.error('Forneca a chave como argumento ou execute generate-qz-cert.cjs');
    process.exit(1);
  }

  // 3. Validar o PEM da chave
  try {
    crypto.createPrivateKey(privateKeyPem);
    console.log('[OK] Chave privada: formato PEM valido.');
  } catch (e) {
    console.error('ERRO: Chave privada invalida:', e.message);
    process.exit(1);
  }

  // 4. Validar o PEM do certificado
  let certInfo;
  try {
    certInfo = extractCertInfo(certPem);
    console.log('[OK] Certificado: formato PEM valido.');
    console.log('');
    console.log('=== INFORMACOES DO CERTIFICADO ===');
    console.log('  Subject:     ', certInfo.subject);
    console.log('  Emissor:     ', certInfo.issuer);
    console.log('  Valido de:   ', certInfo.validFrom);
    console.log('  Valido ate:  ', certInfo.validTo);
    console.log('  Serial:      ', certInfo.serial);

    const now = new Date();
    const validFrom = new Date(certInfo.validFrom);
    const validTo = new Date(certInfo.validTo);
    if (now < validFrom) {
      console.log('  [AVISO] Certificado ainda nao esta valido!');
    } else if (now > validTo) {
      console.log('  [ERRO] Certificado EXPIRADO! Regenere com: node scripts/generate-qz-cert.cjs');
    } else {
      console.log('  [OK] Certificado dentro do periodo de validade.');
    }
  } catch (e) {
    console.error('ERRO: Certificado invalido:', e.message);
    process.exit(1);
  }

  // 5. Verificar se chave privada corresponde ao certificado (teste sign + verify)
  console.log('');
  console.log('=== VERIFICACAO CHAVE PRIVADA vs CERTIFICADO ===');
  try {
    const result = checkKeyCertMatch(privateKeyPem, certPem);
    if (result.match) {
      console.log('[OK] A chave privada CORRESPONDE ao certificado.');
      console.log('');
      console.log('  Next step:');
      console.log('  - Development: importar digital-certificate.txt no QZ Tray Site Manager');
      console.log('  - Producao:    configurar QZ_PRIVATE_KEY no Netlify (veja abaixo)');
    } else {
      console.log('[ERRO] A chave privada NAO corresponde ao certificado!');
      console.log('');
      console.log('Causa: o private-key.pem foi regenerado sem atualizar o digital-certificate.txt,');
      console.log('ou vice-versa.');
      console.log('');
      console.log('Solucao:');
      console.log('  node scripts/generate-qz-cert.cjs');
      console.log('  Depois reimporte digital-certificate.txt no QZ Tray Site Manager.');
      process.exit(1);
    }
  } catch (e) {
    console.error('ERRO ao verificar par chave/certificado:', e.message);
    process.exit(1);
  }

  // 6. Se veio como argumento, gerar string para colar no Netlify
  if (process.argv[2]) {
    console.log('');
    console.log('=== FORMATO NETLIFY (single-line com \\n) ===');
    console.log('A chave fornecida ja esta no formato correto para o Netlify.');
  } else if (fs.existsSync(keyPath)) {
    console.log('');
    console.log('=== PARA CONFIGURAR NO NETLIFY ===');
    console.log('Copie o comando abaixo e execute no terminal para gerar a string');
    console.log('de linha unica para colar na env var QZ_PRIVATE_KEY:');
    console.log('');
    const singleLine = loadPem(keyPath)
      .split('\n')
      .map((l) => l.trim())
      .join('\\n');
    console.log(`QZ_PRIVATE_KEY=${singleLine}`);
    console.log('');
    console.log('Ou copie manualmente o valor acima (tudo em uma unica linha)');
    console.log('e cole no campo "Value" da env var no Netlify.');
  }
}

main();
