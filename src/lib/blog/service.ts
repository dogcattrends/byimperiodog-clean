// LEGADO (compat): este módulo acessava `blog_posts` no Supabase.
// A fonte editorial canônica é o Sanity.
import { sanityBlogRepo } from "../sanity/blogRepo";

export type BlogPost = {
 id: string;
 slug: string;
 title: string;
 excerpt?: string | null;
 content_mdx?: string | null;
 cover_url?: string | null;
 cover_alt?: string | null;
 published_at?: string | null;
 updated_at?: string | null;
 status?: string | null;
 category?: string | null;
 tags?: string[] | null;
 seo_title?: string | null;
 seo_description?: string | null;
};

export type ListParams = {
 page?: number;
 pageSize?: number;
 tag?: string;
 category?: string;
 status?: "published" | "draft" | "review";
 sort?: "recentes" | "antigos";
};

export type ListResult = {
 posts: BlogPost[];
 page: number;
 pageSize: number;
 total: number;
 hasNext: boolean;
 hasPrev: boolean;
};

export async function listPosts(params: ListParams = {}): Promise<BlogPost[]> {
 const page = Math.max(1, params.page || 1);
 const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
 const status = (params.status || "published") as any;
 const { items } = await sanityBlogRepo.listSummaries({
 status,
 limit: pageSize,
 offset: (page - 1) * pageSize,
 sort: params.sort || "recentes",
 tag: params.tag,
 category: params.category,
 });
 return (items || []).map((p: any) => ({
 id: String(p.id),
 slug: String(p.slug),
 title: String(p.title || ""),
 excerpt: p.excerpt ?? null,
 content_mdx: p.content ?? null,
 cover_url: p.coverUrl ?? null,
 cover_alt: p.coverAlt ?? null,
 published_at: p.publishedAt ?? null,
 updated_at: p.updatedAt ?? null,
 status: p.status ?? status,
 category: p.category?.slug ?? p.category ?? null,
 tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t?.slug ?? t).filter(Boolean) : null,
 seo_title: p.seo?.title ?? null,
 seo_description: p.seo?.description ?? null,
 })) as BlogPost[];
}

export async function listPostsWithMeta(params: ListParams = {}): Promise<ListResult> {
 const page = Math.max(1, params.page || 1);
 const pageSize = Math.min(100, Math.max(1, params.pageSize || 12));
 const status = (params.status || "published") as any;
 const result = await sanityBlogRepo.listSummaries({
 status,
 limit: pageSize,
 offset: (page - 1) * pageSize,
 sort: params.sort || "recentes",
 tag: params.tag,
 category: params.category,
 });
 const total = result.total ?? 0;
 const posts = (result.items || []).map((p: any) => ({
 id: String(p.id),
 slug: String(p.slug),
 title: String(p.title || ""),
 excerpt: p.excerpt ?? null,
 content_mdx: p.content ?? null,
 cover_url: p.coverUrl ?? null,
 cover_alt: p.coverAlt ?? null,
 published_at: p.publishedAt ?? null,
 updated_at: p.updatedAt ?? null,
 status: p.status ?? status,
 category: p.category?.slug ?? p.category ?? null,
 tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t?.slug ?? t).filter(Boolean) : null,
 seo_title: p.seo?.title ?? null,
 seo_description: p.seo?.description ?? null,
 })) as BlogPost[];
 const hasNext = page * pageSize < total;
 const hasPrev = page > 1;
 return { posts, page, pageSize, total, hasNext, hasPrev };
}

export async function getPostBySlug(slug: string, opts?: { includeDraft?: boolean }): Promise<BlogPost | null> {
 const post = await sanityBlogRepo.getPostBySlug(slug);
 if (!post) return null;
 if (!opts?.includeDraft && (post as any).status !== "published") return null;

 const p: any = post as any;
 return {
 id: String(p.id),
 slug: String(p.slug),
 title: String(p.title || ""),
 excerpt: p.excerpt ?? null,
 content_mdx: p.content ?? null,
 cover_url: p.coverUrl ?? null,
 cover_alt: p.coverAlt ?? null,
 published_at: p.publishedAt ?? null,
 updated_at: p.updatedAt ?? null,
 status: p.status ?? null,
 category: p.category?.slug ?? p.category ?? null,
 tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t?.slug ?? t).filter(Boolean) : null,
 seo_title: p.seo?.title ?? null,
 seo_description: p.seo?.description ?? null,
 };
}

export function buildSeoTitle(post: BlogPost) {
 return post.seo_title || `${post.title} | Blog By Império Dog`;
}

export function buildSeoDescription(post: BlogPost) {
 return post.seo_description || post.excerpt || "Conhecimento premium para tutores de Spitz Alemão Anão Lulu da Pomerânia.";
}

export function extractContextFromTags(tags?: string[] | null) {
 const context: { color?: string; city?: string; intent?: string } = {};
 (tags || []).forEach((t) => {
 const lower = String(t).toLowerCase();
 if (lower.startsWith("cor:")) context.color = lower.split(":")[1];
 if (lower.startsWith("cidade:")) context.city = lower.split(":")[1];
 if (lower.startsWith("intent:")) context.intent = lower.split(":")[1];
 });
 return context;
}
