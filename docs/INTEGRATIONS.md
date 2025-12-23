# Integracoes

## Sanity
- `studio/schemas/post.ts` define o modelo editorial com campos obrigatorios: title, slug, description, publishedAt, content e os dois novos blocos (tldr, keyTakeaways, faq, sources, author obrigatorio, lastReviewedAt e reviewedBy). O schema valida unicidade e chama `process.env.BANNED_TERMS` para rejeitar termos proibidos.
- `studio/schemas/author.ts` garante pagina de autor com slug unico, bio, experiencia e links sociais. Nao existem campos que dupliquem o corpo do post.
- O fluxo de publicacao passa por Studio + webhooks (veja `src/lib/webhooks/dispatcher.ts`) e nao por duplicacao no Supabase.

## Supabase
- `src/lib/supabaseAdmin.ts` e `src/lib/supabasePublic.ts` instanciam o client com stub quando falta a variavel de ambiente. Use `supabaseAdmin()` para writes administrativos e `supabasePublic()` para leituras leve.
- Tabelas principais: `leads` (LGPD, status e contextos), `analytics_events` (eventos com campos padrao), `tracking_settings`, `site_settings`, `admin_config`, `admin_actions` e toda a infraestrutura de IA (`ai_generation_sessions`, `ai_tasks`, `blog_post_versions`, `media_assets`, `post_media`, `blog_post_schedule_events`, `blog_coverage_history`).
- `sql/*.sql` descrevem a estrutura, indices e policies de RLS (por exemplo `sql/analytics_events.sql` habilita RLS e so permite inserts via service role).
- `app/api/admin/settings/route.ts`, `app/api/tracking/settings/route.ts` e `ConfigTabs` usam `supabaseAdmin()` para gerenciar configs de pixels, dominio e textos padrao com logging via `logAdminAction`.

## OpenAI e IA
- `app/api/blog/generate/route.ts`, `app/api/admin/blog/ai/generate-post/route.ts`, `app/api/admin/blog/ai/write/route.ts`, `app/api/admin/blog/seo-suggestions/route.ts`, `app/api/admin/blog/translate/route.ts` usam a chave `OPENAI_API_KEY` quando presente. O fallback retorna erros sensatos e as rotas exigem `x-admin-token`.
- `scripts/ai-tasks-worker.mjs` coordena `ai_tasks` e chama a API do OpenAI (ou ignora se a chave faltar) para gerar outline, draft, otimizar SEO e criar prompts de imagem. Resultados gravam em `ai_tasks.result`.
- `src/lib/aiPipeline.ts` e `src/lib/aiTasks.ts` expõem funcoes para criar sessoes e recomputar progresso.
- `app/api/qa/route.ts` usa `src/lib/rag.ts` para RAG com embeddings (OpenAI quando disponivel, fallback lexical caso contrario).

## Tracking e pixels
- `src/lib/tracking.ts` resolve IDs de GTM, GA4, Meta, TikTok, Pinterest, Hotjar, Clarity e usa `shouldLoadImmediate` para saber se ja carrega scripts antes do consentimento. `pixels_settings` e `site_settings` mantem dados por ambiente.
- `src/lib/events.ts` dispara eventos apenas com consentimento e faz gtag/fbq/ttq. Use `track.event()` (`src/lib/track.ts`) para registrar `page_view`, `cta_click`, `generate_lead` e experimentos; os dados vao para `/api/analytics`.
- `/app/api/analytics/route.ts` salva hits em `analytics_events` e responde 202 em caso de stub, rede ou tabela ausente. O GET exige `x-admin-token` e agrega os eventos recentes.
- `/app/(admin)/admin/(protected)/tracking` e `/app/(admin)/admin/(protected)/config/tracking` fornecem UI para revisar/validar IDs, testar config e salvar por ambiente.

## Webhooks
- `src/lib/webhooks/dispatcher.ts` dispara `dispatchWebhookEvent` para webhooks ativos e registra entregas em `webhook_deliveries`, desabilitando webhooks com muitas falhas.
- `/app/api/admin/webhooks/route.ts` oferece CRUD básico (lista, cria) protegido por `requireAdmin`. A UI em `/app/(admin)/admin/(protected)/webhooks` permite criar, testar e apagar webhooks.
- Exemplos concretos de uso: `notifyLeadFormSubmit`, `notifyPuppyReservation`, `notifyWhatsAppClick` em `src/lib/webhooks/dispatcher.ts`.

## SEO e auditoria
- `/app/(admin)/admin/(protected)/seo/page.tsx` centraliza auditoria, sitemap, robots e redirects. Consome APIs em `app/api/admin/seo/*`.
- `scripts/seo-audit.ts` gera metricas e eh executado em `npm run seo:audit`, chamado pelo workflow `.github/workflows/seo-audit.yml`.
- `reports/lighthouse-*` e `reports/optimization-summary.md` documentam metricas de performance para referencia nos dashboards.

## QA e operacoes
- Scripts como `scripts/a11y-contrast.mjs`, `scripts/check-banned-words.mjs`, `scripts/check-encoding.mjs` e `scripts/verify-cache-headers.mjs` servem de gate antes do build.
- Workflows `.github/workflows/ci-debug.yml` e `deploy-vercel.yml` executam `npm run build`, `contentlayer build` e registram logs (`contentlayer.log`, `build.log`) como artefatos.
