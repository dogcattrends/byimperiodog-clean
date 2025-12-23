# Admin Refactor Plan

## O que mudar primeiro
1. **Dashboard & health cards** — reorganizar `dashboard/page.tsx` para apresentar KPIs (leads, IA, tracking) e health checks (Supabase, Sanity, OpenAI, webhooks). Reuse `AIInsightsPanel` e `OperationalAlertsPanel`.  
2. **Navegação & layout** — garantir `AdminNav`, `AdminTopbar`, `layout.tsx` e `AdminNav` responsivos; injetar skeletons/states uniformes e assegurar `noindex`.  
3. **Componentes compartilhados** — consolidar `PrimaryCTA`, `ContactCTA`, `TrustBlock`, `Modal`, `ContentTOC`, `RelatedLinks`; garantir que tracking (`track.event`) e consentimento sejam chamados a partir desses componentes.  
4. **Health checks & observabilidade** — adicionar indicadores de `analytics_events` (GET `/api/analytics`), `tracking_settings`, `ai_tasks`, `webhooks.error_count` e log `admin_actions`.

## O que não tocar
- Não reimplemente formulários de lead fora de `PrimaryCTA`/`ContactCTA`.  
- Não expor dados sensíveis (tokens Supabase/OpenAI) no client; siga `supabaseAdmin()` ou `admin` APIs.  
- Não simplifique RBAC: mantenha `src/lib/rbac.ts`/`adminAuth.ts` e retenha `requireAdminLayout`/`requireAdminApi`.  
- Não duplique helpers de SEO/tracking; use `jsonld.ts`, `tracking.ts`, `pixels.ts`.

## Como testar
- `npm run lint` + `npm run typecheck`.  
- `npm run test` (vitest) + `npm run seo:audit`.  
- `npm run seo:audit` deve rodar no CI (workflow `seo-audit.yml`).  
- Validar scripts: `npm run check:encoding`, `npm run check-banned-words`, `node scripts/a11y-contrast.mjs`.  
- Testar endpoints com tokens (`x-admin-pass`) e `GET /api/analytics?window=24h` + `x-admin-token`.  
- Validar modais/CTA com axe + keyboard (playwright smoke) e `reports/lighthouse-*` para não regredir bundle.

## PRs pequenos sugeridos
1. **PR1 — Navegação & layout**: reorganizar `AdminNav`, `AdminTopbar`, `layout.tsx`, adicionar `noindex`, skeletons e `Dialog` mobile.  
2. **PR2 — Dashboard & health**: refatorar `dashboard` para cards de health, KPI, alertas, e `AIInsightsPanel`.  
3. **PR3 — Leads & PDFs**: consolidar CRM, filtros (`parseLeadFilters`), lead detail, pdf download stats e `tracking` events.  
4. **PR4 — Conteúdo & IA**: reorganizar editor/calendário, integrar `aiPipeline`, expor quality gates (author/tldr/reviews).  
5. **PR5 — Tracking & Configurações**: padronizar diagnósticos, `TrackingSettingsPage`, `site_settings`, `pixels`, `webhooks`.

## DoD por PR
- **PR1:** navegação responsiva, menu mobile via `Dialog`, layout usa `Header`/`Main`, `noindex` setado.  
- **PR2:** dashboards usam dados reais (`supabaseAdmin()`), health cards com status, `AIInsightsPanel` e alerts com skeletons.  
- **PR3:** Lead detail mostra logs de eventos (`analytics_events`), CTA de PDF rastreia `pdf_download`, filtros persistem, rate limit respeitado.  
- **PR4:** bloco editorial exibe TL;DR/Key takeaways, IA pipeline visualiza `ai_generation_sessions`, `scripts/seo-audit` detecta missing fields.  
- **PR5:** `tracking` diagnostics valida IDs, `TrackingSettingsForm` salva com toast/log, `webhooks` CRUD seguro, `admin_actions` registra.

## Gaps críticos (P0/P1/P2)
- **P0:** missing health-checks (analytics/tracking/IA) — ex: `getPixelsSettings` falha sem alerta. **Mitigação:** rodar health cards no dashboard.  
- **P1:** reanálises IA e lead magnet PDF sem tokens/observability — expor `lead_download_tokens`, `tracking` events e `AIInsightsPanel` reprocess.  
- **P2:** QA/editorial gates não automatizados (author/tldr/faq) — script `scripts/seo-audit.ts` + `scripts/a11y-contrast` integrados ao blueprint de quality gate.

## Quick wins (sem aumentar bundle público)
1. Reusar `PrimaryCTA`/`ContactCTA` dentro de dashboards e modais para garantir tracking consistente e states visíveis.  
2. Mostrar indicadores de `analytics_events` e `webhook_deliveries` no dashboard (`OperationalAlertsPanel`).  
3. Validar `tracking_settings` com diagnósticos (já presente em `TrackingSettingsPage`) e mostrar badge “Ambiente ativo”.  
4. Exibir `lastReviewedAt` + `reviewedBy` nos cards de conteúdo.
