-- =====================================================
-- PASSO D: POLÍTICAS — TABELAS DE DADOS (11 tabelas)
-- Rode DEPOIS do Passo C
-- =====================================================

CREATE POLICY "ado: autenticado acesso total"
  ON public.doadores FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.doacoes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.itens FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.itens_doacao FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.enderecos_coleta FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.categoria FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.motoristas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.veiculos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.movimentacoes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.historico_doacoes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "ado: autenticado acesso total"
  ON public.notas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);