import { createClient } from '@supabase/supabase-js';
const url = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('doacoes').select('*').limit(1);
  if (error) {
    console.error('ERROR:', error.message);
  } else if (data && data.length > 0) {
    console.log('COLUMNS_DOACOES:', Object.keys(data[0]));
    console.log('SAMPLE_DATA:', data[0]);
  } else {
    // If no data, try to get column names via another method if possible, or just note it's empty
    console.log('TABLE_DOACOES_IS_EMPTY');
  }
}
check();
