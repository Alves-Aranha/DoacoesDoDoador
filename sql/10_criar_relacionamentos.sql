-- =====================================================================
-- CRIAR RELACIONAMENTOS (FOREIGN KEYS) — projeto NOVO
-- Projeto: azuibbsuegtvzcfbgskj.supabase.co
-- Corrige: "Could not find a relationship between 'doacoes' and 'doadores'"
-- Rode no SQL Editor do Supabase do projeto NOVO.
-- Idempotente: pode rodar mais de uma vez.
-- =====================================================================

-- 1) DIAGNOSTICO: tipos das colunas envolvidas
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name, column_name) IN (
    ('doadores',   'codigo_doador'),
    ('doacoes',    'codigo_doador'),
    ('doacoes',    'codigo_doacao'),
    ('itens_doacao','id_doacao')
  )
ORDER BY table_name, column_name;

-- 2) DIAGNOSTICO: orfaos e duplicatas (deve retornar 0 em todas)
SELECT 'doacoes sem doador' AS verificacao,
       count(*) AS total
FROM doacoes d
WHERE NOT EXISTS (SELECT 1 FROM doadores x WHERE x.codigo_doador = d.codigo_doador)

UNION ALL

SELECT 'itens_doacao sem doacao',
       count(*)
FROM itens_doacao d
WHERE NOT EXISTS (SELECT 1 FROM doacoes x WHERE x.codigo_doacao = d.id_doacao)

UNION ALL

SELECT 'codigo_doador duplicado em doadores',
       (SELECT count(*) - count(DISTINCT codigo_doador) FROM doadores)

UNION ALL

SELECT 'codigo_doacao duplicado em doacoes',
       (SELECT count(*) - count(DISTINCT codigo_doacao) FROM doacoes);

-- 3) CRIA AS FOREIGN KEYS (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_doacoes_doador'
      AND conrelid = 'public.doacoes'::regclass
  ) THEN
    ALTER TABLE public.doacoes
      ADD CONSTRAINT fk_doacoes_doador
      FOREIGN KEY (codigo_doador)
      REFERENCES public.doadores (codigo_doador);
    RAISE NOTICE 'FK fk_doacoes_doador criada.';
  ELSE
    RAISE NOTICE 'FK fk_doacoes_doador ja existia.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_itens_doacao_doacao'
      AND conrelid = 'public.itens_doacao'::regclass
  ) THEN
    ALTER TABLE public.itens_doacao
      ADD CONSTRAINT fk_itens_doacao_doacao
      FOREIGN KEY (id_doacao)
      REFERENCES public.doacoes (codigo_doacao);
    RAISE NOTICE 'FK fk_itens_doacao_doacao criada.';
  ELSE
    RAISE NOTICE 'FK fk_itens_doacao_doacao ja existia.';
  END IF;
END $$;

-- 4) FORCA o schema cache do PostgREST a recarregar (relacionamentos novos)
NOTIFY pgrst, 'reload schema';

-- 5) CONFIRMACAO das FKs existentes
SELECT tc.table_name,
       kcu.column_name,
       ccu.table_name  AS tabela_referenciada,
       ccu.column_name AS coluna_referenciada
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;