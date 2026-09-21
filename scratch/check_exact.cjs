
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSpecificExact() {
    console.log('--- Verificando Barra de Santa Rosa com Rua ---');
    const { data, error } = await supabase
        .from('enderecos_coleta')
        .select('*')
        .eq('endereco', 'Barra de Santa Rosa')
        .eq('logradouro', 'Rua');

    if (error) {
        console.error('Erro:', error);
    } else {
        console.log('Resultados:', JSON.stringify(data, null, 2));
    }
}

checkSpecificExact();
