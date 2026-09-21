import { Router } from 'express';
import pool from '../db.js';
import crypto from 'crypto';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });

    // Test connection first
    const [testRows] = await pool.execute('SELECT DATABASE() as db, COUNT(*) as total FROM perfis_usuarios');
    console.log('DB:', testRows[0].db, 'Total users:', testRows[0].total);

    const [users] = await pool.execute(
      'SELECT * FROM perfis_usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    console.log('Users found for', email, ':', users.length);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = users[0];
    // Coluna 'status' contém o departamento (Suporte, Diretoria, Doações, Transportes)
    // Coluna 'departamento' contém timestamps da migração
    const token = crypto.randomBytes(32).toString('hex');

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        departamento: user.status,
        user_id: user.user_id
      },
      token
    });
  } catch (e) {
    console.error('Erro no login:', e);
    res.status(500).json({ error: e.message });
  }
});

// Obter perfil
router.get('/profile/:email', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT * FROM perfis_usuarios WHERE email = ? LIMIT 1',
      [req.params.email]
    );
    if (users.length === 0) return res.status(404).json({ error: 'Perfil não encontrado' });
    const user = users[0];
    // Mapeia coluna 'status' como 'departamento'
    res.json({
      id: user.id,
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      departamento: user.status,
      status: user.departamento
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
