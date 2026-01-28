import { NextResponse } from "next/server";

import { requireAdmin, logAdminAction } from "@/lib/adminAuth";
import { sanityClient } from "@/lib/sanity";

// Upsert SEO overrides for a post by id or slug
export async function POST(req: Request) {
 try {
 const auth = requireAdmin(req);
 if (auth) return auth;
 const body = await req.json();
 const { id, slug, data } = body as { id?: string; slug?: string; data: Record<string, any> };
 if (!id && !slug) return NextResponse.json({ error: "id ou slug obrigatórios" }, { status: 400 });
 if (!data) return NextResponse.json({ error: "data obrigatório" }, { status: 400 });

 let postId = id as string | undefined;
 let postSlug = slug as string | undefined;
 if (!postId && postSlug) {
 postId = (await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug: postSlug }
 )) ?? undefined;
 if (!postId) return NextResponse.json({ error: "post não encontrado" }, { status: 404 });
 }
 if (postId && !postSlug) {
 postSlug = (await sanityClient.fetch<string | null>(
 `*[_type == "post" && _id == $id][0].slug.current`,
 { id: postId }
 )) ?? undefined;
 }

 // Compat: aceita chaves antigas do Supabase/overrides
 const patch: Record<string, unknown> = {};
 if (typeof data.seoTitle === "string") patch.seoTitle = data.seoTitle;
 if (typeof data.seoDescription === "string") patch.seoDescription = data.seoDescription;
 if (typeof data.ogImageUrl === "string") patch.ogImageUrl = data.ogImageUrl;
 if (typeof data.canonicalUrl === "string") patch.canonicalUrl = data.canonicalUrl;
 if (typeof data.robots === "string") patch.robots = data.robots;

 if (typeof data.title === "string") patch.seoTitle = data.title;
 if (typeof data.description === "string") patch.seoDescription = data.description;
 if (typeof data.og_image_url === "string") patch.ogImageUrl = data.og_image_url;
 if (typeof data.canonical === "string") patch.canonicalUrl = data.canonical;

 if (!Object.keys(patch).length) {
 return NextResponse.json({ error: "nenhum campo SEO reconhecido em data" }, { status: 400 });
 }

 await sanityClient.patch(String(postId)).set(patch).commit();
 logAdminAction({
 route: "/api/admin/blog/seo/override",
 method: "POST",
 action: "seo_override_patch",
 payload: { postId, slug: postSlug, keys: Object.keys(patch) },
 });

 return NextResponse.json({ ok: true, postId, slug: postSlug, patched: Object.keys(patch) });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}

