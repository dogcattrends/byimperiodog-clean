import { NextResponse } from "next/server";

import { sanityBlogRepo } from "@/lib/sanity/blogRepo";
import { sanityClient } from "@/lib/sanity/client";

type ImportBody = {
 title: string;
 slug: string;
 excerpt?: string;
 content_mdx?: string;
 cover_url?: string;
 cover_alt?: string;
 tags?: string[];
 category?: string;
 publish?: boolean;
 published_at?: string; // ISO date
};

function toPlain(md: string) {
 return md
 .replace(/```[\s\S]*?```/g, " ")
 .replace(/`[^`]*`/g, " ")
 .replace(/^#{1,6}\s+/gm, "")
 .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
 .replace(/[*_>]/g, " ")
 .replace(/\s+/g, " ")
 .trim();
}

export async function POST(req: Request) {
 try {
 const token = req.headers.get("x-admin-token") || "";
 const required = process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN || "";
 if (!required || token !== required) {
 return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
 }

 if (!process.env.SANITY_TOKEN) {
 return NextResponse.json({ error: "SANITY_TOKEN ausente (necessário para escrita)" }, { status: 500 });
 }

 const body = (await req.json()) as ImportBody;
 if (!body.title || !body.slug) {
 return NextResponse.json({ error: "Campos obrigatórios: title, slug" }, { status: 400 });
 }

 const slugExists = await sanityClient.fetch<number>(
 `count(*[_type == "post" && slug.current == $slug])`,
 { slug: body.slug }
 );
 if ((slugExists || 0) > 0) {
 return NextResponse.json({ error: "Slug já existente" }, { status: 409 });
 }

 const raw = body.content_mdx || body.excerpt || "";
 const plain = toPlain(raw);
 const publishedAt = body.publish ? (body.published_at || new Date().toISOString()) : null;
 const created = await sanityBlogRepo.upsertPost({
 title: body.title,
 slug: body.slug,
 excerpt: body.excerpt || null,
 content: plain.length >= 50 ? plain : (plain + " ").padEnd(50, " "),
 category: body.category || null,
 tags: Array.isArray(body.tags) ? body.tags : [],
 coverUrl: body.cover_url || null,
 coverAlt: body.cover_alt || null,
 status: body.publish ? "published" : "draft",
 publishedAt,
 scheduledAt: null,
 seoTitle: null,
 seoDescription: null,
 ogImageUrl: null,
 subtitle: null,
 });

 return NextResponse.json({ ok: true, id: created?.id ?? `post-${body.slug}`, slug: body.slug, status: body.publish ? "published" : "draft" });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? 'Erro') : String(err ?? 'Erro');
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}
