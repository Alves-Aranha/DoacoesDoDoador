import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Listar com paginação e filtros
router.get('/', async (req, res) => {
  try {
    console.log('GET /doadores query:', req.query);
    const { codigo, nome, cep, tel, tlmk, matcob, index = 0, limit = 100000 } = req.query;
    let where = [];
    let params = [];

    if (codigo) {
      where.push('codigo_doador = ?');
      params.push(parseInt(codigo));
    }
    if (nome) {
      where.push('nome LIKE ?');
      params.push(`%${nome}%`);
    }
    if (cep) {
      where.push('cep = ?');
      params.push(cep.replace(/\D/g, ''));
    }
    if (tel) {
      const clean = tel.replace(/\D/g, '');
      where.push('(celular LIKE ? OR whatsapp LIKE ? OR fixo LIKE ?)');
      params.push(`%${clean}%`, `%${clean}%`, `%${clean}%`);
    }
    if (tlmk) {
      where.push('cod_tlmk = ?');
      params.push(tlmk.trim());
    }
    if (matcob) {
      where.push('cod_matcob = ?');
      params.push(matcob.trim());
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [countResult] = await pool.execute(`SELECT COUNT(*) as total FROM doadores ${whereClause}`, params.length ? params : []);
    const total = countResult[0].total;

    const offset = parseInt(index);
    const limitInt = parseInt(limit);
    const [rows] = await pool.query(
      `SELECT * FROM doadores ${whereClause} ORDER BY codigo_doador ASC LIMIT ${limitInt} OFFSET ${offset}`,
      params.length ? params : []
    );

    res.json({ data: rows, count: total });
  } catch (e) {
    console.error('Erro ao buscar doadores:', e);
    res.status(500).json({ error: e.message });
  }
});

// Próximo código disponível (deve vir antes de /:codigo)
router.get('/next-code', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT MAX(codigo_doador) as max FROM doadores');
    const next = (rows[0].max || 0) + 1;
    res.json({ nextCode: String(next).padStart(6, '0') });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Verificar duplicidade de nome (deve vir antes de /:codigo)
router.get('/check-duplicate/:nome', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT codigo_doador, nome, cep, celular FROM doadores WHERE nome LIKE ? LIMIT 10',
      [`%${req.params.nome}%`]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Buscar um doador por código
router.get('/:codigo', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM doadores WHERE codigo_doador = ?', [parseInt(req.params.codigo)]);
    if (rows.length === 0) return res.status(404).json({ error: 'Doador não encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Inserir doador
router.post('/', async (req, res) => {
  try {
    const { nome, celular, whatsapp, fixo, email, contato, cep, logradouro, endereco, complemento, bairro, cidade, estado, tipo_doador, regiao, dia_semana, mapa, cod_tlmk, cod_matcob, historico } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO doadores 
       (nome, celular, whatsapp, fixo, email, contato, cep, logradouro, endereco, complemento, bairro, cidade, estado, tipo_doador, regiao, dia_semana, mapa, cod_tlmk, cod_matcob, historico, data_cadastro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [nome, celular, whatsapp, fixo, email, contato, cep, logradouro, endereco, complemento, bairro, cidade, estado, tipo_doador, regiao, dia_semana, mapa, cod_tlmk, cod_matcob, historico]
    );

    const codigoGerado = String(result.insertId).padStart(6, '0');
    res.json({ codigo_doador: codigoGerado, insertId: result.insertId });
  } catch (e) {
    console.error('Erro ao inserir doador:', e);
    res.status(500).json({ error: e.message });
  }
});

// Atualizar doador
router.put('/:codigo', async (req, res) => {
  try {
    const { nome, celular, whatsapp, fixo, email, contato, cep, logradouro, endereco, complemento, bairro, cidade, estado, tipo_doador, regiao, dia_semana, mapa, cod_tlmk, cod_matcob, historico } = req.body;

    await pool.execute(
      `UPDATE doadores SET 
       nome=?, celular=?, whatsapp=?, fixo=?, email=?, contato=?, cep=?, logradouro=?, endereco=?, complemento=?, bairro=?, cidade=?, estado=?, tipo_doador=?, regiao=?, dia_semana=?, mapa=?, cod_tlmk=?, cod_matcob=?, historico=?
       WHERE codigo_doador = ?`,
      [nome, celular, whatsapp, fixo, email, contato, cep, logradouro, endereco, complemento, bairro, cidade, estado, tipo_doador, regiao, dia_semana, mapa, cod_tlmk, cod_matcob, historico, parseInt(req.params.codigo)]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
