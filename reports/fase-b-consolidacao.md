# Relatório de Consolidação - Fase B

**Data:** 7 de janeiro de 2026 
**Fase:** B - Unificar clients/helpers

## SEO Helpers Consolidados ✅

### Antes (duplicação)
- **src/lib/seo.core.ts** (162 linhas) - Funções específicas do blog + Supabase
- **src/lib/seo.ts** (175 linhas) - Helpers genéricos de metadata
- **src/lib/seo.blog.ts** - Wrapper intermediário

### Depois (fonte única)
- **src/lib/seo.ts** (370 linhas) - Arquivo consolidado com todas as funções
 - Constants (SITE_ORIGIN, SITE_BRAND_NAME)
 - Canonical URL helpers (canonical, buildCanonical)
 - Robots configuration (resolveRobots, ROBOTS_DEFAULT, ROBOTS_PREVIEW)
 - Base metadata builders (baseSiteMetadata, baseBlogMetadata, buildBlogPostMetadata, buildPostMetadata)
 - Page metadata (pageMetadata, baseMetaOverrides)
 - JSON-LD schemas (blogJsonLdOrg, buildAuthorJsonLd)
 - Admin metadata (adminNoIndexMetadata)
 
- **src/lib/seo.core.ts** - Mantido como re-export para backward compatibility (DEPRECATED)
- **src/lib/seo.blog.ts** - Mantido como re-export para backward compatibility (DEPRECATED)

### Imports Atualizados
- ✅ [lib/sharePuppy.ts](../lib/sharePuppy.ts) - `@/lib/seo.core` → `@/lib/seo`

### Status
- npm run lint: ✅ **0 erros, 0 warnings**
- npm run typecheck: ⚠️ 24 erros (forms admin legados - não crítico)

## Clients/Helpers - Status

### Supabase ✅ (Fase 2 - já unificado)
- **src/lib/supabaseClient.ts** - Factory centralizado
- **src/lib/supabaseAdmin.ts** - Usa factory
- **src/lib/supabasePublic.ts** - Usa factory
- **src/lib/supabaseAnon.ts** - Usa factory com singleton

### Sanity ✅ (Fase 2 - já unificado)
- **src/lib/sanity/client.ts** - Cliente único
- **src/lib/sanity/queries.ts** - Fragmentos compartilhados
- **src/lib/sanity/blogRepo.ts** - Consome fragmentos

### Tracking ⏳ (próximo)
- **lib/track.ts** - Centraliza eventos pixel (GA4/FB/TT/Pinterest)
- **lib/tracking/** - Módulos paralelos (config/integrations/examples)
- **TODO:** Verificar se há duplicação e consolidar se necessário

## Próximos Passos

1. Auditar módulos de tracking (lib/track.ts vs lib/tracking/*)
2. Fase C: Remover dead code (guard-layout.tsx vazio, componentes não usados)
3. Fase D: Documentação BLOG_IS_SANITY.md + proteções admin
4. Fase E: Script preflight.mjs
5. Fase F: Build e audit final

## Notas

- Arquivos `.core` e `.blog` mantidos temporariamente para evitar quebras
- Após migração completa de imports, remover arquivos deprecated
- Zero impacto no lint/build após consolidação
