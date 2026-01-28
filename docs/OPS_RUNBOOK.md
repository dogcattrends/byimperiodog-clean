# Runbook de Operacoes

## Visao geral
Operacoes de By Imperio Dog combinam scripts locais (`scripts/*`), workflows em `.github/workflows` e dashboards (`reports/*`). O objetivo e garantir disponibilidade do painel admin, confiabilidade do funnel e qualidade SEO/performance.

## Rotinas
- **Diaria**
 - Conferir logs mais recentes dos testes em `reports/build-stats-latest.json` e `contentlayer.log` (gerados pelo workflow `ci-debug.yml`). Compare o tempo de build e falhas em `build.log`.
 - Rodar `npm run seo:audit` localmente se houve atualizacoes de SEO e revisar `reports/optimization-summary.md`.
 - Validar eventos no painel de Analytics (`app/api/analytics/route.ts`) usando `GET /api/analytics?window=24h` com `x-admin-token`. Caso o endpoint retorne stub, confirme se `SUPABASE_SERVICE_ROLE_KEY` esta corretamente definido.
- **Semanal**
 - Executar `npm run check:all` (typecheck + lint + test + check of encoding + banned words) para detectar regressao antes do deploy. Use `reports/lighthouse-mobile.report.json` e `reports/perf-baseline.md` para comparar metricas.
 - Regerar artefatos de `scripts/seo-audit.ts` e `scripts/a11y-contrast.mjs` para manter a base de indicadores.
 - Verificar scripts de IA (`scripts/ai-tasks-worker.mjs` e `scripts/auto-sales-worker.ts`) no status do Supabase (`ai_tasks`, `ai_generation_sessions`).
- **On demand**
 - `npm run seo:audit` antes de pushs de conteudo novo.
 - `scripts/check-banned-words.mjs` e `scripts/check-encoding.mjs` sempre que for mexer em massa nos posts.
 - `scripts/verify-cache-headers.mjs` quando alterar headers de cache ou CDN.

## Workflows e gates
- **`ci-debug.yml`**: roda `npm ci`, `npx contentlayer build`, `npm run build --no-lint`. Logs (`contentlayer.log`, `build.log`) ficam em artefatos e ajudam a diagnosticar regressao.
- **`deploy-vercel.yml`**: prepara o deploy com `npm install`, `scripts/contentlayer-build-wrapper.mjs` e `next build`.
- **`seo-audit.yml`**: dispara `npm run seo:audit` em todos os pushes/PRs (non-blocking). Resultados indicam issues no SEO score.
- **Metas essenciais**: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run seo:audit`. Registrar falhas no GitHub Actions e no `reports` associado.

## Preflight verification
- `npm run preflight` orchestrates env validation, lint, typecheck, test, `seo:audit`, `check:all`, `npm run build` and a smoke test (Next.js start + GET `/`, `/filhotes`, `/blog`, `/guia` when present).
- The command emits a structured report at `reports/preflight-vercel.md` listing per-stage PASS/FAIL/WARN durations, the first useful error, and the final GO/NO-GO verdict.
- GO means all blocking gates succeeded and the smoke checks succeeded; NO-GO means a blocking stage failed and the report explains which stage. Warnings (e.g., missing `OPENAI_API_KEY`) are recorded but do not block.
- After fixing the blocking issue or restoring required env vars, rerun `npm run preflight` and await GO before pushing or deploying.

## Alertas e incidentes
- **Analytics/Tracking**: se `/api/analytics` com `service role` falhar (422, 500 ou network error), o endpoint retorna 202 e escreve `console.error`. Use os logs do worker (ver `dev.log`, `dev.err`) para ver erros repetidos.
- **IA**: `scripts/ai-tasks-worker.mjs` atualiza `ai_tasks`. Quando ocorrerem varios erros, redesigne a secao `AIInsightsPanel` e use `OperationalAlertsPanel` para avisar o time.
- **Webhook entregas**: `webhook_deliveries` registra `status` success/fail e incrementa `error_count` na tabela `webhooks`. Se `error_count >= 10`, a dispatcher desativa o webhook.
- **Admin auth**: `requireAdmin` e `requireAdminLayout` registram eventos via `adminAuthLogger`. Se o painel ficar inacessivel, confirme `NEXT_PUBLIC_ADMIN_PASS`, cookies `adm`/`admin_auth` e `ADMIN_TOKEN`.

## Relatorios e artefatos
- `reports/lighthouse-mobile.report.json` e `.html` documentam performance mobile (gerados por `npm run lh:run` ou `lhci`).
- `reports/optimization-summary.md` resume melhorias (imagem, fonts, bundles).
- `reports/a11y-contrast.md` e `reports/perf-baseline.md` servem de checkpoints sensiveis a debut.
- `reports/build-stats-latest.json` compara tamanho de bundles e pode ser usado por `scripts/diff-build-stats.mjs`.

## Scripts utilitarios
- `scripts/seo-audit.ts`: valida canonical, open graph e JSON-LD para cada post. Roda em CI (seo-audit workflow).
- `scripts/a11y-contrast.mjs`: checa contraste e gera `reports/a11y-contrast.md`.
- `scripts/check-banned-words.mjs` e `scripts/check-encoding.mjs`: guardas extras antes de publicacao.
- `scripts/verify-cache-headers.mjs`: garanta cache busting e `stale-while-revalidate`.

## Checklists do runbook
- **Antes de merge**: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run seo:audit` (local). Confirme que `reports/lighthouse` nao sofreu regressao.
- **Após deploy**: validar `analytics_events` (retorno do GET), checar `tracking_settings` e `site_settings`, revisar `admin_actions` para acoes suspeitas.
- **Monitoramento**: relatórios em `reports/*` e logs em `dev.log` e `watcher` do Supabase (console). Se detectar `DISABLE_ANALYTICS=1`, entenda se foi intentional.
