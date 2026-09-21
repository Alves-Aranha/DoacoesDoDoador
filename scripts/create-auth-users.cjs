const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function readEnvVar(name, fallbackFile = '.env') {
  if (process.env[name]) return process.env[name];

  const envPath = path.resolve(__dirname, '..', fallbackFile);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(new RegExp(`^${name}\\s*=\\s*(.+)$`, 'm'));
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

async function main() {
  const supabaseUrl = readEnvVar('SUPABASE_URL') || readEnvVar('VITE_SUPABASE_URL');
  const serviceRoleKey = readEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  const tempPassword = readEnvVar('TEMP_PASSWORD') || 'Mudar@123';

  if (!supabaseUrl) {
    console.error('ERRO: SUPABASE_URL não encontrado (env ou .env).');
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrado.');
    console.error('Adicione no .env: SUPABASE_SERVICE_ROLE_KEY=<service_role do projeto NOVO>');
    console.error('E obtenha a chave em Supabase Dashboard -> Settings -> API -> service_role.');
    process.exit(1);
  }

  console.log(`Projeto: ${supabaseUrl}`);
  console.log(`Senha temporária: ${tempPassword}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let table = 'perfis_usuarios';
  let { data: perfis, error: perfisError } = await supabase
    .from(table)
    .select('email, role, departamento');

  if (perfisError && /schema cache|relation/.test(perfisError.message)) {
    console.log('Tabela ' + table + ' não encontrada; tentando perfis_usuario...');
    table = 'perfis_usuario';
    const fallback = await supabase.from(table).select('email, role, departamento');
    perfis = fallback.data;
    perfisError = fallback.error;
  }

  if (perfisError) {
    console.error('ERRO ao consultar ' + table + ':', perfisError.message);
    process.exit(1);
  }

  if (!perfis || perfis.length === 0) {
    console.log('Nenhum e-mail encontrado em perfis_usuarios.');
    process.exit(0);
  }

  console.log(`${perfis.length} e-mail(s) em ${table}.`);

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('ERRO ao listar usuários do Auth:', listError.message);
    process.exit(1);
  }

  let existingCount = 0;
  let createdCount = 0;
  let failed = [];

  for (const perfil of perfis) {
    const email = (perfil.email || '').trim().toLowerCase();
    if (!email) {
      console.log('  (pulando perfil sem e-mail)');
      continue;
    }

    const exists = (list?.users || []).some((u) => (u.email || '').toLowerCase() === email);

    if (exists) {
      existingCount++;
      console.log(`  OK (já existe): ${email}`);
      continue;
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError) {
      failed.push({ email, error: createError.message });
      console.log(`  FALHOU: ${email} -> ${createError.message}`);
    } else {
      createdCount++;
      console.log(`  CRIADO: ${email} (role: ${perfil.role}, depto: ${perfil.departamento})`);
    }
  }

  console.log(`\n=== Resumo ===`);
  console.log(`Total em ${table}: ${perfis.length}`);
  console.log(`Já existiam: ${existingCount}`);
  console.log(`Criados: ${createdCount}`);
  if (failed.length) {
    console.log(`Falhas: ${failed.length}`);
    for (const f of failed) console.log(`  - ${f.email}: ${f.error}`);
  }
  console.log(`\nSenha temporária de todos os usuários: ${tempPassword}`);
  console.log('Oriente os usuários a trocarem a senha (profile no Supabase ou fluxo "esqueci a senha").');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});