# Sistema de Doações BM

Aplicação web para Cadastro de Doadores e gestão de Doações do Abrigo Bezerra de Menezes.

## Stack

- **Frontend**: React 19 + Vite 7
- **Banco/Dados**: Supabase (Postgres + Supabase Auth)
- **Autenticação**: Supabase Auth (`signInWithPassword`) + tabela `perfis_usuarios`
- **Impressão QZ Tray**: Netlify Function `qz-sign` (assinatura de requisições)
- **Antes era**: backend Express + MySQL — **descontinuado**; o frontend fala 100% com o Supabase

## Funcionalidades

- **Cadastro de Doadores**: formulário com validação, busca de duplicatas por nome e autocomplete inteligente de endereços.
- **Integração ViaCEP**: busca automática de endereço por CEP (fallback quando não está na base local `enderecos_coleta`).
- **Doações**: registro, alteração, baixa em lote, relatórios e gráficos.
- **Impressão**: ficha do doador, etiquetas e comunicados (QZ Tray).
- **Temas**: Claro, Escuro e Sistema.
- **Persistência local**: rascunho de doador, notas por dia.

## Como Rodar Localmente

Pré-requisitos: Node 18+, um projeto Supabase configurado e as env vars.

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis em `.env` (veja `.env.example`):
   ```bash
   VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
   ```

3. Inicie o Vite:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:5173`.

> O login usa **Supabase Auth**: o e-mail/senha precisam ser de uma conta real criada no Supabase
> (usuário vinculado em `perfis_usuarios`). Não existe mais backend local obrigatório.

## Deploy no Netlify

### Opção 1 — Netlify + GitHub (recomendado)

1. Suba o repositório para o GitHub (`git push origin main`).
2. No Netlify: **Add new site → Import from Git → escolha o repositório**.
3. O `netlify.toml` já define build e publish:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions` (usa `qz-sign` automaticamente)
4. Configure as **Environment Variables** no Netlify (Site settings → Environment variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `QZ_PRIVATE_KEY` (chave privada PEM usada para assinar requisições do QZ Tray; a build remove o `public/qz/private-key.pem` por segurança)
5. Deploy. A cada `git push` no GitHub o Netlify reconstroi automaticamente.

### Opção 2 — Upload manual da pasta `dist`

Não é preciso baixar arquivos um a um do GitHub. No seu computador:

```bash
npm install
npm run build
```

O build gera a pasta **`dist/`** — arraste o conteúdo dessa pasta no Netlify
(**Deploy manually → Drag and drop**). Depois reaplique as variáveis de ambiente acima
e a Function `qz-sign` (requer deploy via Git, pois arrastar `dist` não publica Functions).

## Arquivos essenciais do repositório

Estes são os arquivos de configuração (todos já versionados no Git):

| Arquivo | Finalidade |
| --- | --- |
| `netlify.toml` | Configura build, publish, functions e redirects no Netlify |
| `public/_redirects` | Fallback SPA (qualquer rota → `index.html`) |
| `netlify/functions/qz-sign.js` | Netlify Function para assinatura QZ Tray |
| `vite.config.js` | Configuração do Vite (proxy/alias) |
| `package.json` / `package-lock.json` | Dependências e scripts |
| `.env.example` | Modelo das variáveis de ambiente (o `.env` real **não** é versionado) |
| `index.html` | HTML raiz |
| `src/**` | Código-fonte da aplicação |

> `.env` e `public/qz/private-key.pem` são ignorados pelo Git por segurança —
> configure os valores no painel do Netlify, nunca no repositório.
