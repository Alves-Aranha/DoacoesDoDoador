
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('--- Verificando Conteúdo de enderecos_coleta ---');
    const { data, error } = await supabase
        .from('enderecos_coleta')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Erro ao buscar dados:', error);
    } else {
        console.log(`Linhas encontradas: ${data.length}`);
        console.log('Amostra:', JSON.stringify(data, null, 2));
    }
}

checkData();
