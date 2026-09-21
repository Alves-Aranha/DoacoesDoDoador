
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    console.log('--- Checking tables and data for donor 46983 ---');
    
    // Check donations
    const { data: donations, error: dErr } = await supabase
        .from('doacoes')
        .select('codigo_doacao, codigo_doador')
        .eq('codigo_doador', 46983);
    console.log('Donations for 46983:', donations);

    // Check items for one of the donations
    if (donations && donations.length > 0) {
        const cod = donations[0].codigo_doacao;
        const { data: items, error: iErr } = await supabase
            .from('itens_doacao')
            .select('*')
            .eq('id_doacao', cod);
        console.log(`Items for donation ${cod}:`, items);
    }
    
    // Check joint query (matches the code version)
    const { data: joint, error: jErr } = await supabase
        .from('doacoes')
        .select('*, doadores(*), itens_doacao(*)')
        .eq('codigo_doador', 46983)
        .limit(1);
    
    if (jErr) console.error('Joint Query Error:', jErr);
    else console.log('Joint Query Success. Donor found in join:', !!joint[0]?.doadores);
}

checkTables();
