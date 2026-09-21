
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDb() {
    try {
        const { count: doadoresCount, error: dErr } = await supabase.from('doadores').select('*', { count: 'exact', head: true });
        const { count: doacoesCount, error: dcErr } = await supabase.from('doacoes').select('*', { count: 'exact', head: true });
        
        console.log('--- Database Check ---');
        console.log('Doadores count:', doadoresCount);
        if (dErr) console.error('Doadores error:', dErr);
        
        console.log('Doacoes count:', doacoesCount);
        if (dcErr) console.error('Doacoes error:', dcErr);

        const { data: sample, error: sErr } = await supabase.from('doadores').select('*').limit(1);
        console.log('Sample donor:', sample ? sample[0]?.nome : 'NONE');
        if (sErr) console.error('Sample error:', sErr);
        console.log('----------------------');

    } catch (err) {
        console.error('Fatal:', err);
    }
}

checkDb();
