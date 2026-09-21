const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnostic() {
    console.log('--- DIAGNÓSTICO DE ACESSO ---');
    
    // 1. Contagem total de perfis
    const { count, error: countErr } = await supabase
        .from('perfis_usuarios')
        .select('*', { count: 'exact', head: true });
    
    console.log(`Total de perfis na tabela: ${count}`);
    if (countErr) console.error('Erro na contagem:', countErr);

    // 2. Verificar se o RLS está de fato bloqueando queries anônimas
    const { data: doadores, error: doadErr } = await supabase
        .from('doadores')
        .select('id')
        .limit(1);
    
    if (doadErr) {
        console.log('RLS está ATIVO (bloqueou leitura de doadores)');
    } else {
        console.log('RLS está DESATIVADO ou PERMISSIVO (leu doadores)');
    }

    // 3. Verificar o seu usuário específico
    const email = 'virgo.aranha@gmail.com';
    const { data: perfil, error: perfErr } = await supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    console.log('Dados do seu perfil:', perfil);
}

diagnostic();
