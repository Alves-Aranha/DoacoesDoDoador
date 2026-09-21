
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBarra() {
    console.log('--- Verificando Barra de Santa Rosa em Doadores ---');
    const { data, error } = await supabase
        .from('doadores')
        .select('*')
        .eq('endereco', 'Barra de Santa Rosa');

    if (error) {
        console.error('Erro:', error);
    } else {
        console.log('Donors found:', JSON.stringify(data, null, 2));
    }
}

checkBarra();
