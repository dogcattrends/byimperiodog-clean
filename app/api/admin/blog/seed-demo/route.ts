import { NextResponse } from "next/server";

import { sanityClient } from "@/lib/sanity";
import { sanityBlogRepo } from "@/lib/sanity/blogRepo";

export async function POST() {
 try {
 // Upsert demo posts no Sanity (fonte editorial canônica)
 const posts = [
 {
 slug: "como-cuidar-do-seu-spitz-alemao-anao",
 title: "Como cuidar do seu Spitz Alemão Anão Lulu da Pomerânia",
 subtitle: "Dicas práticas para os primeiros meses",
 excerpt:
 "Guia rápido para alimentação, higiene, vacinas e rotina do seu Spitz Alemão Anão Lulu da Pomerânia.",
 cover_url: "/spitz-hero-desktop.webp?v=20260111",
 content_mdx:
 "# Alimentação\n\n- Ração de qualidade para filhotes\n- 3 a 4 pequenas refeições\n- Água fresca sempre disponível\n\n## Higiene e escovação\n\nEscove 2–3x por semana e use produtos próprios para pets.\n\n## Rotina e enriquecimento\n\nPasseios curtos, brinquedos interativos e reforço positivo.\n",
 status: "published",
 published_at: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
 seo_title: "Como cuidar do seu Spitz Alemão Anão Lulu da Pomerânia | Dicas essenciais",
 seo_description:
 "Alimentação, higiene, vacinas e rotina para os primeiros meses do seu Spitz Alemão Anão Lulu da Pomerânia.",
 og_image_url: "/spitz-hero-desktop.webp?v=20260111",
 tags: ["Spitz Alemão", "Lulu da Pomerânia", "filhote", "cuidados"],
 },
 {
 slug: "spitz-alemao-anao-personalidade-e-convivio",
 title: "Spitz Alemão Anão Lulu da Pomerânia: personalidade e convívio",
 subtitle: null,
 excerpt: "Temperamento, socialização e dicas para conviver bem com crianças, idosos e outros pets.",
 cover_url: "/spitz-hero-mobile.png",
 content_mdx:
 "# Personalidade\n\nSão dóceis, curiosos e comunicativos.\n\n## Convívio\n\nParticipam da rotina e se adaptam bem com socialização adequada.\n",
 status: "published",
 published_at: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
 seo_title: "Spitz Anão: personalidade e convívio",
 seo_description: "Veja como é a personalidade do Spitz Alemão Anão Lulu da Pomerânia e como conviver bem em família.",
 og_image_url: "/spitz-hero-mobile.png",
 tags: ["Spitz Alemão", "Lulu da Pomerânia", "filhote", "adestramento"],
 },
 ];
 const saved: Array<{ id: string; slug: string }> = [];
 for (const p of posts) {
 const contentPlain = toPlain(p.content_mdx);
 const up = await sanityBlogRepo.upsertPost({
 title: p.title,
 slug: p.slug,
 excerpt: p.excerpt,
 content: contentPlain,
 status: p.status as any,
 publishedAt: p.published_at,
 tags: p.tags,
 seoTitle: p.seo_title,
 seoDescription: p.seo_description,
 } as any);
 if (up?.id && up?.slug) {
 saved.push({ id: up.id, slug: up.slug });
 await sanityClient.patch(String(up.id)).set({ coverUrl: p.cover_url, ogImageUrl: p.og_image_url }).commit();
 }
 }

 return NextResponse.json({ ok: true, posts: saved.length, saved });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? err) : String(err);
 console.error(msg);
 return NextResponse.json({ ok: false, error: msg }, { status: 500 });
 }
}

function toPlain(mdx: string): string {
 const raw = (mdx || "")
 .replace(/```[\s\S]*?```/g, " ")
 .replace(/`[^`]+`/g, " ")
 .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
 .replace(/\[[^\]]+\]\([^)]*\)/g, " ")
 .replace(/^#{1,6}\s+/gm, "")
 .replace(/[*_~>#-]+/g, " ")
 .replace(/\s+/g, " ")
 .trim();
 return raw;
}

