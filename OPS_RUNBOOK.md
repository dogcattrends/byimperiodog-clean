**Preflight (pre-deploy) runbook**

Resumo
- Comando: `npm run preflight`
- Objetivo: checar gates antes de deploy (lint, typecheck, test, checks, build) e rodar smoke tests HTTP contra `next start` em porta 3100.

Significado do relatório `reports/preflight-vercel.md`
- GO: todos os passos passaram e os smoke endpoints responderam.
- NO-GO: alguma etapa falhou — o relatório inclui saída de erro e duração.

Como usar
1. Certifique-se de ter as variáveis essenciais em `.env.local`:
 - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
 - `OPENAI_API_KEY` é apenas um aviso se ausente.
2. Rodar localmente:
```bash
npm run preflight
```
3. Ver relatório: `reports/preflight-vercel.md`.

Checklist para Vercel (variáveis de ambiente recomendadas):

- **Supabase:**
 - `NEXT_PUBLIC_SUPABASE_URL`
 - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 - `SUPABASE_SERVICE_ROLE_KEY`

- **Sanity (se usado em produção):**
 - `SANITY_PROJECT_ID`
 - `SANITY_DATASET`
 - `SANITY_API_TOKEN` (se o build precisa acessar o Studio/API privada)

- **OpenAI / AI providers:**
 - `OPENAI_API_KEY` (ou `AI_FALLBACK_API_KEY` / provider-specific keys)

- **Next/Auth / runtime:**
 - `NEXTAUTH_URL` (se aplicável)
 - `NEXTAUTH_SECRET` (se aplicável)
 - `NEXT_PUBLIC_SITE_URL` (útil para sitemaps/SEO)

- **Observabilidade / pixels:**
 - `GA4_ID`, `GTM_ID`, `META_PIXEL_ID` (opcionais conforme uso)

Adicione essas chaves em Settings → Environment Variables do projeto Vercel antes do deploy.

Notas operacionais
- O script detecta automaticamente o gerenciador de pacotes (pnpm/yarn/npm) a partir do lockfile.
- O preflight é intencionalmente um orquestrador: não altera código, só executa scripts existentes e orquestra start+smoke.
- Se um passo falhar, corrija o problema localmente e reexecute.
