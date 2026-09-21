-- =====================================================
-- PASSO A: FUNÇÃO is_admin() + GRANTS
-- Rode este primeiro — rápido, sem loop
-- =====================================================

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
  ) OR auth.jwt()->>'email' = 'virgo.aranha@gmail.com';
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;