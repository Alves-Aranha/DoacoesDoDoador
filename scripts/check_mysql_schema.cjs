const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'abrigobd'
  });

  const [tables] = await connection.execute('SHOW TABLES');
  console.log('=== Tables ===');
  for (const t of tables) {
    const [cols] = await connection.execute(`SHOW CREATE TABLE ${Object.values(t)[0]}`);
    console.log('\n' + cols[0]['Create Table']);
  }

  await connection.end();
}

main().catch(e => { console.error(e); process.exit(1); });
