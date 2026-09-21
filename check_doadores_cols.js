import { createClient } from '@supabase/supabase-js';
const url = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('doadores').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('COLUMNS_DOADORES:', Object.keys(data[0]));
  }
}
check();
