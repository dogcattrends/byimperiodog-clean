import { sanityBlogRepo } from "@/lib/sanity/blogRepo";
import { listPublicPosts } from "@/lib/sanity/publicPosts";

export async function getRelatedUnified(slug: string, limit = 6) {
 try {
 const { posts } = await listPublicPosts({ page: 1, pageSize: limit + 4, sort: "recentes" });
 return posts.filter((post) => post.slug !== slug).slice(0, limit);
 } catch (error) {
 console.error("relatedUnified erro", error);
 return [];
 }
}

export async function getPostsByTag(tag: string, limit = 24) {
 try {
 const result = await sanityBlogRepo.listSummaries({ tag, limit, status: "published" });
 return result.items.map((post) => ({
 slug: post.slug,
 title: post.title,
 excerpt: post.excerpt || null,
 cover_url: post.coverUrl || null,
 published_at: post.publishedAt || null,
 }));
 } catch (error) {
 console.error("getPostsByTag error", error);
 return [];
 }
}
