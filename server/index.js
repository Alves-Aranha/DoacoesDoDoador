import express from 'express';
import cors from 'cors';
import doadoresRouter from './routes/doadores.js';
import enderecosRouter from './routes/enderecos.js';
import logsRouter from './routes/logs.js';
import authRouter from './routes/auth.js';
import notasRouter from './routes/notas.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/doadores', doadoresRouter);
app.use('/api/enderecos', enderecosRouter);
app.use('/api/logs', logsRouter);
app.use('/api/auth', authRouter);
app.use('/api/notas', notasRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'abrigobd' });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
