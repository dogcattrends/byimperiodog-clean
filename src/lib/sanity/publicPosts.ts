import type { Post } from "@/lib/db/types";
import { sanityBlogRepo } from "@/lib/sanity/blogRepo";

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 200;

export type PublicPostSummary = {
 id: string;
 slug: string;
 title: string;
 excerpt?: string | null;
 cover_url?: string | null;
 cover_alt?: string | null;
 published_at?: string | null;
 updated_at?: string | null;
 tags?: string[];
 category?: string | null;
 status?: string | null;
 content_mdx?: string | null;
};

export type PublicPostsPage = {
 posts: PublicPostSummary[];
 total: number;
 page: number;
 pageSize: number;
 hasNext: boolean;
 hasPrev: boolean;
};

function mapPost(post: Post): PublicPostSummary {
 const tags = Array.isArray(post.tags)
 ? post.tags
 .map((tag) => tag.slug || tag.name || "")
 .map((value) => value.toLowerCase())
 .filter(Boolean)
 : [];
 const category = post.category?.slug || post.category?.title || null;
 return {
 id: post.id,
 slug: post.slug,
 title: post.title ?? post.slug,
 excerpt: post.excerpt || null,
 cover_url: post.coverUrl ?? null,
 cover_alt: post.coverAlt ?? null,
 published_at: post.publishedAt ?? null,
 updated_at: post.updatedAt ?? null,
 tags,
 category,
 status: post.status ?? null,
 content_mdx: post.content ?? null,
 };
}

export async function listPublicPosts(options?: {
 page?: number;
 pageSize?: number;
 search?: string;
 sort?: "recentes" | "antigos";
}): Promise<PublicPostsPage> {
 const page = Math.max(1, options?.page ?? 1);
 const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, options?.pageSize ?? DEFAULT_PAGE_SIZE));
 const offset = (page - 1) * pageSize;
 const { items, total } = await sanityBlogRepo.listSummaries({
 limit: pageSize,
 offset,
 status: "published",
 search: options?.search,
 sort: options?.sort,
 });
 const posts = (Array.isArray(items) ? items : []).map(mapPost);
 return {
 posts,
 total,
 page,
 pageSize,
 hasNext: offset + posts.length < total,
 hasPrev: page > 1,
 };
}

export { mapPost as mapSanityPostToPublic };
