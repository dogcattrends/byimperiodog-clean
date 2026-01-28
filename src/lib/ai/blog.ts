/**
 * Módulo AI para o blog do admin.
 * Responsável por gerar títulos, texto completo, imagens (DALL·E), alt text, metadata de SEO e schema Article JSON-LD.
 */
import { sanityBlogRepo } from "@/lib/sanity/blogRepo";
// Assumindo existência de cliente OpenAI ou similar. Ajuste para seu provider.
// import { openai } from "../openai";

export type BlogAIInput = {
 topic: string;
 outline?: string[];
 brandVoice?: string;
 autoPublish?: boolean;
};

export type BlogAIOutput = {
 title: string;
 seoTitle: string;
 seoDescription: string;
 contentMarkdown: string;
 imageUrl?: string;
 imageAlt?: string;
 keywords: string[];
 jsonLd: Record<string, unknown>;
 status: "draft" | "published";
};

function defaultVoice(brandVoice?: string) {
 return (
 brandVoice ||
 "Tom premium, confiável e humano, focado em Spitz Alemão Lulu da Pomerânia. Clareza, sem sensacionalismo. Linguagem direta e acolhedora."
 );
}

export async function generateBlogPost(input: BlogAIInput): Promise<BlogAIOutput> {
 const voice = defaultVoice(input.brandVoice);

 // 1) Gerar título + SEO
 const title = await fakeLLM(`Gere um título para blog sobre: ${input.topic}. Tom: ${voice}. Max 60 caracteres.`);
 const seoTitle = title;
 const seoDescription = await fakeLLM(
 `Crie meta description (até 160 chars) para post sobre: ${input.topic}. Tom: ${voice}.`,
 );

 // 2) Outline se não veio
 const outline =
 input.outline ||
 (await fakeLLMArray(
 `Gere 4-6 tópicos curtos para um artigo sobre ${input.topic}, focado em compradores de Spitz. Tom: ${voice}.`,
 5,
 ));

 // 3) Conteúdo completo em Markdown
 const contentMarkdown = await fakeLLM(
 `Escreva um artigo completo sobre ${input.topic}, seguindo o outline: ${outline.join(
 " | ",
 )}. Tom: ${voice}. Inclua seções com H2/H3, FAQs curtas e CTA para catálogo / lead. Use Markdown.`,
 );

 // 4) Keywords
 const keywords = await fakeLLMArray(
 `Liste 8-12 palavras-chave separadas por vírgula, focadas em comprar Spitz/Lulu da Pomerânia: ${input.topic}`,
 10,
 );

 // 5) Imagem DALL·E (placeholder)
 const imageUrl = await fakeLLM(
 `Gere uma URL fictícia de imagem no estilo By Império Dog (fundo neutro, Spitz em destaque).`,
 );
 const imageAlt = await fakeLLM(`Crie um alt text descritivo para a imagem do post sobre ${input.topic}.`);

 // 6) JSON-LD Article
 const jsonLd = {
 "@context": "https://schema.org",
 "@type": "Article",
 headline: seoTitle,
 description: seoDescription,
 image: imageUrl,
 keywords: keywords.join(", "),
 };

 const result: BlogAIOutput = {
 title,
 seoTitle,
 seoDescription,
 contentMarkdown,
 imageUrl,
 imageAlt,
 keywords,
 jsonLd,
 status: input.autoPublish ? "published" : "draft",
 };

 if (input.autoPublish) {
 await saveAsDraftOrPublish(result, "published");
 }

 return result;
}

function slugify(value: string) {
 return value
 .toLowerCase()
 .trim()
 .normalize("NFD")
 .replace(/\p{Diacritic}/gu, "")
 .replace(/[^a-z0-9\s-]/g, "")
 .replace(/\s+/g, "-")
 .replace(/-+/g, "-")
 .replace(/^-|-$/g, "");
}

async function saveAsDraftOrPublish(post: BlogAIOutput, status: "draft" | "published") {
 await sanityBlogRepo.upsertPost({
 title: post.title,
 slug: slugify(post.title || `ai-${Date.now().toString(36)}`),
 content: post.contentMarkdown,
 status,
 seoTitle: post.seoTitle,
 seoDescription: post.seoDescription,
 ogImageUrl: post.imageUrl ?? undefined,
 coverUrl: post.imageUrl ?? undefined,
 coverAlt: post.imageAlt ?? undefined,
 category: "ai",
 tags: ["ai-generated"],
 excerpt: post.seoDescription,
 publishedAt: status === "published" ? new Date().toISOString() : null,
 scheduledAt: null,
 });
}

// Placeholder LLM helpers. Trocar por chamadas reais.
async function fakeLLM(prompt: string): Promise<string> {
 return `[AI] ${prompt.slice(0, 80)}...`;
}

async function fakeLLMArray(prompt: string, maxItems: number): Promise<string[]> {
 return Array.from({ length: maxItems }, (_, i) => `[AI item ${i + 1}] ${prompt.slice(0, 40)}...`);
}
