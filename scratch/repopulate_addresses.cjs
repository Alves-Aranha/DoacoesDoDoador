
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function repopulate() {
    console.log('--- Iniciando Repopulação de Endereços ---');
    
    // 1. Buscar todos os doadores
    const { data: doadores, error: fetchError } = await supabase
        .from('doadores')
        .select('logradouro, endereco, cep, bairro, cidade, estado, mapa');

    if (fetchError) {
        console.error('Erro ao buscar doadores:', fetchError);
        return;
    }

    console.log(`Encontrados ${doadores.length} doadores.`);

    // 2. Filtrar e formatar endereços únicos
    const addressMap = new Map();
    
    doadores.forEach(d => {
        if (!d.logradouro || !d.endereco) return;
        
        // Chave única simplificada para bater com o índice do banco
        const street = d.logradouro.trim().toLowerCase();
        const number = d.endereco.trim().toLowerCase();
        const key = `${street}|${number}`;
        
        if (!addressMap.has(key)) {
            addressMap.set(key, {
                logradouro: d.logradouro.trim(),
                endereco: d.endereco.trim(),
                cep: (d.cep || '').trim().replace(/\D/g, ''), // Normalizar CEP
                bairro: (d.bairro || '').trim(),
                cidade: (d.cidade || '').trim(),
                estado: (d.estado || '').trim(),
                mapa: (d.mapa || '').trim()
            });
        }
    });

    const uniqueAddresses = Array.from(addressMap.values());
    console.log(`Total de endereços únicos identificados: ${uniqueAddresses.length}`);

    // 3. Limpar a tabela atual de forma agressiva
    console.log('Limpando tabela enderecos_coleta (Método id is not null)...');
    const { error: deleteError } = await supabase
        .from('enderecos_coleta')
        .delete()
        .not('id', 'is', null); 

    if (deleteError) {
        console.error('Erro ao limpar tabela enderecos_coleta:', deleteError);
    } else {
        console.log('Tabela enderecos_coleta limpa.');
    }

    // 4. Inserir um por um para identificar o problema ou garantir o máximo de sucesso
    let successCount = 0;
    let errorCount = 0;

    console.log(`Iniciando inserção de ${uniqueAddresses.length} registros...`);

    for (const addr of uniqueAddresses) {
        const { error: insertError } = await supabase
            .from('enderecos_coleta')
            .insert(addr);
            
        if (insertError) {
            if (insertError.code === '23505') {
                // Silenciosamente ignorar duplicatas que possam ter restado ou surgido
                errorCount++;
            } else {
                console.error(`Erro crítico no registro ${addr.logradouro} ${addr.endereco}:`, insertError);
                errorCount++;
            }
        } else {
            successCount++;
        }

        if ((successCount + errorCount) % 100 === 0) {
            console.log(`Progresso: ${successCount + errorCount} / ${uniqueAddresses.length}...`);
        }
    }

    console.log(`--- Processo Concluído ---`);
    console.log(`Sucessos: ${successCount}`);
    console.log(`Duplicados/Erros omitidos: ${errorCount}`);

    console.log('--- Processo Concluído com Sucesso ---');
}

repopulate();
