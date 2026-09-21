import { createClient } from '@supabase/supabase-js';

const url = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(url, key);

async function main() {
  console.log('=== últimos 15 doacoes (por código) ===');
  const { data, error } = await supabase
    .from('doacoes')
    .select('codigo_doacao, codigo_doador, data_doacao, data_retirada, remarcado_para, status, doadores(nome, dia_semana, regiao)')
    .order('codigo_doacao', { ascending: false })
    .limit(15);
  console.log(JSON.stringify({ error, data }, null, 2));

  console.log('=== busca exata data_retirada=2026-09-04 ===');
  const { data: d2 } = await supabase
    .from('doacoes')
    .select('codigo_doacao, codigo_doador, data_retirada, remarcado_para, status, doadores(nome, dia_semana, regiao)')
    .eq('data_retirada', '2026-09-04');
  console.log(JSON.stringify(d2, null, 2));
}

main();