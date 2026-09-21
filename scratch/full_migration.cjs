
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fullMigration() {
    console.log('--- Iniciando Migração Completa de Endereços (46k doadores) ---');

    // 1. Carregar o que já existe para evitar redundância (Paginado)
    console.log('Carregando endereços existentes da tabela enderecos_coleta...');
    const existingAddresses = new Set();
    
    let hasMore = true;
    let offset = 0;
    while (hasMore) {
        const { data: existing, error: existErr } = await supabase
            .from('enderecos_coleta')
            .select('logradouro, endereco')
            .range(offset, offset + 999);

        if (existErr) {
            console.error('Erro ao buscar existentes:', existErr);
            break;
        }
        
        existing.forEach(e => {
            const key = `${(e.logradouro || '').trim().toLowerCase()}|${(e.endereco || '').trim().toLowerCase()}`;
            existingAddresses.add(key);
        });

        if (existing.length < 1000) hasMore = false;
        else offset += 1000;
        console.log(`... ${existingAddresses.size} endereços carregados até agora.`);
    }
    console.log(`${existingAddresses.size} endereços base carregados em memória.`);

    // 2. Paginar 47k doadores
    const pageSize = 1000;
    let successCount = 0;
    let skipCount = 0;

    for (let page = 0; page < 48; page++) {
        const start = page * pageSize;
        const end = start + pageSize - 1;
        
        console.log(`Buscando doadores ${start} até ${end}...`);
        const { data: donors, error: donorErr } = await supabase
            .from('doadores')
            .select('logradouro, endereco, cep, bairro, cidade, estado, mapa')
            .range(start, end);

        if (donorErr) {
            console.error('Erro ao buscar doadores:', donorErr);
            continue;
        }

        if (!donors || donors.length === 0) break;

        const batchToInsert = [];
        donors.forEach(d => {
            if (!d.endereco) return;
            
            const log = (d.logradouro || '').trim();
            const endr = (d.endereco || '').trim();
            const key = `${log.toLowerCase()}|${endr.toLowerCase()}`;
            
            if (!existingAddresses.has(key)) {
                batchToInsert.push({
                    logradouro: log,
                    endereco: endr,
                    cep: (d.cep || '').replace(/\D/g, ''),
                    bairro: (d.bairro || '').trim(),
                    cidade: (d.cidade || '').trim(),
                    estado: (d.estado || '').trim(),
                    mapa: (d.mapa || '').trim()
                });
                existingAddresses.add(key);
            } else {
                skipCount++;
            }
        });

        if (batchToInsert.length > 0) {
            // Tentar inserir em lotes menores para maior segurança
            const subSize = 100;
            for (let i = 0; i < batchToInsert.length; i += subSize) {
                const subBatch = batchToInsert.slice(i, i + subSize);
                const { error: insErr } = await supabase.from('enderecos_coleta').insert(subBatch);
                
                if (insErr) {
                    // Se der erro de duplicidade no lote, tenta um a um
                    for (const item of subBatch) {
                        const { error: singleErr } = await supabase.from('enderecos_coleta').insert(item);
                        if (!singleErr) successCount++;
                        else if (singleErr.code === '23505') skipCount++;
                        else console.error('Erro no item:', singleErr.message);
                    }
                } else {
                    successCount += subBatch.length;
                }
            }
        }
        
        console.log(`Progresso: Sucessos: ${successCount} | Ignorados: ${skipCount}`);
    }

    console.log('--- Migração Finalizada ---');
    console.log(`Total Novos: ${successCount}`);
    console.log(`Total Ignorados/Existentes: ${skipCount}`);
}

fullMigration();
