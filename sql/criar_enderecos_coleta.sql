-- ============================================================
-- Script SQL: Criar e Popular a tabela "enderecos_coleta"
-- Sistema: Doações BM
-- Data: 2026-04-12
-- ============================================================
-- INSTRUÇÕES:
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor)
-- Ele fará 3 coisas:
--   1. Criar a tabela "enderecos_coleta"
--   2. Popular com endereços únicos já existentes na tabela "doadores"
--   3. Habilitar RLS (Row Level Security) com política pública
-- ============================================================

-- ──────────────────────────────────────────────
-- PASSO 1: Criar a tabela
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enderecos_coleta (
    id          SERIAL PRIMARY KEY,
    logradouro  TEXT NOT NULL DEFAULT '',        -- Rua, Avenida, Travessa, etc.
    endereco    TEXT NOT NULL DEFAULT '',        -- Nome da rua/avenida
    cep         TEXT DEFAULT '',                 -- CEP (somente números)
    bairro      TEXT DEFAULT '',                 -- Bairro
    cidade      TEXT DEFAULT '',                 -- Cidade
    estado      TEXT DEFAULT '',                 -- UF (2 letras)
    mapa        TEXT DEFAULT '',                 -- Código MapoGraph
    created_at  TIMESTAMPTZ DEFAULT NOW()        -- Data de criação do registro
);

-- Índice único para evitar duplicatas (combinação logradouro + endereco + cep)
CREATE UNIQUE INDEX IF NOT EXISTS idx_enderecos_coleta_unique 
    ON enderecos_coleta (
        LOWER(TRIM(COALESCE(logradouro, ''))), 
        LOWER(TRIM(COALESCE(endereco, ''))), 
        TRIM(COALESCE(cep, ''))
    );

-- Índice para buscas rápidas por endereço (usado na Lista Suspensa)
CREATE INDEX IF NOT EXISTS idx_enderecos_coleta_endereco 
    ON enderecos_coleta (LOWER(endereco));

-- Índice para buscas por logradouro
CREATE INDEX IF NOT EXISTS idx_enderecos_coleta_logradouro 
    ON enderecos_coleta (LOWER(logradouro));

-- ──────────────────────────────────────────────
-- PASSO 2: Popular com dados existentes
-- ──────────────────────────────────────────────
-- Extrai endereços ÚNICOS da tabela "doadores" que possuem
-- pelo menos logradouro OU endereco preenchido.
-- O ON CONFLICT garante que não haverá erro de duplicata.
-- ──────────────────────────────────────────────
INSERT INTO enderecos_coleta (logradouro, endereco, cep, bairro, cidade, estado, mapa)
SELECT DISTINCT ON (
    LOWER(TRIM(COALESCE(logradouro, ''))), 
    LOWER(TRIM(COALESCE(endereco, ''))), 
    TRIM(COALESCE(cep, ''))
)
    TRIM(COALESCE(logradouro, ''))  AS logradouro,
    TRIM(COALESCE(endereco, ''))    AS endereco,
    TRIM(COALESCE(cep, ''))         AS cep,
    TRIM(COALESCE(bairro, ''))      AS bairro,
    TRIM(COALESCE(cidade, ''))      AS cidade,
    TRIM(COALESCE(estado, ''))      AS estado,
    TRIM(COALESCE(mapa, ''))        AS mapa
FROM doadores
WHERE 
    -- Só importa registros que tenham pelo menos logradouro ou endereco
    (TRIM(COALESCE(logradouro, '')) != '' OR TRIM(COALESCE(endereco, '')) != '')
ORDER BY 
    LOWER(TRIM(COALESCE(logradouro, ''))), 
    LOWER(TRIM(COALESCE(endereco, ''))), 
    TRIM(COALESCE(cep, '')),
    -- Em caso de duplicatas, prioriza o registro que tenha o campo "mapa" preenchido
    CASE WHEN TRIM(COALESCE(mapa, '')) != '' THEN 0 ELSE 1 END
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────
-- PASSO 3: Habilitar RLS e criar política
-- ──────────────────────────────────────────────
ALTER TABLE enderecos_coleta ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado pode ler e inserir
CREATE POLICY "Leitura pública de enderecos_coleta" 
    ON enderecos_coleta FOR SELECT 
    USING (true);

CREATE POLICY "Inserção autenticada em enderecos_coleta" 
    ON enderecos_coleta FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Atualização autenticada em enderecos_coleta" 
    ON enderecos_coleta FOR UPDATE 
    USING (true);

-- ──────────────────────────────────────────────
-- VERIFICAÇÃO: Conferir quantos registros foram importados
-- ──────────────────────────────────────────────
SELECT 
    COUNT(*) AS total_enderecos_importados,
    COUNT(CASE WHEN mapa != '' THEN 1 END) AS com_mapa,
    COUNT(CASE WHEN mapa = '' OR mapa IS NULL THEN 1 END) AS sem_mapa
FROM enderecos_coleta;
