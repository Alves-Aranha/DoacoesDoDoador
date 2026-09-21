import { createClient } from '@supabase/supabase-js';
const url = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('doadores').select('*').limit(1);
  if (data) console.log('TABLE_DOADORES: OK');
  else console.log('TABLE_DOADORES: FAIL', error?.message);

  const { data: d2, error: e2 } = await supabase.from('usuarios_internos').select('*').limit(1);
  console.log('usuarios_internos:', !!d2, e2?.message);

  const { data: d3, error: e3 } = await supabase.from('contatos_internos').select('*').limit(1);
  console.log('contatos_internos:', !!d3, e3?.message);
}
check();
