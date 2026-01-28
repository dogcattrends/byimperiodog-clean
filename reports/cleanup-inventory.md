# Fase 1 — Cleanup Inventory

## Integrações ativas
- Sanity: client único em [src/lib/sanity/client.ts](src/lib/sanity/client.ts); blog e autores consumidos via GROQ em [src/lib/sanity/blogRepo.ts](src/lib/sanity/blogRepo.ts).
- Supabase: admins usam service role via [src/lib/supabaseAdmin.ts](src/lib/supabaseAdmin.ts); público/anon via [src/lib/supabaseAnon.ts](src/lib/supabaseAnon.ts) e supabasePublic (referenciado em SEO); consumo para puppies, leads/analytics e overrides de SEO.
- Tracking/Pixels: helper central em [src/lib/track.ts](src/lib/track.ts) enviando GA4/FB/TT/Pinterest; configurações armazenadas em Supabase via [src/lib/tracking/getTrackingConfig.ts](src/lib/tracking/getTrackingConfig.ts).
- OpenAI/IA: documentação em README-openai; automações/SEO em [src/lib/ai/autopilot-seo.ts](src/lib/ai/autopilot-seo.ts) e tarefas em [src/lib/aiTasks.ts](src/lib/aiTasks.ts).
- Webhooks/Analytics: coleta de eventos via `/api/analytics` (tracking), além de sitemap/robots/llms/ai.txt para rastreadores.

## Rotas públicas e admin
- Públicas (principais): home [app/page.tsx](app/page.tsx); intentos [app/comprar-spitz-anao/page.tsx](app/comprar-spitz-anao/page.tsx), [app/preco-spitz-anao/page.tsx](app/preco-spitz-anao/page.tsx), [app/criador-spitz-confiavel/page.tsx](app/criador-spitz-confiavel/page.tsx), [app/guia/page.tsx](app/guia/page.tsx); catálogo [app/filhotes/page.tsx](app/filhotes/page.tsx) e detalhe [app/filhotes/[slug]/page.tsx](app/filhotes/%5Bslug%5D/page.tsx); blog listagem [app/blog/page.tsx](app/blog/page.tsx) e post [app/blog/[slug]/page.tsx](app/blog/%5Bslug%5D/page.tsx); autores [app/autores/[slug]/page.tsx](app/autores/%5Bslug%5D/page.tsx); institucionais (sobre, contato, políticas, termos); buscas [app/search/page.tsx](app/search/page.tsx); web stories [app/web-stories/page.tsx](app/web-stories/page.tsx); RSS/sitemaps/robots/ai-readiness [app/sitemap.ts](app/sitemap.ts), [app/sitemap-index.xml/route.ts](app/sitemap-index.xml/route.ts), [app/robots.ts](app/robots.ts), [app/ai.txt/route.ts](app/ai.txt/route.ts), [app/llms.txt/route.ts](app/llms.txt/route.ts).
- Admin/interno: namespace [app/(admin)/admin](app/(admin)/admin) com login, posts, puppies, cadastros; layout em [app/(admin)/admin/layout.tsx](app/(admin)/admin/layout.tsx) aplica robots noindex/nofollow; guard-layout está vazio e não injeta lógica; rotas internas devem permanecer protegidas e noindex.
- APIs: endpoints sob [app/api](app/api) (admin puppies, analytics, etc.); seguir política de noindex implícita.

## Componentes críticos de CTA / Modal / Tracking
- Catálogo e detalhe: [src/components/catalog/PuppyCatalogCard.tsx](src/components/catalog/PuppyCatalogCard.tsx) (cliques/CTA + track.event), [src/components/PuppyDetailsModal.tsx](src/components/PuppyDetailsModal.tsx) (modal de detalhe e CTAs), [src/components/puppy/PuppyActionsClient.tsx](src/components/puppy/PuppyActionsClient.tsx), [src/components/puppy/PuppyHero.tsx](src/components/puppy/PuppyHero.tsx), [src/components/puppy/PuppyGallery.tsx](src/components/puppy/PuppyGallery.tsx).
- Contato/lead: [src/components/ui/ContactCTA.tsx](src/components/ui/ContactCTA.tsx) dispara track.event (phone/whatsapp), usado em institucionais e blog.
- Tracking utilitário: [src/lib/track.ts](src/lib/track.ts) e bindClicks; PageViewPing em [src/components/PageViewPing.tsx](src/components/PageViewPing.tsx) envia eventos de visualização.
- Blog/comprovação: share/TOC/FAQBlock em [src/components/blog/Toc.tsx](src/components/blog/Toc.tsx) e [src/components/answer/FAQBlock.tsx](src/components/answer/FAQBlock.tsx) (gera JSON-LD FAQ quando ≥3 itens).

## Arquivos suspeitos de duplicidade ou incoerência
- Clients Supabase: há [src/lib/supabaseAdmin.ts](src/lib/supabaseAdmin.ts), [src/lib/supabaseAnon.ts](src/lib/supabaseAnon.ts) e referências a supabasePublic (não centralizado no mesmo arquivo). Necessário consolidar em Admin/Public/Anon únicos.
- SEO helpers: dois caminhos ativos ([src/lib/seo.core.ts](src/lib/seo.core.ts) e [src/lib/seo.ts](src/lib/seo.ts)) + schemas em [src/lib/schema.ts](src/lib/schema.ts); risco de duplicar canonical/metadata/JSON-LD.
- Tracking: helper central em [src/lib/track.ts](src/lib/track.ts) mas há módulo paralelo em [src/lib/tracking](src/lib/tracking) (integrations/getTrackingConfig/listResources/examples) que pode duplicar responsabilidade.
- Guard/layout admin: [app/(admin)/admin/guard-layout.tsx](app/(admin)/admin/guard-layout.tsx) está vazio; verificar utilidade ou remover.
- Metadata de blog: SEO do blog mistura Sanity e Supabase via [src/lib/seo.core.ts](src/lib/seo.core.ts) (buildPostMetadata). Confirmar fonte única do blog (Sanity) e remover dependência Supabase.
- AI readiness: arquivos [app/ai.txt/route.ts](app/ai.txt/route.ts) e [app/llms.txt/route.ts](app/llms.txt/route.ts); manter apenas um builder em [src/lib/ai-readiness.ts](src/lib/ai-readiness.ts).
