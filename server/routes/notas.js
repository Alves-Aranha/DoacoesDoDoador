import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, usuario_email } = req.query;
    if (!data || !usuario_email) {
      return res.status(400).json({ error: 'Parâmetros data e usuario_email são obrigatórios' });
    }
    const [rows] = await pool.execute(
      'SELECT * FROM notas WHERE data = ? AND usuario_email = ? LIMIT 1',
      [data, usuario_email]
    );
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { data, usuario_email, conteudo } = req.body;
    if (!data || !usuario_email) {
      return res.status(400).json({ error: 'Parâmetros data e usuario_email são obrigatórios' });
    }

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS notas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_email VARCHAR(255) NOT NULL,
        data DATE NOT NULL,
        conteudo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_nota (usuario_email, data)
      )`
    );

    if (conteudo && conteudo.trim()) {
      await pool.execute(
        'INSERT INTO notas (usuario_email, data, conteudo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE conteudo = VALUES(conteudo), updated_at = NOW()',
        [usuario_email, data, conteudo]
      );
      res.json({ success: true });
    } else {
      await pool.execute(
        'DELETE FROM notas WHERE usuario_email = ? AND data = ?',
        [usuario_email, data]
      );
      res.json({ success: true });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
