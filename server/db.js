import mysql from 'mysql2/promise';
import crypto from 'crypto';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'mld091929@',
  database: 'abrigobd',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;

export function generateId() {
  return crypto.randomUUID();
}
