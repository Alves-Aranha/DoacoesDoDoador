const fs = require('fs');
const path = require('path');

const privateKeyPath = path.join(__dirname, '..', 'dist', 'qz', 'private-key.pem');

if (fs.existsSync(privateKeyPath)) {
  fs.rmSync(privateKeyPath);
  console.log('[QZ] Chave privada removida de dist/qz/private-key.pem');
}
