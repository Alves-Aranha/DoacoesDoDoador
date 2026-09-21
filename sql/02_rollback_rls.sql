-- =====================================================
-- 🔄 ROLLBACK — DESATIVAR RLS (EMERGÊNCIA)
-- =====================================================

ALTER TABLE doadores           DISABLE ROW LEVEL SECURITY;
ALTER TABLE doacoes            DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens_doacao       DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_usuarios    DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema       DISABLE ROW LEVEL SECURITY;
ALTER TABLE enderecos_coleta   DISABLE ROW LEVEL SECURITY;
ALTER TABLE itens              DISABLE ROW LEVEL SECURITY;
ALTER TABLE categoria          DISABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas         DISABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos           DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes      DISABLE ROW LEVEL SECURITY;

-- ✅ RLS desativado. Sistema de volta ao normal.
