import { createClient } from '@supabase/supabase-js';

const url = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(url, key);

async function main() {
  console.log('=== doacoes com data_retirada 2026-09-04 ou remarcado ===');
  const { data: dc, error: dcErr } = await supabase
    .from('doacoes')
    .select('codigo_doacao, codigo_doador, data_retirada, remarcado_para, status, doadores(codigo_doador, nome, dia_semana, regiao)')
    .or(`data_retirada.gte.2026-09-04,remarcado_para.gte.2026-09-04`)
    .limit(20);
  console.log(JSON.stringify({ dcErr, dc }, null, 2));

  console.log('=== distribuição de dia_semana nos doadores ===');
  const { data: ds, error: dsErr } = await supabase
    .from('doadores')
    .select('dia_semana')
    .not('dia_semana', 'is', null);
  const counts = {};
  (ds || []).forEach(d => {
    const v = (d.dia_semana || '').trim() || '(vazio)';
    counts[v] = (counts[v] || 0) + 1;
  });
  console.log(JSON.stringify({ dsErr, counts }, null, 2));
}

main();