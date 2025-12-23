# Admin Blueprint

## IA de navegação do admin
A navegação espinha dorsal (`app/(admin)/admin/(protected)/AdminNav.tsx`) expõe cinco módulos principais no menu lateral; os painéis devem ser apresentados na ordem de impacto:  
1. **Dashboard & Insights** (`dashboard/`): painel operativo, alertas e IA.  
2. **Conteúdo & IA** (`content/`, `blog/`, `AIInsightsPanel`, `scripts/ai-tasks-worker.mjs`): editor, calendário e geração/revisão assistida.  
3. **Filhotes / Estoque** (`puppies/`): inventário, modal acessível, CTA de conversão.  
4. **Leads & Funil** (`leads/`, `LeadsCRM.tsx`, `LeadDetailClient.tsx`): CRM, filtros, reanálise IA e lead magnet.  
5. **Tracking & Analytics** (`analytics/`, `tracking/`, `config/tracking`): eventos, diagnósticos, pixels e health checks.  
6. **SEO Hub** (`seo/page.tsx`, `app/api/admin/seo/*`): auditoria, redirects, robots e sitemaps.  
7. **Configurações & Integrações** (`config/`, `settings`, `tracking/settings`, `pixels`, `site_settings`): branding, textos, IDs e webhooks.  
8. **Logs, Auditoria & Experimentos** (`admin/actions`, `webhooks/`, `experiments/`, `tracking_*`): monitoração de eventos, health da IA e filas.  
9. **Usuários & Permissões** (global via `src/lib/rbac.ts`, `adminAuth`): guardas e roles.

Cada módulo deve expor subtelas (ex: `blog/editor`, `blog/calendar`, `puppies/edit/[id]`, `leads/[id]`, `config/tracking`), sempre com “skip” para o próximo passo e states (loading/error) consistentes.

## RBAC (roles + permissões)
- **Owner (super-admin):** full access (`dashboard:read`, `blog:read/write`, `cadastros:read/write`, `media:write`, `settings:write`).  
- **Admin editorial:** dashboard, conteúdo/IA/SEO, sem acesso a tracking/pixels (`blog:read/write`, `dashboard:read`, `settings:write`).  
- **Ops (leads + estoque):** filhotes, leads, analytics (`cadastros:read/write`, `dashboard:read`, `blog:read`).  
- **Marketing/Analytics:** analytics, tracking, SEO (`dashboard:read`, `tracking`, `settings:write`, `seo`).  
- **Readonly:** visualização de dashboard/analytics/evidências sem ação (`dashboard:read`, `blog:read`, `cadastros:read`).  
Permissões baseadas em `ROLE_PERMISSIONS` (`src/lib/rbac.ts`), `requireAdminLayout` e `requireAdminApi` respeitam `ADMIN_ROLE_COOKIE`. `serializeRoleCookie` preenche cookie `admin_role`. Sempre registre `logAdminAction` para updates críticos. Admin deve permanecer `noindex` (metadata `robots: { index: false }`).

## Design de informação — dashboard principal
- **KPIs:** leads por status, conversão (fechado/novo), tempo médio de resposta (de `leads.first_responded_at`), eventos `analytics_events.cta_click`, `ai_generation_sessions` progress, alerts de webhook (erro >=10).  
- **Ações:** refresh IA (`AIInsightsPanel`), reanalisar sessões IA, disparar reprocessamentos de leads ou IA, navegar para módulos (lead detail, filhotes, SEO).  
- **Visualização:** cards com indicadores (status, alerts count), lista de “insights operacionais”, tabela de “health checks” (Supabase, Sanity, OpenAI, Webhooks).  
- **Confiança:** mostre “lastReviewedAt” dos posts, estado de `tracking_settings` e `site_settings` validados.

## Fluxos operacionais
1. **Conteúdo → Publicação:** editor (`blog/editor`) injeta drafts em Sanity; preview mode leva o editor ao endpoint `api/blog/publish` via webhook.  
2. **Publicação → IA:** `aiPipeline.createSessionWithTasks` gera `ai_tasks`; `scripts/ai-tasks-worker.mjs` alimenta `ai_generation_sessions` e `blog_post_versions`.  
3. **IA → SEO:** Insights alimentam `app/api/admin/blog/seo-suggestions` e `scripts/seo-audit.ts`; dashboard mostra `SEO score` e `audit issues`.  
4. **Distribuição → Conversão:** post publicado leva a `/blog/[slug]` com TL;DR, TOC, OG/JSON‑LD (`src/lib/jsonld.ts`), e `related` via `app/api/ai/recommend`.  
5. **Conversão → Leads:** CTAs (`PrimaryCTA`, `ContactCTA`) e forms chamam `/api/leads`; `tracking.ts` dispara `generate_lead`, `cta_click`.  
6. **Leads → Operação:** CRM e lead detail acompanham status e acionam IA reanálises; webhooks (`lead_form_submit`, `whatsapp_click`) disparam integrações.

## Padrões UX/A11y do admin
- **States:** tables com fallback vazio (textos claros) e skeletons (ex: `AIInsightsPanel`), botões `focus-visible` e `aria-live` nos alerts.  
- **Filtros:** reuse os helpers (`parseLeadFilters`, `normalizeLeadStatus`), mantenha selects acessíveis, índices (ex: `tracking` environment).  
- **Modals:** `PuppyDetailsModal` usa `focus trap`, ESC, scroll lock (lazy/dynamic).  
- **Actions:** `PrimaryCTA`, `ContactCTA` centralizam estilização, rastreamento.  
- **Feedback:** toasts (e.g., `TrackingSettingsPage`), `AdminErrorState`.  
- **prefers-reduced-motion:** respeitar `transition` minimal; skeletons substituem animações.

## Observabilidade
- **Logs:** `admin_actions` (via `logAdminAction`), `dev.log`, `dev.err`.  
- **Auditoria:** `admin_actions` table, `tracking_settings` audit log, `webhook_deliveries`. Expor counts no dashboard.  
- **Health checks:** verifique `analytics_events` (GET), `tracking_settings` (diagnóstico), `ai_tasks` progress, `webhooks` error count >=10.  
- **Integrations:** monitorar Sanity (webhook success/failure), Supabase (service role), OpenAI (workers), webhooks. Use `OperationalAlertsPanel` para alertar falhas.

## Roadmap (3 fases)
- **Fase 1 – Sem risco:** reorganizar UI/IA, modularizar dashboards (Dashboard + Leads + Tracking) usando componentes compartilhados, adicionar health check cards para `analytics_events`, `tracking_settings` e `ai_tasks`.  
- **Fase 2 – Médio risco:** automações (reanálise IA, fila de download de PDF), dashboards de funil (leads por status, CTA `cta_click`), expandir health check com alerts de Sanity/WEBHOOKS, integrar `lead_download_tokens` + `tracking` events.  
- **Fase 3 – Alto nível:** experimentos (A/B via `src/lib/experiments.ts`/`Analytics`), segmentação (scoreboard de authors/tópicos), quality gates editoriais (vali `lastReviewedAt`, `keyTakeaways`), automatizar QA (scripts run via pipeline) e “quality gate” no CI (falhar se `seo-audit` ou `a11y-contrast` detecta issues).

## Observações finais
Mantém o admin noindex, protegido por cookies/token e feature flags (`NEXT_PUBLIC_ADMIN_OPEN`). Reaproveite componentes `PrimaryCTA`, `ContactCTA`, `TrustBlock`, `Track` e helpers centralizados para evitar duplicação enquanto evolui a arquitetura modular descrita.
