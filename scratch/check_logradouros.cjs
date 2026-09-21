
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLogradouros() {
    const { data, error } = await supabase
        .from('enderecos_coleta')
        .select('logradouro')
        .limit(100);

    if (error) {
        console.error('Erro:', error);
    } else {
        const counts = {};
        data.forEach(d => {
            counts[d.logradouro] = (counts[d.logradouro] || 0) + 1;
        });
        console.log('Frequência de Logradouros (100 amostras):', counts);
    }
}

checkLogradouros();
