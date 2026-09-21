
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    try {
        const { data, error } = await supabase.from('doadores').select('*').limit(1);
        if (error) {
            console.error('Error:', error);
            return;
        }
        if (data && data.length > 0) {
            console.log('Columns in doadores:', Object.keys(data[0]));
        } else {
            console.log('No data found in doadores.');
        }

        const { data: d2, error: e2 } = await supabase.from('doacoes').select('*').limit(1);
        if (d2 && d2.length > 0) {
            console.log('Columns in doacoes:', Object.keys(d2[0]));
        }

    } catch (err) {
        console.error('Fatal:', err);
    }
}

checkColumns();
