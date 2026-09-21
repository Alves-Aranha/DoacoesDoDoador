-- PASSO A1: Criar função is_admin() — roda sozinha

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