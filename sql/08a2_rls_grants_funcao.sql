-- PASSO A2: Grants da função is_admin() — roda DEPOIS do A1

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;