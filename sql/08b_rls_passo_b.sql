-- =====================================================
-- PASSO B: REVOKE ANON + GRANT AUTHENTICATED
-- Rode DEPOIS do Passo A
-- =====================================================

-- Revoga qualquer grant anterior do papel "anon"
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tabela
    FROM pg_class c
    WHERE c.relkind = 'r'
      AND c.relnamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon;', r.tabela);
  END LOOP;
END $$;

-- Garante que authenticated tem acesso a todas as tabelas
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tabela
    FROM pg_class c
    WHERE c.relkind = 'r'
      AND c.relnamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('GRANT ALL ON public.%I TO authenticated;', r.tabela);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;