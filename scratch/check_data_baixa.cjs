const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data, error } = await supabase
        .from('doacoes')
        .select('codigo_doacao, status, data_baixa, data_cancelamento, data_retirada, remarcado_para')
        .eq('status', 'Baixada')
        .limit(20);
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Count Baixadas:', data.length);
    console.log(JSON.stringify(data, null, 2));
}

run();
