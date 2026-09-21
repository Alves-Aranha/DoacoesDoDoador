
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probeDonations() {
    console.log('--- Probing donations for donor 46983 ---');
    
    // Test multiple variations
    const codes = ['46983', '046983', 46983, '0046983'];
    
    for (const code of codes) {
        const { data, count, error } = await supabase
            .from('doacoes')
            .select('*', { count: 'exact' })
            .eq('codigo_doador', code);
            
        console.log(`Searching for "${code}"... Found: ${count} records. Error: ${error ? error.message : 'none'}`);
        if(data && data.length > 0) {
            console.log('Sample record sample:', JSON.stringify(data[0], null, 2));
        }
    }
    
    console.log('--- Searching by donor name "MARINA DOS SANTOS" ---');
    const { data: nameData } = await supabase
        .from('doadores')
        .select('codigo_doador, nome')
        .ilike('nome', '%MARINA DOS SANTOS%');
    console.log('Donors found by name:', JSON.stringify(nameData, null, 2));
}

probeDonations();
