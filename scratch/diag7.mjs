import { createClient } from '@supabase/supabase-js';

const url = 'https://mfxgmkjzhoefvihfrsxx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGdta2p6aG9lZnZpaGZyc3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTcxNTEsImV4cCI6MjA4NzI3MzE1MX0.J7ALGDHkpvIR3AD2Te7b0Ve_cuYG_brwMjVpJrW5_DM';

const supabase = createClient(url, key);

async function main() {
  const todayIso = new Date().toLocaleDateString('en-CA');
  const next30 = new Date();
  next30.setDate(next30.getDate() + 30);
  const next30Iso = next30.toISOString().split('T')[0];
  console.log('today:', todayIso, 'next30:', next30Iso);

  const { data: pData } = await supabase
    .from('doacoes')
    .select('data_retirada, remarcado_para, status, doadores(regiao, dia_semana)')
    .or(`data_retirada.gte.${todayIso},remarcado_para.gte.${todayIso}`)
    .neq('status', 'Cancelada')
    .neq('status', 'Baixada');

  console.log('total fetched:', pData?.length);

  const grouped = {};
  (pData || []).forEach(curr => {
    const rawDate = curr.remarcado_para || curr.data_retirada;
    const effectiveDate = rawDate ? String(rawDate).split('T')[0] : '';
    if (!effectiveDate || effectiveDate > next30Iso) return;
    const region = curr.doadores?.regiao || 'Outros';
    const key = `${effectiveDate}_${region}`;
    const diaSemana = (curr.doadores?.dia_semana || '').toLowerCase();
    if (!grouped[key]) {
      grouped[key] = { date: effectiveDate, region, segTerSex: 0, segunda: 0, terca: 0, quarta: 0, quinta: 0, sexta: 0, sabado: 0, unmatched: [] };
    }
    if (diaSemana.includes('seg/ter/sex')) grouped[key].segTerSex++;
    else if (diaSemana.includes('segunda')) grouped[key].segunda++;
    else if (diaSemana.includes('terça') || diaSemana.includes('terca')) grouped[key].terca++;
    else if (diaSemana.includes('quarta')) grouped[key].quarta++;
    else if (diaSemana.includes('quinta')) grouped[key].quinta++;
    else if (diaSemana.includes('sexta')) grouped[key].sexta++;
    else if (diaSemana.includes('sábado') || diaSemana.includes('sabado') || diaSemana === 'sab') grouped[key].sabado++;
    else if (diaSemana === 'seg') grouped[key].segunda++;
    else if (diaSemana === 'ter') grouped[key].terca++;
    else if (diaSemana === 'qua') grouped[key].quarta++;
    else if (diaSemana === 'qui') grouped[key].quinta++;
    else if (diaSemana === 'sex') grouped[key].sexta++;
    else grouped[key].unmatched.push(diaSemana || '(vazio)');
  });

  const rows = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  rows.forEach(r => {
    const counts = [r.segTerSex, r.segunda, r.terca, r.quarta, r.quinta, r.sexta, r.sabado];
    const total = counts.reduce((s, c) => s + c, 0);
    console.log(`${r.date} | ${r.region} | total=${total} | S/T/S=${r.segTerSex} S=${r.segunda} T=${r.terca} Qa=${r.quarta} Qi=${r.quinta} Se=${r.sexta} Sa=${r.sabado} | unmatched=${JSON.stringify(r.unmatched)}`);
  });
}

main();