-- =====================================================
-- PASSO C: HABILITAR RLS + LIMPAR POLÍTICAS ANTIGAS
-- Rode DEPOIS do Passo B
-- =====================================================

-- Habilita RLS em todas as 13 tabelas
ALTER TABLE IF EXISTS public.doadores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doacoes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.itens               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.itens_doacao        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enderecos_coleta    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.perfis_usuarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.logs_sistema        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categoria           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.motoristas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.veiculos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimentacoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.historico_doacoes   ENABLE ROW LEVEL SECURITY;

-- Remove todas as políticas existentes (idempotente)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;