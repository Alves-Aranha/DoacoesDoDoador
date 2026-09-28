-- =====================================================
-- CORRECAO: Politicas RLS para permitir fluxo de Signup
-- Execute este script no Supabase SQL Editor
-- Data: 2026-09-28
-- =====================================================

-- PROBLEMA: As politicas atuais bloqueiam duas operacoes necessarias no signup:
--   1. SELECT em perfis_usuarios por usuario anon (verificar se email autorizado)
--   2. UPDATE em perfis_usuarios para vincular user_id apos criar conta

-- 1. Permitir SELECT publico (anon) para verificacao pre-cadastro
DROP POLICY IF EXISTS "ado: anon pode verificar email autorizado" ON public.perfis_usuarios;

CREATE POLICY "ado: anon pode verificar email autorizado"
  ON public.perfis_usuarios FOR SELECT TO anon
  USING (true);

-- 2. Permitir UPDATE do user_id pelo proprio usuario recem-criado
DROP POLICY IF EXISTS "ado: usuario pode vincular proprio user_id" ON public.perfis_usuarios;

CREATE POLICY "ado: usuario pode vincular proprio user_id"
  ON public.perfis_usuarios FOR UPDATE TO authenticated
  USING (
    email = (SELECT auth.jwt()->>'email')
    AND user_id IS NULL
  )
  WITH CHECK (
    email = (SELECT auth.jwt()->>'email')
  );
