import { NextResponse } from "next/server";

import { sanityBlogRepo } from "@/lib/sanity/blogRepo";
import { sanityClient } from "@/lib/sanity/client";

type GenerateBody = {
 topic?: string;
 outline?: string;
 category?: string;
 tags?: string[];
 publish?: boolean;
 slug?: string; // opcional; se não vier, criaremos um a partir do título
 content_mdx?: string; // se já vier pronto, não chama IA
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

function slugify(input: string) {
 return input
 .toLowerCase()
 .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/(^-|-$)+/g, "");
}

async function generateWithOpenAI(topic: string, outline?: string) {
 const apiKey = process.env.OPENAI_API_KEY;
 if (!apiKey) return null;
 const system = "Você é um redator SEO sênior focado em Spitz Alemão Anão Lulu da Pomerânia.";
 const user = `Gere um post em MDX sobre: ${topic}.
 ${outline ? `Siga este outline: ${outline}` : "Inclua introdução, seções práticas, lista de dicas e conclusão."
 }
 Título H1 na primeira linha, depois parágrafos e subtítulos (H2/H3). Inclua uma seção de FAQ com 3-4 perguntas ao final.`;
 const res = await fetch("https://api.openai.com/v1/chat/completions", {
 method: "POST",
 headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
 body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.7 })
 });
 if (!res.ok) return null;
 const json = await res.json();
 const content = json?.choices?.[0]?.message?.content as string | undefined;
 return content || null;
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

 const body = (await req.json()) as GenerateBody;
 if (!body.content_mdx && !body.topic) {
 return NextResponse.json({ error: "Informe 'content_mdx' ou 'topic'" }, { status: 400 });
 }

 let content = body.content_mdx || null;
 if (!content && body.topic) {
 content = await generateWithOpenAI(body.topic, body.outline);
 if (!content) {
 return NextResponse.json({ error: "Falha ao gerar conteúdo (configure OPENAI_API_KEY ou envie content_mdx)" }, { status: 502 });
 }
 }

 // Extrair título da primeira linha do MDX, caso possível
 let title = "Post do Blog";
 const firstLine = content!.split("\n").find((l: string) => l.trim().length > 0) || "";
 const h1Match = firstLine.match(/^#\s*(.+)$/);
 if (h1Match) title = h1Match[1].trim();
 const slug = body.slug || slugify(title);

 const slugExists = await sanityClient.fetch<number>(
 `count(*[_type == "post" && slug.current == $slug])`,
 { slug }
 );
 if ((slugExists || 0) > 0) {
 return NextResponse.json({ error: "Slug já existente" }, { status: 409 });
 }

 const contentPlain = toPlain(content || "");
 const publishedAt = body.publish ? new Date().toISOString() : null;
 const created = await sanityBlogRepo.upsertPost({
 title,
 slug,
 content: contentPlain.length >= 50 ? contentPlain : (contentPlain + " ").padEnd(50, " "),
 excerpt: null,
 category: body.category || null,
 tags: Array.isArray(body.tags) ? body.tags : [],
 status: body.publish ? "published" : "draft",
 publishedAt,
 scheduledAt: null,
 coverUrl: null,
 coverAlt: null,
 seoTitle: null,
 seoDescription: null,
 ogImageUrl: null,
 subtitle: null,
 });

 return NextResponse.json({ ok: true, id: created?.id ?? `post-${slug}`, slug, status: body.publish ? "published" : "draft" });
 } catch (err: unknown) {
 const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? 'Erro') : String(err ?? 'Erro');
 return NextResponse.json({ error: msg }, { status: 500 });
 }
}
