# Sanity é o Blog, Ponto 📝

**Status:** 🟢 Canonical - Source of Truth 
**Última atualização:** 7 de janeiro de 2026

---

## Princípio Fundamental

**Sanity é a única fonte de verdade para conteúdo de blog.** 

Dados de blog (posts, slugs, metadados, conteúdo em Portable Text) vivem no Sanity. Zero replicação em Supabase. Zero cópias de Portable Text em bases de dados operacionais.

---

## Arquitetura

### Content Model (Sanity)
- **Type:** `post`
- **Fields:**
 - `title` (string) - Título do artigo
 - `slug` (slug) - URL-safe slug
 - `description` / `excerpt` - Meta description
 - `content` / `body` (array de Portable Text blocks) - Conteúdo editável
 - `publishedAt` (datetime) - Data de publicação
 - `coverUrl` / `coverImage` - Imagem destaque
 - `answerSnippet`, `tldr`, `keyTakeaways` - Metadados SEO
 - `faq`, `sources` - Estruturado para IA
 - `author` (reference) - Autor do post
 - `categories` (array de references) - Categorização
 - `status` - Draft / Published

### Data Queries (App)
- **Single source:** `src/lib/sanity/blogRepo.ts`
- **Fragments:** `src/lib/sanity/queries.ts`
 - `SANITY_POST_LIST_FIELDS` - Para listagens
 - `SANITY_POST_DETAIL_FIELDS` - Para páginas individuais
- **Consumer:** Qualquer rota que exiba blog
 - `app/blog/page.tsx` - Listagem
 - `app/blog/[slug]/page.tsx` - Detalhe
 - Componentes React que consomem posts

### What NOT to do ❌
- ❌ Armazenar `content` (Portable Text) em Supabase
- ❌ Duplicar `title`, `slug`, `description` em tabela legada `blog_posts`
- ❌ Usar cache de metadados do Supabase sem validação do Sanity
- ❌ Editar posts via API admin que não passa por Sanity

---

## Como Publicar (Fluxo de Edição)

### 1️⃣ Editor (no Sanity Studio)
```
Sanity Studio → Editar post → Publicar ("Publish" button)
```

### 2️⃣ Sistema (automático)
- Sanity webhook dispara `POST /api/webhooks/sanity`
- App incrementa ISR revalidation para:
 - `/blog` (listagem)
 - `/blog/[slug]` (página do post)
 - `/blog/[slug]/comments` (se houver)
- Cache atualizado em ~5-30 segundos (depende do Vercel/Next.js)

### 3️⃣ Verificação
```bash
# Verificar publicação:
curl https://byimperiodog.com.br/blog/seu-slug

# Verificar metadata:
curl -H "Accept: application/json" https://byimperiodog.com.br/api/og?slug=seu-slug
```

---

## Como Revalidar Cache (Força)

### Opção 1: Via Webhook Manual (Dev)
```bash
curl -X POST http://localhost:3000/api/webhooks/sanity \
 -H "Content-Type: application/json" \
 -d '{
 "type": "post",
 "slug": "seu-slug",
 "action": "publish"
 }'
```

### Opção 2: Via CLI Next.js (Production)
```bash
# Revalidar uma página específica
curl https://byimperiodog.com.br/api/revalidate?path=/blog/seu-slug

# (se endpoint estiver implementado)
```

### Opção 3: Manual Dashboard
- Sanity Studio → Publish → Esperar webhook
- (webhook é automático, sem ação manual necessária)

---

## Proteções & Enforcement

### 🔒 Admin & Studio Access
- **Middleware:** `middleware.ts` valida `admin_role` para `/(admin)/*` routes
- **Noindex:** `app/(admin)/layout.tsx` aplica `robots: { index: false, follow: false }`
 - Evita indexação acidental de painéis internos
- **Headers:** `headers.ts` pode adicionar `X-Robots-Tag: noindex` se necessário

### 🔐 Blog Publishing
- **Sanity Roles:** Apenas usuários com "Editor" ou "Admin" podem publicar
- **Webhooks:** Verificam `X-Sanity-Webhook-Signature` para evitar spoofing
- **API Keys:** Sanity CRUD_KEY é apenas para servidor (`/api/webhooks`)

### 📊 Data Integrity
- **Cache invalidation:** ISR garante que versão estale não persiste por mais de 24h
- **Fallback:** Se Sanity indisponível, versão anterior é servida (com headers de warning)

---

## Troubleshooting

### Post não aparece após publicar
1. ✅ Verificar se foi clicado "Publish" no Sanity
2. ✅ Checar logs de webhook: `/api/logs/webhooks` (se implementado)
3. ✅ Forçar revalidação manual (ver "Como Revalidar")
4. ✅ Verificar `slug` é URL-safe (sem espaços, caracteres especiais)

### Conteúdo Portable Text aparece quebrado
1. ✅ Validar que `content` / `body` foi preenchido no Sanity
2. ✅ Verificar componente `<PortableText />` em `app/blog/[slug]/page.tsx`
3. ✅ Checar console do navegador para erros de tipo

### SEO metadados não atualizando
1. ✅ Verificar `description` / `excerpt` no Sanity
2. ✅ Checar que `og_image_url` ou `coverImage` está configurado
3. ✅ Rodar `npm run seo:audit` para validar schema JSON-LD

---

## Stack de Exemplo

```typescript
// src/lib/sanity/blogRepo.ts
async function getPostBySlug(slug: string) {
 const client = sanityClient();
 return client.fetch(`*[_type == "post" && slug.current == $slug][0]`, 
 { slug }, 
 { perspective: 'published' }
 );
}

// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
 const post = await getPostBySlug(params.slug);
 return buildPostMetadata(params.slug);
}

export default async function PostPage({ params }) {
 const post = await getPostBySlug(params.slug);
 return (
 <>
 <h1>{post.title}</h1>
 <PortableText value={post.content} />
 </>
 );
}
```

---

## Leitura Adicional

- [Sanity Docs: Portable Text](https://www.sanity.io/docs/portable-text)
- [Next.js: ISR (Incremental Static Regeneration)](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Webhooks: Sanity Configuration](../docs/WEBHOOKS.md) (se houver)

---

## Checklist de Validação

- ✅ Blog content está em Sanity (não em Supabase)
- ✅ Webhooks disparam ao publicar (teste com `npm run dev` + Sanity Studio)
- ✅ ISR revalidation funciona (verificar logs em Vercel)
- ✅ Admin routes têm `noindex` aplicado
- ✅ Metadados SEO vêm de `seo.ts` (fonte única)
- ✅ Portable Text renderiza corretamente

**TL;DR:** Sanity = Blog Source. Editar lá, tudo se propaga automaticamente.
