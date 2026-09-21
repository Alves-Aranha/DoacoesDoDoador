-- =====================================================
-- PASSO E: POLÍTICAS — perfis_usuarios + logs_sistema
-- Rode DEPOIS do Passo D (último passo)
-- =====================================================

-- perfis_usuarios: SELECT próprio perfil ou admin; INSERT/UPDATE/DELETE admin only
CREATE POLICY "ado: ver proprio perfil ou admin"
  ON public.perfis_usuarios FOR SELECT TO authenticated
  USING (
    email = (SELECT auth.jwt()->>'email')
    OR public.is_admin()
  );

CREATE POLICY "ado: somente admin pode criar perfil"
  ON public.perfis_usuarios FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "ado: somente admin pode editar perfil"
  ON public.perfis_usuarios FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ado: somente admin pode excluir perfil"
  ON public.perfis_usuarios FOR DELETE TO authenticated
  USING (public.is_admin());

-- logs_sistema: INSERT qualquer autenticado; SELECT apenas admin
CREATE POLICY "ado: autenticado pode registrar log"
  ON public.logs_sistema FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "ado: somente admin pode ler logs"
  ON public.logs_sistema FOR SELECT TO authenticated
  USING (public.is_admin());