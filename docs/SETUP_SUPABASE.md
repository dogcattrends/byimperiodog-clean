# Configurar Supabase local/remote para este projeto

Siga estes passos para habilitar a listagem de `puppies` durante o desenvolvimento local.

1. Copie o arquivo de exemplo e preencha as chaves reais (remote) ou as chaves geradas pelo Supabase CLI (local):

```bash
cp .env.local.example .env.local
# on Windows PowerShell
Copy-Item .env.local.example .env.local
```

2. Edite `.env.local` e substitua as variáveis relevantes:
- `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto (ex.: `https://<project>.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only)

3. Se quiser rodar um Supabase local (opcional):

```bash
npm run supabase:start
# Siga instruções no terminal para obter as keys locais
```

4. Reinicie o servidor de desenvolvimento para que o Next.js leia o novo `.env.local`:

```bash
npm run dev
```

5. Validar via endpoint de diagnóstico (após `npm run dev` estar ativo):

```bash
# mac / linux
curl http://localhost:3000/api/diag/puppies
# Windows PowerShell
Invoke-RestMethod 'http://localhost:3000/api/diag/puppies' | ConvertTo-Json -Depth 5
```

- Se as variáveis estiverem corretas, o endpoint deve retornar `ok: true` e uma amostra (`sample`) de registros.
- Se ainda aparecer vazio, verifique:
  - RLS / policies no Supabase (a migração do projeto adiciona políticas `public_read_puppies` etc.)
  - Se os registros têm `status` igual a `disponivel` ou `reservado` (o catálogo filtra por esses status por padrão)

6. Dicas de debugging:
- Para checar se as variáveis de ambiente estão carregadas no processo Node:
  - `node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"`
- Para inspecionar o banco remoto, use o Dashboard do Supabase (Tables → public → puppies)

7. Segurança
- Nunca compartilhe `SUPABASE_SERVICE_ROLE_KEY` em canais públicos.
- Não faça commit de `.env.local`.

Se quiser, posso (opções):
- A) Reiniciar o servidor dev aqui e testar `api/diag/puppies` (será preciso que `.env.local` esteja preenchido). 
- B) Se você colar as chaves EM MENSAGEM (não recomendado/public), eu posso temporariamente criar `.env.local` e validar a listagem por você.
- C) Ajudar a inspecionar RLS/policies no projeto Supabase (preciso de acesso ao painel).

Diga qual opção prefere e eu executo em seguida.
