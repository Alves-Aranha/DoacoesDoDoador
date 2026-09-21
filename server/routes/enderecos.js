import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Buscar endereço por CEP (prioriza quem tem mapa)
router.get('/cep/:cep', async (req, res) => {
  try {
    const cep = req.params.cep.replace(/\D/g, '');
    // Tenta primeiro quem tem mapa
    let [rows] = await pool.execute(
      'SELECT * FROM enderecos_coleta WHERE cep = ? AND mapa IS NOT NULL AND mapa != ? ORDER BY id DESC LIMIT 1',
      [cep, '']
    );
    if (rows.length === 0) {
      [rows] = await pool.execute(
        'SELECT * FROM enderecos_coleta WHERE cep = ? LIMIT 1',
        [cep]
      );
    }
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Sugestões de endereço (para autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const { q, logradouro } = req.query;
    if (!q || q.length < 2) return res.json([]);

    let sql = 'SELECT * FROM enderecos_coleta WHERE endereco LIKE ?';
    let params = [`%${q}%`];

    if (logradouro && logradouro.trim()) {
      sql += ' AND logradouro LIKE ?';
      params.push(`%${logradouro.trim()}%`);
    }

    sql += ' ORDER BY endereco LIMIT 15';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Verificar se endereço já existe
router.get('/check-exists', async (req, res) => {
  try {
    const { logradouro, endereco } = req.query;
    const [rows] = await pool.execute(
      'SELECT id FROM enderecos_coleta WHERE logradouro LIKE ? AND endereco LIKE ? LIMIT 1',
      [logradouro || '', endereco || '']
    );
    res.json({ exists: rows.length > 0, id: rows[0]?.id || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Inserir novo endereço
router.post('/', async (req, res) => {
  try {
    const { logradouro, endereco, cep, complemento, bairro, cidade, estado, mapa } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO enderecos_coleta (logradouro, endereco, cep, bairro, cidade, estado, mapa) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [logradouro || '', endereco || '', cep || '', bairro || '', cidade || '', estado || '', mapa || '']
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
