import dotenv from "dotenv";
import { createClient } from "@sanity/client";
dotenv.config({ path: ".env.local" });

async function main() {
 const { listPublicPosts } = await import("../src/lib/sanity/publicPosts");
 const page = await listPublicPosts({ page: 1, pageSize: 5, sort: "recentes" });
 const { sanityClient } = await import("../src/lib/sanity/client");

 const publishedCount = await sanityClient.fetch<number>(
 'count(*[_type == "post"])'
 );
 const samplePublished = await sanityClient.fetch<
 Array<{ _id: string; title?: string; slug?: { current?: string }; status?: string; publishedAt?: string }>
 >('*[_type == "post"][0...5]{_id, title, slug, status, publishedAt}');

 const token = process.env.SANITY_TOKEN;
 let rawCount: number | null = null;
 let sampleRaw: typeof samplePublished | null = null;
 if (token) {
 const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
 const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
 const apiVersion = process.env.SANITY_API_VERSION ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2023-08-01";
 if (projectId && dataset) {
 const rawClient = createClient({
 projectId,
 dataset,
 apiVersion,
 token,
 useCdn: false,
 perspective: "raw",
 });
 rawCount = await rawClient.fetch<number>('count(*[_type == "post"])');
 sampleRaw = await rawClient.fetch<typeof samplePublished>(
 '*[_type == "post"][0...5]{_id, title, slug, status, publishedAt}'
 );
 }
 }

 console.log(
 JSON.stringify(
 {
 sanity: {
 publishedCount,
 rawCount,
 samplePublished,
 sampleRaw,
 },
 total: page.total,
 returned: page.posts.length,
 slugs: page.posts.map((p) => p.slug),
 statuses: page.posts.map((p) => p.status ?? null),
 },
 null,
 2
 )
 );
}

main().catch((error) => {
 console.error("[check-sanity-blog] failed");
 console.error(error);
 process.exit(1);
});
