/**
 * Gera certificado + chave PKCS#8 para assinatura QZ Tray (SHA512).
 * Execute: node scripts/generate-qz-cert.cjs
 * Depois: importe public/qz/digital-certificate.txt no QZ Tray (Site Manager).
 *
 * O certificado cobre AMBOS os domínios:
 *   - doacoes-bm.netlify.app (produção)
 *   - localhost (desenvolvimento local)
 */
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const outDir = path.join(__dirname, '..', 'public', 'qz');
fs.mkdirSync(outDir, { recursive: true });

const attrs = [{ name: 'commonName', value: 'doacoes-bm.netlify.app' }];
const opts = {
  keySize: 2048,
  days: 3650,
  algorithm: 'sha256',
  extensions: [
    { name: 'basicConstraints', cA: false },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'doacoes-bm.netlify.app' }, // DNS produção
        { type: 2, value: 'localhost' },                // DNS desenvolvimento
      ],
    },
  ],
};

(async () => {
  const pems = await selfsigned.generate(attrs, opts);

  const certPath = path.join(outDir, 'digital-certificate.txt');
  const keyPath = path.join(outDir, 'private-key.pem');

  fs.writeFileSync(certPath, pems.cert, 'utf8');
  fs.writeFileSync(keyPath, pems.private, 'utf8');

  console.log('');
  console.log('=== Certificado QZ Tray gerado com sucesso! ===');
  console.log('');
  console.log('Arquivos criados:');
  console.log('  Certificado:', certPath);
  console.log('  Chave privada:', keyPath);
  console.log('');
  console.log('Domínios cobertos:');
  console.log('  - doacoes-bm.netlify.app (produção)');
  console.log('  - localhost (desenvolvimento local)');
  console.log('');
  console.log('=== PRÓXIMOS PASSOS ===');
  console.log('');
  console.log('1. Clique com o botão DIREITO no ícone do QZ Tray (bandeja do Windows)');
  console.log('2. Selecione "Site Manager"');
  console.log('3. Se existir um certificado antigo, REMOVA-o primeiro');
  console.log('4. Clique no botão "+" para adicionar novo certificado');
  console.log('5. Copie TODO o conteúdo de digital-certificate.txt e cole na caixa de texto');
  console.log('6. Clique em "Save" / "OK"');
  console.log('');
  console.log('IMPORTANTE: A chave privada (private-key.pem) NÃO precisa ser');
  console.log('importada no QZ Tray. Ela fica APENAS no projeto e é usada pelo');
  console.log('código JavaScript para assinar as requisições.');
  console.log('');
})();
