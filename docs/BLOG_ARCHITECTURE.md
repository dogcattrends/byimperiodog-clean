# Blog Architecture

## SANITY É O ÚNICO (Source of Truth)
- **Sanity** é a única fonte de conteúdo editorial do blog: posts, autores e categorias. Todo artigo publicado — slug, título, corpo (Portable Text), FAQ e metadados — é criado no `studio/` e servido via `src/lib/sanity/*` para as páginas públicas em `app/blog`.
- **Public blog** (`app/blog`) consome exclusivamente documentos do Sanity via `sanityBlogRepo`, GROQ queries e o fluxo de revalidação (webhook) descrito abaixo.

## O que pertence ao Supabase (apenas metadata/operacional)
- O Supabase deve ser limitado a metadados e dados operacionais: `content_events`, `ai_analysis`, `seo_score`, `seo_keywords`, `summary` (curto), `leads`, `tracking`, etc.
- **NUNCA** armazenar o corpo do artigo, Portable Text, MDX, HTML ou campos brutos `content` nas tabelas do Supabase. Conteúdo editorial não deve ser duplicado fora do Sanity.

## Fluxo
1. Escrever e editar o artigo no Sanity Studio (`studio/by-imperio-dog`).
2. Ao publicar, o Sanity dispara um webhook (protegido por `SANITY_WEBHOOK_SECRET`) para a rota de revalidação (ex.: `/api/blog/publish-due`).
3. O webhook executa checagens e atualiza apenas os metadados permitidos no Supabase, depois chama `revalidatePath`/`revalidateTag` para que `app/blog` atualize o cache.
4. O site público (`app/blog[/*]`) renderiza o documento direto do Sanity via `sanityBlogRepo` e **não** depende do Supabase para o corpo do artigo.

## Mapeamento e convenções
- **Sanity Studio**: `studio/by-imperio-dog/**` — schemas e editores.
- **Sanity helpers**: `src/lib/sanity/client.ts`, `src/lib/sanity/blogRepo.ts` e `src/lib/sanity/*` (blocks, types, etc.).
- **Webhook**: `app/api/blog/publish-due/route.ts` (revalidação + sincronização apenas de metadados ao Supabase).
- **Public blog**: `app/blog/page.tsx` e `app/blog/[slug]/page.tsx`.

### Convenções de nomenclatura (rápidas)
- Expor o cliente Sanity como `sanityClient` em `src/lib/sanity/client.ts`.
- Colocar helpers de consulta/repósito em `src/lib/sanity/blogRepo.ts` (ex.: `sanityBlogRepo`).
- Tipos relacionados ao Sanity devem ficar sob `src/lib/sanity/types` ou `src/lib/sanity/*` e prefixados como `Sanity*` (ex.: `SanityPost`, `SanityBlock`).
- Reservar `blog*` (ex.: `blog.service`, `blog.*`) apenas para camadas de consumo público/metadados — NUNCA para armazenar o corpo editorial (o campo `content_mdx` em Supabase é legado).

### Guard-rail e CI
- Há um script de checagem: `scripts/check-supabase-content.mjs` — rode localmente e integre ao CI para bloquear commits que introduzam campos proibidos (`body`, `content`, `mdx`, `portableText`, `html`).

Referencie este documento sempre que tocar na stack do blog para garantir que o Sanity permaneça a Source of Truth.

Refer to this document whenever touching the blog stack to keep Sanity as the single source.
