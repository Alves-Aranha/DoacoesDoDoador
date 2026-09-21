-- =====================================================================
-- ATIVACAO COMPLETA RLS + PERMISSOES — DOACOES BM (projeto NOVO)
-- Projeto: azuibbsuegtvzcfbgskj.supabase.co
-- Rode no SQL Editor do Supabase do projeto NOVO.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- =====================================================================

BEGIN;

-- ============================================================
-- 1) FUNCAO AUXILIAR: e-mail do usuario logado
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(auth.jwt()->>'email', '');
$$;

GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM anon, public;

-- ============================================================
-- 2) FUNCAO AUXILIAR: is_admin()
-- Admin = role='admin' em perfis_usuarios OU e-mail na lista de seguranca.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfis_usuarios
    WHERE email = auth.jwt()->>'email' AND role = 'admin'
    LIMIT 1
  ) OR auth.jwt()->>'email' IN (
    'virgo.aranha@gmail.com',
    'virgo.aranha66@gmail.com',
    'eli.almeida7306@gmail.com'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;

-- ============================================================
-- 3) AJUSTA PERFIS conforme lista de usuarios solicitada
--    (virgo.aranha66@gmail.com -> Administrador / Suporte)
-- ============================================================
UPDATE public.perfis_usuarios
SET role = 'admin', departamento = 'Suporte', status = 'Ativo'
WHERE email = 'virgo.aranha66@gmail.com';

-- Garante que os e-mails abaixo nao fiquem sem perfil
INSERT INTO public.perfis_usuarios (email, role, departamento, status)
SELECT e.email, e.role, e.departamento, 'Ativo'
FROM (VALUES
  ('virgo.aranha@gmail.com',    'admin', 'Suporte'),
  ('virgo.aranha66@gmail.com',  'admin', 'Suporte'),
  ('eli.almeida7306@gmail.com', 'admin', 'Doações'),
  ('shirlinhaesantos@gmail.com','user',  'Doações'),
  ('auroevangelista59@gmail.com','user', 'Transportes'),
  ('vendas.glaucio@gmail.com',  'user',  'Diretoria')
) AS e(email, role, departamento)
WHERE NOT EXISTS (
  SELECT 1 FROM public.perfis_usuarios p
  WHERE p.email = e.email
);

-- ============================================================
-- 4) HABILITA RLS em TODAS as tabelas do schema public
-- ============================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- ============================================================
-- 5) REMOVE politicas antigas (idempotente)
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 6) POLITICAS — TABELAS DE DADOS (todos os autenticados)
--    O app exige leitura/escrita para todos os departamentos.
-- ============================================================
DO $$
DECLARE
  t text;
  data_tables text[] := ARRAY[
    'doadores', 'doacoes', 'itens', 'itens_doacao',
    'enderecos_coleta', 'categoria', 'motoristas', 'veiculos',
    'movimentacoes', 'historico_doacoes', 'contatos_internos',
    'tipo_doador', 'regiao'
  ];
BEGIN
  FOREACH t IN ARRAY data_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
        'rls_total_' || t,
        t
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 7) POLITICAS — perfis_usuarios
--    SELECT: proprio perfil ou admin | INSERT/UPDATE/DELETE: admin
-- ============================================================
CREATE POLICY "rls_perfis_select" ON public.perfis_usuarios FOR SELECT TO authenticated
  USING (email = public.current_user_email() OR public.is_admin());

CREATE POLICY "rls_perfis_insert" ON public.perfis_usuarios FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "rls_perfis_update" ON public.perfis_usuarios FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "rls_perfis_delete" ON public.perfis_usuarios FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 8) POLITICAS — notas (so o autor; admin ve tudo)
-- ============================================================
CREATE POLICY "rls_notas_select" ON public.notas FOR SELECT TO authenticated
  USING (usuario_email = public.current_user_email() OR public.is_admin());

CREATE POLICY "rls_notas_insert" ON public.notas FOR INSERT TO authenticated
  WITH CHECK (usuario_email = public.current_user_email() OR public.is_admin());

CREATE POLICY "rls_notas_update" ON public.notas FOR UPDATE TO authenticated
  USING (usuario_email = public.current_user_email() OR public.is_admin())
  WITH CHECK (usuario_email = public.current_user_email() OR public.is_admin());

CREATE POLICY "rls_notas_delete" ON public.notas FOR DELETE TO authenticated
  USING (usuario_email = public.current_user_email() OR public.is_admin());

-- ============================================================
-- 9) POLITICAS — logs_sistema (grava autenticado; le/edita admin)
-- ============================================================
CREATE POLICY "rls_logs_insert" ON public.logs_sistema FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "rls_logs_select" ON public.logs_sistema FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "rls_logs_update" ON public.logs_sistema FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "rls_logs_delete" ON public.logs_sistema FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 10) PRIVILEGIOS POR PAPEL
-- 10.1 Bloqueia acesso do anon a todas as tabelas public
-- ============================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- 10.2 Garante acesso do autenticado (as politicas RLS decidem as linhas)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- ============================================================
-- VERIFICACAO — status RLS por tabela + politicas criadas
-- ============================================================
SELECT c.relname AS tabela, c.relrowsecurity AS rls_ativado
FROM pg_class c
WHERE c.relkind = 'r'
  AND c.relnamespace = 'public'::regnamespace
ORDER BY c.relname;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;