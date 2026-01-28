import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { sanityClient } from "@/lib/sanity/client";

export async function POST(req: Request) {
 const auth = requireAdmin(req);
 if (auth) return auth;

 if (!process.env.SANITY_TOKEN) {
 return NextResponse.json({ message: "SANITY_TOKEN ausente (necessário para publicar)" }, { status: 500 });
 }

 const due = await sanityClient.fetch<Array<{ id: string; slug: string }>>(
 `*[_type == "post" && status == "scheduled" && defined(publishedAt) && publishedAt <= now()]{
 "id": _id,
 "slug": slug.current
 }`,
 {}
 );

 if (!due || due.length === 0) {
 return NextResponse.json({ updated: 0 });
 }

 const updatedAt = new Date().toISOString();
 const results = await Promise.all(
 due.map(async (doc) => {
 try {
 await sanityClient
 .patch(doc.id)
 .set({ status: "published", publishedAt: updatedAt })
 .commit({ autoGenerateArrayKeys: true });
 return { id: doc.id, ok: true };
 } catch (e) {
 return { id: doc.id, ok: false };
 }
 })
 );
 const okCount = results.filter((r) => r.ok).length;

 // Revalidate listing and each post so the Sanity source of truth appears instantly on the public site.
 // This webhook flow is documented in docs/BLOG_ARCHITECTURE.md.
 try {
 revalidatePath("/blog");
 for (const d of due) revalidatePath(`/blog/${d.slug}`);
 } catch (e) { /* ignore revalidate errors */ }

 return NextResponse.json({ updated: okCount, attempted: due.length });
}

