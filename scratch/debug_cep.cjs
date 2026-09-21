
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCep() {
    const cep = '03633000';
    console.log(`Checking CEP: ${cep}`);
    
    const { data: doadores, error: error1 } = await supabase
        .from('doadores')
        .select('*')
        .eq('cep', cep);
        
    console.log('--- Results from doadores ---');
    console.log(JSON.stringify(doadores, null, 2));

    const { data: enderecos, error: error2 } = await supabase
        .from('enderecos_coleta')
        .select('*')
        .eq('cep', cep);

    console.log('--- Results from enderecos_coleta ---');
    console.log(JSON.stringify(enderecos, null, 2));
}

checkCep();
