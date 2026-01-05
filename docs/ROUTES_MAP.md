# Mapas de rotas

## Público indexável (SEO)

| Caminho | Propósito | CTA primário | Dados consumidos | Riscos |
| --- | --- | --- | --- | --- |
| `/` | Landing hero + proof para filhotes premium, trustblock e blog teaser (`app/page.tsx`, `src/components/sections/Hero.tsx`). | `Ver filhotes premium` (PrimaryCTA) levando para `/filhotes`; secundário `Baixar o guia` | Lista rankeada via `src/components/PuppiesGridPremium.tsx` + posts (`sources/contentlayer`) | Canonical, Lighthouse e TrustBlock devem renderizar sem scripts extras; hero CTA mantém funil |
| `/filhotes` | Catálogo premium com filtros, IA ranking (`src/lib/ai/catalog-ranking.ts`), CTA “Quero esse filhote” para modal conectado ao `PuppyDetailsModal`. | `Quero esse filhote` (um botão por card) | Supabase `catalog` + `api/catalog/ranked`; modal lê ficha `supabasePublic` e `ai` badges | Se modal falhar (focus/tracking) quebra funil; filtros não podem carregar JS extra |
| `/blog` | Hub editorial (BlogList) com hero, guias categorizados, CTA para `/filhotes` e `/guia`, schema JSON-LD (`app/blog/page.tsx`). | `Ler artigo completo` + “Guia do Tutor” CTA | Supabase `listPostsWithMeta`, fallback Contentlayer e `listPostsWithMeta`. | Misclassificação de status, canonical, e fallback precisam manter JSON-LD; search precisa accessible message |
| `/blog/[slug]` | Post com TL;DR, TOC, FAQ, JSON-LD (Article/Breadcrumb/FAQ), relacionados por tag (`app/blog/[slug]/page.tsx`). | `Ver filhotes` + `Baixar guia` | Supabase `blog_posts`, `contentlayer` fallback, `relatedPosts`. | Schema, canonical e OG image (dynamic) devem ser absolutos; share/related mantêm performance |
| `/guia` | Lead magnet e formulário acessível (GuiaLeadForm) com tokens (`lead_download_tokens`) e fluxo de download seguro (`app/api/leads` → `/download/guia?token=`). | `Enviar e baixar o guia` | `app/api/leads` (Supabase `leads` + `lead_download_tokens`) | Consentimento obrigatório, rate limit API, novo evento `pdf_downloaded` e tokens expiram |
| `/contato`, `/sobre`, `/faq-do-tutor`, `/reserve-seu-filhote`, `/autores/[slug]`, `/web-stories`, `/topico`, `/preco-spitz-anao` | Conteúdo marketing e confiança, cada um orientado a funil (ex: CTA “Falar agora” p/ WhatsApp) | Depende da página (convidar para WhatsApp, guia ou filhotes) | Conteúdo estático + event tracking leve | CTA duplicados ou scripts extras podem poluir; todas devem manter focus e contrastes |

## Público noindex / utilitários

| Caminho | Propósito | CTA primário | Dados | Riscos |
| --- | --- | --- | --- | --- |
| `/api/og/*`, `/app/og/...` | Geração de OpenGraph dinâmico (`app/og`); não indexável | N/A (meta only) | Consulta a cover images | Cache/imagem quebrada afeta share |
| `/search` | Busca simples (SPA) com formulários e fallback de posts | `Pesquisar` | Local filters (client-only) | Sem canonicalântico, deve retornar 200 e `aria-live` |
| `/download/guia` | Valida tokens emitidos do lead magnet, marca `pdf_downloaded` e redireciona para o PDF versionado (`lead_download_tokens`). | N/A (redirect) | `lead_download_tokens`, `analytics_events` | Tokens inv�lidos/expirados direcionam para `/guia`; consentimento + rate limit no submit |

## Internas / Admin (protected `app/(admin)/*`)

| Caminho | Propósito | CTA primário | Dados | Riscos |
| --- | --- | --- | --- | --- |
| `/admin` + layout (`app/(admin)/admin/(protected)/layout.tsx`) | Hub com nav (Analytics, Content, Leads, Tracking, Settings). | Navegação para cada módulo (Analítica, Filhotes, Leads, etc.) | Supabase admin + Sanity preview | Sem autenticação, admin não abre; log de auditoria crucial |
| `/admin/analytics` | Métricas, experimentos, heatmaps, `reports` (`reports/perf-baseline`, `reports/lighthouse`). | CTAs de Exportar/Refresh | Supabase views, analytics events | Tabela de eventos crescente e possívies loops de tracking |
| `/admin/blog` e `/admin/content` | Operação editorial, preview, IA (Sanity hooks, `app/api/admin/blog/ai`). | `Publicar`, `Revisar`, `Reanalizar` | Sanity posts + metadata (AI analysis stored in Supabase `ai_tasks`) | Alterações fora do CMS (duplicação) ou preview sem autenticação |
| `/admin/leads` | Pipeline de leads + tokens, dashboards de download PDF | `Enviar WhatsApp`, `Exportar CSV` | Supabase `leads`, `tracking_settings`, `analytics_events` | LGPD (consentimento/telefones) e indexação indevida |
| `/admin/tracking` | Ativa/desativa GA/FB/TT/PIN via `tracking_settings` (`src/lib/track`) | `Salvar` | Supabase table + cookies `admin_auth` | Configuração errada bloqueia pixel ou dispara sem consentimento |

## Webhooks / API públicas

| Endpoint | Propósito | CTA primário | Dados | Riscos |
| --- | --- | --- | --- | --- |
| `POST /api/leads` | Recebe leads do guia, catálogo, filtros; rate limit 3/min (`app/api/leads/route.ts`). | N/A (API) | Supabase `leads` + UTMs + headers | Consentimento LGPD; bloqueio por rate limit |
| `GET /api/tracking/settings` | Retorna pixels do usuário admin (`tracking_settings`). | N/A (admin UI) | Supabase | Requisição só com cookie `admin_auth` |
| `/api/admin/blog/preview/[id]` (Sanity preview) | Renderiza rascunho via Sanity + preview token | `Continuar no CMS` | Sanity doc preview | Token leak quebra preview |

## Notas extras
- Rotas `app/(admin)/admin/(protected)/webhooks` e `/api/admin/*` centralizam webhooks de Sanity (preview/publish) e podem ser estendidas para IA e notifications.
- Todo conteúdo público está protegido com canonical absoluto e metadata (ver `app/(admin)/admin/(protected)/seo` para referência).
