-- Corrige o nome da tabela de perfis no projeto NOVO.
-- No banco antigo a tabela era public.perfis_usuarios (com "s").
-- No projeto novo ela foi criada como public.perfis_usuario (6 linhas).
-- Este script remove a tabela vazia com o nome errado faltante e renomeia a populada.

DO $$
BEGIN
  -- Só mexe em public.perfis_usuarios se ela existir e estiver vazia (nada a perder)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'perfis_usuarios'
  ) THEN
    IF (SELECT count(*) FROM public.perfis_usuarios) = 0 THEN
      DROP TABLE public.perfis_usuarios;
      RAISE NOTICE 'Tabela vazia public.perfis_usuarios removida.';
    ELSE
      RAISE EXCEPTION 'ABORTADO: public.perfis_usuarios tem % linha(s). Confira manualmente.', (SELECT count(*) FROM public.perfis_usuarios);
    END IF;
  END IF;
END $$;

-- Renomeia a tabela que tem os 6 perfis
ALTER TABLE public.perfis_usuario RENAME TO perfis_usuarios;

-- Confere o resultado
SELECT current_schema() AS schema, tablename
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND tablename IN ('perfis_usuario', 'perfis_usuarios');

SELECT id, email, role, departamento, status FROM public.perfis_usuarios ORDER BY email;