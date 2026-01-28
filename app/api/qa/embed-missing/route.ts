import { NextResponse } from "next/server";

import { batchEnsureEmbeddings } from "@/lib/embeddings.store.blog";
import { internalGuard } from "@/lib/internalAuth";
import { sanityClient } from "@/lib/sanity/client";

export const runtime = "nodejs";

// Gera embeddings para posts que não têm registro mdx em blog_post_embeddings
export async function POST(req: Request){
 if(!internalGuard(req)) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });

 const posts = await sanityClient.fetch<Array<{ slug: string; title?: string | null; plain?: string | null }>>(
 `*[_type == "post" && status == "published" && defined(slug.current)]
 | order(coalesce(publishedAt, _updatedAt) desc)[0...60]{
 "slug": slug.current,
 title,
 "plain": pt::text(coalesce(content, body))
 }`,
 {}
 );
 if(!posts || posts.length===0) return NextResponse.json({ ok:false, error:'sem posts'}, { status:500 });

 const result = await batchEnsureEmbeddings(
 posts.map((p) => ({ slug: p.slug, title: p.title ?? null, content: p.plain ?? null })),
 40
 );
 return NextResponse.json({ ok:true, processed: result.length, result });
}