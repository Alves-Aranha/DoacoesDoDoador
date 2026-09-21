const mysql = require('mysql2/promise');

const passwords = ['', 'root', 'admin', 'password', 'mysql', '123456', '1234'];

async function tryPasswords() {
  for (const pw of passwords) {
    try {
      const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: pw,
        database: 'mysql',
        connectTimeout: 3000
      });
      console.log('SUCCESS with password:', pw);
      const [rows] = await connection.execute('SELECT User, Host FROM user WHERE User = ?', ['root']);
      console.log('Root users:', rows);
      await connection.end();
      return pw;
    } catch (e) {
      if (e.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('FAIL with password:', pw);
      } else {
        console.log('ERROR:', e.code, e.message);
      }
    }
  }
  console.log('No password worked');
}

tryPasswords().then(pw => {
  if (pw) console.log('Found password:', pw);
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
