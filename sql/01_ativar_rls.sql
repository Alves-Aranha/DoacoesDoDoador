-- =====================================================
-- 🔒 SCRIPT DE ATIVAÇÃO RLS — DOAÇÕES BM
-- Data: 2026-04-18
-- Seguro para produção — 100% reversível
-- =====================================================

-- 1. DOADORES
CREATE POLICY "Autenticados: acesso total doadores" ON doadores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. DOACOES
CREATE POLICY "Autenticados: acesso total doacoes" ON doacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. ITENS_DOACAO
CREATE POLICY "Autenticados: acesso total itens_doacao" ON itens_doacao FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. PERFIS_USUARIOS
CREATE POLICY "Autenticados: leitura perfis" ON perfis_usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados: inserir perfis" ON perfis_usuarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados: atualizar perfis" ON perfis_usuarios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados: deletar perfis" ON perfis_usuarios FOR DELETE TO authenticated USING (true);

-- 5. LOGS_SISTEMA
CREATE POLICY "Autenticados: leitura logs" ON logs_sistema FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados: inserir logs" ON logs_sistema FOR INSERT TO authenticated WITH CHECK (true);

-- 6. ENDERECOS_COLETA
CREATE POLICY "Autenticados: acesso total enderecos_coleta" ON enderecos_coleta FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. ITENS
CREATE POLICY "Autenticados: acesso total itens" ON itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. CATEGORIA
CREATE POLICY "Autenticados: acesso total categoria" ON categoria FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. MOTORISTAS
CREATE POLICY "Autenticados: acesso total motoristas" ON motoristas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. VEICULOS
CREATE POLICY "Autenticados: acesso total veiculos" ON veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. MOVIMENTACOES
CREATE POLICY "Autenticados: acesso total movimentacoes" ON movimentacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ATIVAR RLS
ALTER TABLE doadores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE doacoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_doacao       ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_usuarios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema       ENABLE ROW LEVEL SECURITY;
ALTER TABLE enderecos_coleta   ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria          ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes      ENABLE ROW LEVEL SECURITY;
