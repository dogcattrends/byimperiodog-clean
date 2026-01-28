/* Content driver: Contentlayer (default) with optional Sanity switch via CMS_DRIVER.
 Provides normalized helpers for blog data access.

 LEGADO / FALLBACK: este módulo faz fallback para Contentlayer quando o
 `CMS_DRIVER` não estiver configurado. NÃO é a fonte canônica do blog.
 Sanity é a Source of Truth para conteúdo editorial (ver docs/BLOG_ARCHITECTURE.md).
*/

export type BlogPost = {
 slug: string;
 title: string;
 excerpt?: string | null;
 cover?: string | null;
 date?: string | null; // ISO
 updated?: string | null;
 tags?: string[] | null;
 category?: string | null;
 author?: string | null;
 readingTime?: number | null;
 url?: string;
 bodyRaw?: string | null;
};

const CMS = (process.env.CMS_DRIVER || 'contentlayer').toLowerCase();

// Lazy import to avoid type errors when Contentlayer hasn't generated types yet.
// Use non-literal module strings to avoid Vite static analysis resolving
// the `contentlayer/generated` specifier during test runs.

async function loadContentlayerPosts(): Promise<unknown[]> {
 // Em ambiente de testes, não tentar resolver o pacote Contentlayer
 // (pode não estar gerado e causa erros do Vite durante os testes).
 if (process.env.NODE_ENV === 'test') return [];
 try {
 // Tenta importar o caminho padrão gerado pelo Contentlayer.
 // Evita usar o literal 'contentlayer' para prevenir a análise estática do Vite.
 const pkg = ['content', 'layer'].join('');
 const mod = await import(pkg + '/generated');
 const m = mod as unknown as { allPosts?: unknown[] };
 return m.allPosts || [];
 } catch (err) {
 // Fallback: tenta importar o arquivo gerado diretamente (caminho fixo),
 // também evitando o literal no código fonte.
 try {
 const base = ['..', '..', '.contentlayer', 'generated'].join('/');
 const mod = await import(base + '/index.mjs');
 const m1 = mod as unknown as { allPosts?: unknown[] };
 return m1.allPosts || [];
 } catch (err2) {
 return [];
 }
 }
}
function normalizePost(p: unknown): BlogPost {
 const obj = p as Record<string, unknown>;
 const raw = (obj._raw as Record<string, unknown> | undefined) ?? undefined;
 const slug = (obj.slug as string) || (raw?.sourceFileName as string)?.replace?.(/\.mdx$/, '') || '';
 const title = (obj.title as string) || (obj.name as string) || 'Post';
 const excerpt = (obj.description as string) || (obj.excerpt as string) || null;
 const cover = (obj.cover as string) || (obj.cover_url as string) || null;
 const date = (obj.date as string) || (obj.published_at as string) || null;
 const updated = (obj.updated as string) || (obj.updated_at as string) || null;
 const tags = (obj.tags as unknown) as string[] | null;
 const category = (obj.category as string) || null;
 const author = (obj.author as string) || null;
 const readingTime = (obj.readingTime as number) || (obj.reading_time as number) || null;
 const url = (obj.url as string) || (slug ? `/blog/${slug}` : undefined);
 const bodyRaw = ((obj.body as Record<string, unknown> | undefined)?.raw as string) || (obj.content_mdx as string) || null;

 return {
 slug,
 title,
 excerpt,
 cover,
 date,
 updated,
 tags,
 category,
 author,
 readingTime,
 url,
 bodyRaw,
 };
}

export async function getAllPosts(opts?: { page?: number; pageSize?: number; q?: string; tag?: string; category?: string }) {
 const page = Math.max(1, Number(opts?.page || 1));
 const pageSize = Math.min(50, Math.max(1, Number(opts?.pageSize || 12)));
 const q = (opts?.q || '').trim().toLowerCase();
 const tag = (opts?.tag || '').trim().toLowerCase();
 const category = (opts?.category || '').trim().toLowerCase();

 if (CMS === 'sanity') {
 // TODO: wire Sanity query; for now, return empty with pagination shape
 return { items: [], total: 0, page, pageSize };
 }

 const src = await loadContentlayerPosts();
 let items = src.map(normalizePost);
 if (q) {
 items = items.filter((p) =>
 [p.title, p.excerpt, p.bodyRaw].some((t) => String(t || '').toLowerCase().includes(q))
 );
 }
 if (tag) {
 items = items.filter((p) => (p.tags || []).map((t) => String(t).toLowerCase()).includes(tag));
 }
 if (category) {
 items = items.filter((p) => String(p.category || '').toLowerCase() === category);
 }
 // sort by date desc
 items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
 const total = items.length;
 const start = (page - 1) * pageSize;
 const paged = items.slice(start, start + pageSize);
 return { items: paged, total, page, pageSize };
}

export async function getPostBySlug(slug: string) {
 if (!slug) return null;
 if (CMS === 'sanity') {
 // TODO: fetch sanity by slug
 return null;
 }
 const src = await loadContentlayerPosts();
 const hit = src.find((p) => {
 const obj = p as Record<string, unknown>;
 const s = (obj.slug as string) || ((obj._raw as Record<string, unknown> | undefined)?.sourceFileName as string | undefined)?.replace?.(/\.mdx$/, '');
 return s === slug;
 });
 return hit ? normalizePost(hit) : null;
}

export async function getPostsByTag(tag: string, limit = 12) {
 if (!tag) return [] as BlogPost[];
 if (CMS === 'sanity') {
 return [];
 }
 const src = await loadContentlayerPosts();
 const items = src.map(normalizePost).filter((p) => (p.tags || []).map((t) => String(t).toLowerCase()).includes(tag.toLowerCase()));
 return items.slice(0, limit);
}

export async function getRelatedPosts(slug: string, limit = 4) {
 if (!slug) return [] as BlogPost[];
 if (CMS === 'sanity') {
 return [];
 }
 const src = await loadContentlayerPosts();
 const items = src.map(normalizePost);
 const post = items.find((p) => p.slug === slug);
 if (!post) return items.slice(0, limit);
 const tags = new Set((post.tags || []).map((t) => String(t).toLowerCase()));
 const related = items
 .filter((p) => p.slug !== slug)
 .map((p) => ({ p, score: (p.tags || []).reduce((acc, t) => acc + (tags.has(String(t).toLowerCase()) ? 1 : 0), 0) }))
 .filter((x) => x.score > 0)
 .sort((a, b) => b.score - a.score)
 .map((x) => x.p);
 return (related.length ? related : items.filter((p) => p.slug !== slug)).slice(0, limit);
}
