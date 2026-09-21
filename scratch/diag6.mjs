import { createClient } from '@supabase/supabase-js';

const url = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(url, key);

async function main() {
  console.log('=== doadores recentes (codigo >= 47370) ===');
  const { data: d1 } = await supabase
    .from('doadores')
    .select('codigo_doador, nome, dia_semana, regiao')
    .gte('codigo_doador', 47370)
    .order('codigo_doador', { ascending: true });
  console.log(JSON.stringify(d1, null, 2));

  console.log('=== doadores com dia_semana vazio (null/blank) ===');
  const { data: d2, error: e2 } = await supabase
    .from('doadores')
    .select('codigo_doador, nome, dia_semana, regiao')
    .or('dia_semana.is.null,dia_semana.eq.,dia_semana.eq. ')
    .limit(20);
  console.log('count:', d2?.length, JSON.stringify({ e2, d2 }, null, 2));

  console.log('=== doações data_retirada entre 2026-08-20 e 2026-09-05 ===');
  const { data: d3 } = await supabase
    .from('doacoes')
    .select('codigo_doacao, data_retirada, status, doadores(nome, dia_semana)')
    .gte('data_retirada', '2026-08-20')
    .lte('data_retirada', '2026-09-05')
    .neq('status', 'Cancelada')
    .neq('status', 'Baixada')
    .order('data_retirada', { ascending: true });
  console.log(JSON.stringify(d3, null, 2));
}

main();