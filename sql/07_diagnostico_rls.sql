-- =====================================================
-- 🔍 DIAGNÓSTICO RLS — DOAÇÕES BM
-- Rode no SQL Editor do Supabase e envie o resultado para validarmos
-- o estado atual antes da migração.
-- =====================================================

-- 1) RLS habilitado por tabela (relrowsecurity = true/false)
SELECT c.relname AS tabela, c.relrowsecurity AS rls_ativado
FROM pg_class c
WHERE c.relkind = 'r'
  AND c.relnamespace = 'public'::regnamespace
ORDER BY c.relname;

-- 2) Políticas existentes (cmd = SELECT/INSERT/UPDATE/DELETE/ALL | roles = quem pode aplicar)
SELECT tablename, policyname, cmd, roles, left(qual::text, 80) AS usando, left(with_check::text, 80) AS with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3) Privilégios (quais papéis têm permissão em cada tabela)
SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- 4) Perfis de usuários (resumo de cargos/departamentos)
SELECT COALESCE(role, '(vazio)') AS role, COALESCE(departamento, '(vazio)') AS departamento, COUNT(*) AS qtde
FROM perfis_usuarios
GROUP BY role, departamento
ORDER BY 1, 2;

-- 5) Quantidade de usuários criados na autenticação (Supabase Auth)
SELECT COUNT(*) AS usuarios_no_auth
FROM auth.users;