# Instruções de desenvolvimento — By Império Dog

Resumo rápido para rodar, aplicar migrations e testar localmente.

1) Instalar dependências

```powershell
npm install
```

2) Gerar assets pré-dev (se preferir manual):

```powershell
node scripts/gen-client-photos.mjs
```

3) Rodar dev (recomendado sem predev automático em Windows se predev bloquear):

```powershell
# Gera assets
node scripts/gen-client-photos.mjs
# Inicia Next
npm run dev
```

4) Aplicar migrations no Supabase

- Se você tem `psql` e `DATABASE_URL` configurado:

```powershell
# a partir do root do repo
.
\scripts\apply-supabase-migrations.ps1
```

- Se você tem `supabase` CLI instalado:

```powershell
.
\scripts\apply-supabase-migrations.ps1
```

- Senão: abra `sql/blog.sql` e `sql/blog_comments.sql` na SQL Editor do Supabase e rode o conteúdo manualmente.

5) Testar endpoints locais

```powershell
# servidor dev rodando em http://localhost:3000
.
\scripts\test-api-endpoints.ps1
```

6) Build produção

```powershell
# limpa .next se necessário
Remove-Item -LiteralPath .next -Recurse -Force -ErrorAction SilentlyContinue
# gerar assets
node scripts/gen-client-photos.mjs
# build
$env:CI='true'; npx cross-env NEXT_DISABLE_VERSION_CHECK=1 NEXT_TELEMETRY_DISABLED=1 next build
```

Se algo falhar, cole a saída do build aqui que eu analiso e corrijo.
