-- =====================================================
-- 🚫 PREVENIR DUPLICATAS — DOAÇÕES BM
-- Adiciona UNIQUE constraints e função atômica
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Remover duplicatas existentes antes de adicionar constraint
DELETE FROM doadores a USING (
    SELECT MIN(ctid) as ctid, codigo_doador
    FROM doadores
    GROUP BY codigo_doador
    HAVING COUNT(*) > 1
) b
WHERE a.codigo_doador = b.codigo_doador
  AND a.ctid <> b.ctid;

DELETE FROM doacoes a USING (
    SELECT MIN(ctid) as ctid, codigo_doacao
    FROM doacoes
    GROUP BY codigo_doacao
    HAVING COUNT(*) > 1
) b
WHERE a.codigo_doacao = b.codigo_doacao
  AND a.ctid <> b.ctid;

-- 2. Adicionar UNIQUE constraints (impede duplicatas no banco)
ALTER TABLE doadores ADD CONSTRAINT doadores_codigo_doador_key UNIQUE (codigo_doador);
ALTER TABLE doacoes  ADD CONSTRAINT doacoes_codigo_doacao_key  UNIQUE (codigo_doacao);

-- 3. Função atômica para gerar próximo código de doador
-- Usa pg_advisory_xact_lock para garantir exclusão mútua
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_doador()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_code TEXT;
BEGIN
    -- Lock exclusivo para esta operação (chave 123456)
    PERFORM pg_advisory_xact_lock(123456);

    SELECT LPAD(COALESCE(MAX(CAST(codigo_doador AS INTEGER)), 0) + 1::TEXT, 6, '0')
    INTO next_code
    FROM doadores;

    RETURN next_code;
END;
$$;

-- 4. Função atômica para gerar próximo código de doação
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_doacao()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_code TEXT;
BEGIN
    -- Lock exclusivo para esta operação (chave 789012)
    PERFORM pg_advisory_xact_lock(789012);

    SELECT LPAD(COALESCE(MAX(CAST(codigo_doacao AS INTEGER)), 0) + 1::TEXT, 6, '0')
    INTO next_code
    FROM doacoes;

    RETURN next_code;
END;
$$;
