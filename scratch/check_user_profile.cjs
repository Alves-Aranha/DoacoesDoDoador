const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
    const email = 'virgo.aranha@gmail.com';
    console.log(`Verificando perfil para: ${email}`);
    
    const { data, error } = await supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('email', email)
        .maybeSingle();
        
    if (error) {
        console.error('Erro ao buscar perfil:', error);
        return;
    }
    
    if (!data) {
        console.log('Perfil não encontrado para este e-mail.');
        return;
    }
    
    console.log('Dados do Perfil:');
    console.log(JSON.stringify(data, null, 2));
}

checkUser();
