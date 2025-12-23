# Escopo completo do produto

## Visão geral
- Plataforma Next.js 14 _App Router_ que posiciona a criação By Império Dog como marketplace editorial premium. O front público (home, blog, guia, catálogo de filhotes) é servido com Server Components, ISR e componentes mínimos de cliente; os dados narrativos vivem no Sanity (schema `studio/schemas/post.ts`) e na pipeline Contentlayer (`src/lib/content.ts`), enquanto o Supabase guarda eventos, leads e metas de tracking (`src/types/supabase.ts`).
- O admin (`app/(admin)/admin/(protected)/*`) orquestra conteúdo, leads, métricas e integrações com AI sem expor o CMS ou duplicar body de post: todos os artigos seguem validações (title/description/tldr/faq/author obrigatórios) e as ferramentas de IA (`src/lib/ai/*`, `scripts/ai-tasks-worker.mjs`) só escrevem metadados/análises em Supabase.
- Telemetria e funil são tratados por um “single source” de tracking (`src/lib/track.ts` + `app/api/tracking/settings/route.ts` + `scripts/seo-audit.ts`), mantendo rastro de eventos `cta_click`, `modal_open`, `lead_submit`, `pdf_download` e `page_view` conforme consentimento do usuário. CTA/Contato seguem componentes únicos (`src/components/ui/PrimaryCTA.tsx`, `src/components/ui/ContactCTA.tsx`, `src/components/ui/AccessibleModal.tsx`) para foco, estilo e métricas consistentes.

## Experiência pública
- **Home page (`app/page.tsx`)**: hero focado em confiança, CTAs únicos para catálogo e guia, TrustBlock compartilhado e catalog premium lazy (`src/components/PuppiesGridPremium.tsx`), tudo com zero scripts extras.
- **Filhotes (`app/filhotes/…`)**: listagem personalizada (Suítes de IA `src/lib/ai/catalog-ranking.ts`) com CTA único “Quero esse filhote” abrindo modal acessível lazy que mostra ficha, TrustBlock e ContactCTA com tracking; filtros/ordenadores mantêm cache e `aria-live`.
- **Blog (`app/blog/page.tsx`, `app/blog/[slug]/page.tsx`)**: conteúdo editorial people-first (Sanity/Contentlayer), TL;DR/Key Takeaways/TOC, schema JSON-LD, breadcrumb, FAQ condicionado e CTA para filhotes/guia perto do conteúdo. Fallback para Contentlayer se Supabase indisponível.
- **Guia (`app/guia/page.tsx`)**: lead magnet com formulário mínimo (nome, WhatsApp, email opcional, consentimento) e fluxo de confirmação + download do PDF (`public/guia.pdf`) via API de leads; validações com `aria-describedby`.
- **Páginas de apoio**: `/contato`, `/sobre`, `/faq-do-tutor`, `/reserve-seu-filhote`, `/web-stories`, `/autores`, `/topico` e outras rotas de marketing entregam mensagens coerentes com a marca e CTAs direcionadas para filhotes ou guia, sem carregar scripts pesados.

## Admin e AI
- **Admin protegido**: dashboards e módulos em `app/(admin)/admin/(protected)` (conteúdo, leads, tracking, anúncios, experimentos, webhooks, SEO) com RBAC a ser detalhado, preview mode do Sanity e logs centralizados (`src/lib/logger.ts`).
- **IA + automações**: `ai_tasks`/`ai_generation_sessions` do Supabase (`src/types/supabase.ts`) alimentam heurísticas de conteúdo, QA e ranking; scripts (`scripts/ai-tasks-worker.mjs`, `scripts/auto-sales-worker.ts`) processam filas e atualizam Supabase com resultados sem publicar automaticamente.
- **Tracking e pixel settings**: `app/api/tracking/settings/route.ts` lê `tracking_settings` e controla pixels GA/FB/TT/PIN, enquanto o front usa `track.event` para enviar eventos centralizados e o fabo `TrackingScripts.tsx` adiciona scripts condicionalmente.

## Dados e restrições
- **Dados proibidos**: o corpo completo da publicação (conteúdo MDX/Sanity) permanece apenas no Sanity/Contentlayer; o Supabase armazena apenas metadados, leads, eventos e tokens (p.ex. `leads`, `analytics_events`, `tracking_settings`), evitando duplicação editorial.
- **Performance**: modais client-only (`dynamic` + `AccessibleModal`), CTAs reuse, filtros com `useTransition`, e blocos pesados (carrossel, TrustBlock) renderizam sem JS extra. QA automatizado (Playwright + Axe, scripts SEO/perf) bloqueia regressões.
- **Compliance**: validações front/backend (imbuído no CMS, API `/api/leads`) e tracking respeitam consentimento + tokens LGPD; logs de acesso e erros vão para `supabase.auth.audit_log_entries` e `reports`.

## Pontos críticos
- Dependências críticas: Sanity Studio, Supabase anon/admin, OpenAI (via env `NEXT_PUBLIC_OPENAI_KEY`), Firebase/GA/FB pixels (via `tracking_settings`), Framer Motion (modal, grid) e `lucide-react`/`next/image`.
- Componentes compartilhados: `PrimaryCTA`, `ContactCTA`, `TrustBlock`, `ContentTOC`, `RelatedLinks`, `AccessibleModal`, `Toast`/`Skeleton`, `Track` helper. Evite duplicar estilos ou lógica nesses arquivos já consolidados.
- Riscos identificados: landing sem CTA claro, modal sem foco, CMS com termos banidos (ver `studio/schemas/post.ts`), leads duplicados se rate limit quebrado, SEO/performance se `seo-audit`/`perf` falharem.
