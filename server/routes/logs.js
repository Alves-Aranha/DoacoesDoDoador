import { Router } from 'express';
import pool, { generateId } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM logs_sistema ORDER BY created_at DESC LIMIT 500'
    );
    console.log(`GET /api/logs: ${rows.length} registros retornados`);
    res.json(rows);
  } catch (e) {
    console.error('Erro ao buscar logs:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { usuario_email, acao, modulo, detalhes = '', terminal } = req.body;
    const id = generateId();
    await pool.execute(
      'INSERT INTO logs_sistema (id, usuario_email, acao, modulo, detalhes, terminal) VALUES (?, ?, ?, ?, ?, ?)',
      [id, usuario_email, acao, modulo, detalhes, terminal]
    );
    res.json({ success: true, id });
  } catch (e) {
    console.error('Erro ao registrar log:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
