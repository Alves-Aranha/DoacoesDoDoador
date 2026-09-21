
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('--- Buscando status das doações ---');
    const { data, error } = await supabase
        .from('doacoes')
        .select('codigo_doacao, status')
        .limit(20);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('Resultados (20 primeiros):');
    data.forEach(d => {
        console.log(`Código: ${d.codigo_doacao} | Status: [${d.status}] (Tipo: ${typeof d.status})`);
    });

    console.log('\n--- Testando Filtro .not("status", "in", ...) ---');
    const { data: filteredNot, error: err3 } = await supabase
        .from('doacoes')
        .select('codigo_doacao, status')
        .not('status', 'in', '("Baixada","Cancelada")');

    if (err3) {
        console.error('Erro no filtro .not:', err3);
    } else {
        console.log(`Encontrados com .not: ${filteredNot.length}`);
        const baixadas = filteredNot.filter(f => f.status === 'Baixada');
        if (baixadas.length > 0) {
            console.log('ALERTA: O filtro .not deixou passar doações "Baixada"!');
        } else {
            console.log('Filtro .not excluiu "Baixada" com sucesso.');
        }
    }
}

check();
