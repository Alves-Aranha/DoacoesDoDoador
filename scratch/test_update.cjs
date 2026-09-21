
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
    console.log('--- Testando UPDATE em enderecos_coleta ---');
    const { data, error, count } = await supabase
        .from('enderecos_coleta')
        .update({ logradouro: 'TESTE_UPDATE' }, { count: 'exact' })
        .eq('id', 1);

    if (error) {
        console.error('ERRO NO UPDATE:', JSON.stringify(error, null, 2));
    } else {
        console.log(`Sucesso! Linhas alteradas: ${count}`);
    }
}

testUpdate();
