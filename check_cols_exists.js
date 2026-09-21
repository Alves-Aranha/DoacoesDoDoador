import { createClient } from '@supabase/supabase-js';
const url = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('doacoes').select('*').limit(1);
  if (error) {
    console.error('ERROR:', error.message);
  } else if (data) {
    // Even if empty, let's try to find an older record or just list what we have
    const { data: allData } = await supabase.rpc('get_table_columns', { table_name: 'doacoes' });
    // Note: RPC might not exist. Let's just try to insert a dummy record and rollback or just check another table's data if it has it.
    
    // Better: try to select specific columns and see which ones fail.
    const columnsToTest = ['codigo_doacao', 'codigo_doador', 'data_doacao', 'data_retirada', 'remarcado_para', 'responsavel', 'motorista', 'veiculo', 'status', 'observacoes'];
    for (const col of columnsToTest) {
      const { error: colErr } = await supabase.from('doacoes').select(col).limit(1);
      if (colErr) {
        console.log(`COLUMN ${col}: MISSING (${colErr.message})`);
      } else {
        console.log(`COLUMN ${col}: OK`);
      }
    }
  }
}
check();
