// LEGADO (compat): este módulo existia para ler `blog_posts` no Supabase.
// A fonte editorial canônica agora é o Sanity.
import { sanityBlogRepo } from "./sanity/blogRepo";

export type DbPost = {
 slug: string;
 title: string;
 subtitle: string | null;
 cover_url: string | null;
 excerpt: string | null;
 content_mdx: string | null;
 published_at: string | null;
 seo_title: string | null;
 seo_description: string | null;
 og_image_url: string | null;
};

function mapToDbPost(post: any): DbPost {
 return {
 slug: String(post?.slug || ""),
 title: String(post?.title || ""),
 subtitle: (post?.subtitle ?? null) as string | null,
 cover_url: (post?.coverUrl ?? null) as string | null,
 excerpt: (post?.excerpt ?? null) as string | null,
 content_mdx: (post?.content ?? null) as string | null,
 published_at: (post?.publishedAt ?? null) as string | null,
 seo_title: (post?.seo?.title ?? null) as string | null,
 seo_description: (post?.seo?.description ?? null) as string | null,
 og_image_url: (post?.seo?.ogImageUrl ?? null) as string | null,
 };
}

export async function fetchPublishedPosts(): Promise<DbPost[]> {
 try {
 const { items } = await sanityBlogRepo.listSummaries({
 status: "published",
 limit: 60,
 offset: 0,
 sort: "recentes",
 });
 return (items || []).map(mapToDbPost);
 } catch (e) {
 console.error("Erro ao buscar posts (Sanity):", e instanceof Error ? e.message : String(e));
 return [];
 }
}

export async function fetchPostBySlug(slug: string): Promise<DbPost | null> {
 try {
 const post = await sanityBlogRepo.getPostBySlug(slug);
 if (!post) return null;
 if ((post as any)?.status && (post as any).status !== "published") return null;
 return mapToDbPost(post);
 } catch (e) {
 console.error("Erro ao buscar post (Sanity):", e instanceof Error ? e.message : String(e));
 return null;
 }
}

