-- =====================================================
-- ⚡ ÍNDICES DE PERFORMANCE — DOAÇÕES BM
-- Resolve: "Your project is currently exhausting multiple resources"
--
-- ⚠️ COMO EXECUTAR NO SUPABASE SQL EDITOR:
-- O editor encerra a conexão (connection timeout) se o script demorar
-- mais de ~60s. Rode UM LOTE POR VEZ, copiando e executando apenas
-- a seção "-- BATCH 1", depois "-- BATCH 2", etc.
--
-- IMPORTANTE: se der "connection terminated due to connection timeout",
-- o índice pode ter sido criado mesmo assim. Rode novamente o lote —
-- o "IF NOT EXISTS" torna tudo idempotente (seguro repetir).
-- 100% idempotente. Não usar CREATE INDEX CONCURRENTLY (bloqueado no editor).
-- =====================================================

-- ─────────────────────────────
-- BATCH 1 — Trigram + DOADORES
-- ─────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_doadores_codigo        ON doadores (codigo_doador);
CREATE INDEX IF NOT EXISTS idx_doadores_nome_trgm     ON doadores USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_doadores_cep           ON doadores (cep);
CREATE INDEX IF NOT EXISTS idx_doadores_cod_tlmk      ON doadores (cod_tlmk);
CREATE INDEX IF NOT EXISTS idx_doadores_cod_matcob    ON doadores (cod_matcob);
CREATE INDEX IF NOT EXISTS idx_doadores_data_cadastro ON doadores (data_cadastro);

-- ─────────────────────────────
-- BATCH 2 — DOACOES (parte 1)
-- ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_doacoes_codigo          ON doacoes (codigo_doacao);
CREATE INDEX IF NOT EXISTS idx_doacoes_codigo_doador   ON doacoes (codigo_doador);
CREATE INDEX IF NOT EXISTS idx_doacoes_status          ON doacoes (status);
CREATE INDEX IF NOT EXISTS idx_doacoes_data_doacao     ON doacoes (data_doacao);

-- ─────────────────────────────
-- BATCH 3 — DOACOES (parte 2)
-- ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_doacoes_data_retirada   ON doacoes (data_retirada);
CREATE INDEX IF NOT EXISTS idx_doacoes_remarcado_para  ON doacoes (remarcado_para);
CREATE INDEX IF NOT EXISTS idx_doacoes_data_cancelamento ON doacoes (data_cancelamento);
CREATE INDEX IF NOT EXISTS idx_doacoes_responsavel     ON doacoes (responsavel);

-- ─────────────────────────────
-- BATCH 4 — ITENS_DOACAO + ENDERECOS_COLETA
-- ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_itens_doacao_id_doacao ON itens_doacao (id_doacao);

CREATE INDEX IF NOT EXISTS idx_enderecos_cep            ON enderecos_coleta (cep);
CREATE INDEX IF NOT EXISTS idx_enderecos_endereco_trgm  ON enderecos_coleta USING gin (endereco gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_enderecos_logradouro_trgm ON enderecos_coleta USING gin (logradouro gin_trgm_ops);

-- ─────────────────────────────
-- BATCH 5 — TABELAS PEQUENAS
-- ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_perfis_email ON perfis_usuarios (email);

CREATE INDEX IF NOT EXISTS idx_itens_codigo_base      ON itens (codigo_base);
CREATE INDEX IF NOT EXISTS idx_itens_codigo_completo  ON itens (codigo_completo);

CREATE INDEX IF NOT EXISTS idx_categoria_codigo_base ON categoria (codigo_base);

CREATE INDEX IF NOT EXISTS idx_logs_created_at      ON logs_sistema (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_usuario_email   ON logs_sistema (usuario_email);

CREATE INDEX IF NOT EXISTS idx_notas_usuario_data ON notas (usuario_email, data);

CREATE INDEX IF NOT EXISTS idx_historico_data          ON historico_doacoes (data_doacao DESC, codigo_doacao DESC);
CREATE INDEX IF NOT EXISTS idx_historico_codigo_doador ON historico_doacoes (codigo_doador);

-- ─────────────────────────────
-- BATCH 6 (OPCIONAL, rodar por último)
-- Atualiza as estatísticas que o planner usa. Demorado: faça só após
-- os lotes 1 a 5 concluírem, em execução separada do editor.
-- ─────────────────────────────
ANALYZE;