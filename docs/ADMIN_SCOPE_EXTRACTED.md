# Admin Scope Extracted

## App Router — rotas públicas (indexáveis)
- **`/` (app/page.tsx)** — landing hero com CTA para filhotes/guia, trust block e destaques de valores; centraliza narrativa premium. **Risco:** hero pesado, dependência de imagens grandes e interações JS no client. **Oportunidade:** reforçar conversão e SEO com conteúdo dinâmico de acordo com o funil.
- **`/filhotes` (app/filhotes/page.tsx)** — catálogo de card grid que abre modal de contato (modal em `src/components/PuppyDetailsModal.tsx`). **Risco:** modal client-dependent e dados sensíveis em request; acessibilidade deve manter foco/ESC. **Oportunidade:** medir CTA “Quero esse filhote” e expandir trust block dentro da mesma página.
- **`/guia` (app/guia/page.tsx)** — landing do lead magnet com formulário que chama `/api/leads`, gera tokens (`lead_download_tokens`) e conclui com `/download/guia?token=`. **Risco:** tokens expiram e precisam ser conciliados no admin; formulário precisa LGPD. **Oportunidade:** reorganizar funil e tracking `lead_submit`, `pdf_downloaded`.
- **`/blog` e `/blog/[slug]`** — listagem e artigo editorial consumindo Sanity (via `src/lib/sanity/client.ts`). **Risco:** cache/ISR/preview (preview mode admin) e leitura de drafts; OG/JSON-LD precisam de helpers (`src/lib/jsonld.ts`, `src/lib/seo.ts`). **Oportunidade:** reforçar TL;DR, TOC, entradas de AI e interlink hub-and-spoke.
- **Outras rotas públicas** — `/contato`, `/sobre`, `/faq-do-tutor`, `/autores/[slug]`, `/topico/[slug]`, `/guia`, `/reserve-seu-filhote`, `/sitemap.xml`, `/og/**/*`. Cada uma traz CTA contextual; manter foco no fluxo de conversão (ex: `Botões PrimaryCTA` centralizados).

## App Router — rotas admin (protegidas e noindex)
- **`/admin/dashboard`** (`app/(admin)/admin/(protected)/dashboard/page.tsx`): painel com IA (AIInsightsPanel) e alertas operacionais (`OperationalAlertsPanel`). **Risco:** dependência de `supabaseAdmin` e tokens; falha no fetch trava visualização. **Oportunidade:** adicionar health checks/alerts de integridade (Sanity/Supabase/OpenAI/webhooks).
- **`/admin/filter`**?? (maybe use analogies). 
- **`/admin/filhotes`, `/admin/leads`, `/admin/analytics`, `/admin/config`, `/admin/seo`, `/admin/tracking`, `/admin/webhooks`, `/admin/content`** — blocos modulares com UI (Board, CRM, SettingsForm). **Risco:** duplicação de filtros/CTA se não usar componentes compartilhados (PrimaryCTA, ContactCTA, TrustBlock). **Oportunidade:** consolidar modais CTA e formularios com padrão acessível e RBAC.

## API endpoints (públicos vs admin)
- **`/api/leads`** (`app/api/leads/route.ts`) — grava leads no Supabase com autenticação implícita, rate limit e consentimento LGPD. Público. **Risco:** spam sem CAPTCHAs; rate limit em memória pode ser reinventado. **Oportunidade:** ligar com `lead_events` e tokens de PDF; logar ações em `admin_actions`.
- **`/api/analytics`** (`app/api/analytics/route.ts`) — registra eventos (name, value, meta) e responde 202 se tabela ausente/stub. Público (tracking client). **Risco:** latência supabase; deve ser resiliente. **Oportunidade:** usar para relatórios em tempo real e health check (GET com token).
- **`/api/admin/*`** — rotas protegidas (cms, SEO, tracking, webhooks, IA). Exemplos: `app/api/admin/settings/route.ts`, `app/api/admin/blog/*`, `app/api/admin/tracking-settings/route.ts`, `app/api/admin/webhooks/route.ts`. **Risco:** se `SUPABASE_SERVICE_ROLE_KEY` vazar, compromete admin. **Oportunidade:** RBAC via `src/lib/rbac.ts` e `logAdminAction`.
- **`/api/ai/*`** — IA (e.g., `app/api/ai/recommend`, `app/api/ai/seo`, `app/api/blog/generate`). **Risco:** dependem de `OPENAI_API_KEY`; fallback lexical necessário. **Oportunidade:** integrar com painel IA e máquinas de reprocessamento (scripts, queue).
- **`/api/admin/webhooks`**, `/api/blog/comments`, `/api/debug`, `/api/contract`, `/api/integrations/*` — endpoints adicionais. **Risco:** exposição interna se `requireAdmin` falhar. **Oportunidade:** consolidar logs e auditoria.

## Tabelas Supabase (schemas/migrations/policies)
- **`leads`** (`sql/leads.sql`, `src/types/supabase.ts`): funil LGPD com campos de contexto, status e utms. **Risco:** RLS vazio, dados sensíveis; `app/api/leads` precisa assegurar `consent_lgpd`. **Oportunidade:** adicionar tokens de download, metadata de IA, e pipeline de reanálise.
- **`analytics_events`** (`sql/analytics_events.sql`): eventos custom (page_view, cta_click, generate_lead). Policy `service_role` insert only. **Risco:** sem RLS, qualquer service_role escreve; degrade se tabela absent. **Oportunidade:** dashboards analytics + CI health check GET.
- **`tracking_settings`** (`sql/tracking_settings.sql`): IDs de pixel por ambiente e auditoria log. **Risco:** IDs expostos; RLS habilita. **Oportunidade:** UI `/admin/tracking` e forms `TrackingSettingsPage` com diagnostico e health/checks.
- **`site_settings`/`admin_config`** (`sql/site_settings.sql`, `sql/admin_config.sql`): branding, mensagens, tokens CAPI. **Risco:** tokens no client; only server writes. **Oportunidade:** centralizar `ConfigTabs` com logs.
- **`ai_generation_sessions`, `ai_tasks`** (`sql/blog_ai_infra.sql`, `sql/ai_core.sql`): pipeline de IA. **Risco:** se tasks corrompidas, insights travam. **Oportunidade:** expor health/timeouts no dashboard, reprocessar via `createSessionWithTasks`.
- **`blog_posts`, `blog_authors`, `blog_tags`, `blog_post_schedule_events`, `blog_post_versions`, `media_assets`, `post_media`**: históricos e compatibilidade com scripts de `app/api/blog/*`. **Risco:** duplicação com Sanity; `content_mdx` obsoleto. **Oportunidade:** migrar metadata e usar `RelatedLinks`.
- **`admin_actions`, `webhooks`, `webhook_deliveries`**: logs e auditoria (routes + dispatcher). **Risco:** logs não indexados; mitigação com index e dashboards.

## Integrações
- **Sanity** (`studio/schemas/*.ts`, `src/lib/sanity/*`): CMS editorial com TL;DR, keyTakeaways, FAQ, authors. **Risco:** falta de validação de termos proibidos; vali `<banned>` terms. **Oportunidade:** integrar campo `lastReviewed` ao painel e mostrar status no admin (quality gate).
- **OpenAI** (`app/api/ai/*`, `scripts/ai-tasks-worker.mjs`, `app/api/blog/generate`): geração de conteúdo, SEO, recomendações. **Risco:** token exposto; fallback lexical. **Oportunidade:** criar health check no dashboard e fila de reanalise (P2).
- **Tracking/pixels** (`src/lib/tracking.ts`, `src/lib/pixels.ts`, `app/(admin)/admin/(protected)/tracking/*`, `app/api/admin/settings/pixels/route.ts`): resolvem IDs, dados, toggles. **Risco:** IDs invalidos quebram analytics; quick win validar com diagnósticos e logs. **Oportunidade:** adicionar observabilidade (metrics, warnings) e health check.
- **Webhooks** (`src/lib/webhooks/dispatcher.ts`, `app/api/admin/webhooks/route.ts`): dispara lead_form_submit, whatsapp_click, puppy_reservation. **Risco:** falha de destino ou secret duplicado; `error_count` suspende. **Oportunidade:** painel com status, retries e logs (webhook_deliveries).

## Jobs/workers/scripts
- **`scripts/seo-audit.ts`** (npm run seo:audit): valida SEO (canonical/OG/JSON-LD) e populates `reports`. Chamado em `.github/workflows/seo-audit.yml`. **Risco:** não bloquear merges, exige inspeção manual. **Oportunidade:** alertas automáticos no admin (SEO hub).
- **`scripts/ai-tasks-worker.mjs`**: executa IA tasks (outline/draft/optimize/assets). **Risco:** falha OpenAI; tasks travam. **Oportunidade:** criar health indicator e reprocessamento via admin.
- **`scripts/a11y-contrast.mjs`, `scripts/check-banned-words.mjs`, `scripts/check-encoding.mjs`, `scripts/verify-cache-headers.mjs`**: QA antes de releases. **Risco:** inertia (non-blocking). **Oportunidade:** integrar com pipelines e documentar no runbook.
- **Workflows** (`.github/workflows/ci-debug.yml`, `deploy-vercel.yml`, `seo-audit.yml`): garantem build, SEO audit e deploy; logs em `contentlayer.log`, `build.log`. **Risco:** falha de lint/ts/test travam release. **Oportunidade:** adicionar artefatos de health e status no admin.

## Funil e eventos
- **Eventos base** (`src/lib/track.ts`, `src/lib/events.ts`): `page_view`, `cta_click`, `generate_lead`, `whatsapp_click`, `newsletter_subscribe`, `share`, `lead_form_submit`, `view_item`. **Onde disparados:** `PrimaryCTA`, `ContactCTA`, modals, formulários (`LeadForm`, `Guia`). **Risco:** dependente de consentimento (`getCurrentConsent`), 0/1 logic. **Oportunidade:** usar metadata (location/device) e exibir no admin relatórios de conversão.
- **Eventos admin**: `logAdminAction` (src/lib/adminAuth), `admin_actions` table, `TrackingSettingsForm` logs. **Risco:** se falha supabase, cadeias de auditoria sumirão. **Oportunidade:** planejar health check (e.g., contar eventos por minuto).

## Fontes de verdade
- **Sanity Studio** (`studio/schemas` + `src/lib/sanity/client.ts`): dados editoriais (posts, autores, categorias). **Risco:** previews dependem de webhook e `preview` tokens. **Oportunidade:** status editorial no admin e quality gates (author, tldr).
- **Supabase (leads, analytics, tracking, IA)** (`src/lib/supabaseAdmin.ts`, `src/types/supabase.ts`, `sql/*.sql`): storage de eventos e estado. **Risco:** service role required. **Oportunidade:** dashboards de funil/health, RLS reforçada.
- **Helpers únicos** (`src/components/ui/PrimaryCTA.tsx`, `ContactCTA.tsx`, `TrustBlock.tsx`, `jsonld.ts`, `tracking.ts`, `events.ts`): centralizam CTA, tracking, SEO. **Risco:** duplicação se reimplementados. **Oportunidade:** destacar no blueprint e reusar no refactor.
