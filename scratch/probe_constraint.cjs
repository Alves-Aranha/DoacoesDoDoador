
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probe() {
    const combinations = [
        'endereco',
        'logradouro,endereco',
        'logradouro,endereco,cep',
        'logradouro,endereco,cidade',
        'logradouro,endereco,mapa',
        'logradouro,endereco,bairro'
    ];

    for (const combo of combinations) {
        console.log(`Testando onConflict: ${combo}`);
        const { error } = await supabase
            .from('enderecos_coleta')
            .upsert([{ logradouro: 'TESTE', endereco: 'TESTE', cidade: 'TESTE', cep: '00000000' }], { onConflict: combo });

        if (error && error.code === '42P10') {
            console.log(`  Falhou: combo inválido.`);
        } else if (error) {
            console.log(`  Erro (mas combo pode estar certo): ${error.code} - ${error.message}`);
        } else {
            console.log(`  SUCESSO! O combo é: ${combo}`);
            break;
        }
    }
}

probe();
