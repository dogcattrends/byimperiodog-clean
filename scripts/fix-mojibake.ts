#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * Corrige textos com mojibake (UTF-8 interpretado como ISO-8859-1/latin1) no Sanity.
 * - Atualiza campos textuais somente quando necessário.
 * - Por padrão roda em dry-run; use --write para aplicar.
 *
 * Uso:
 * npm run fix:mojibake # dry-run (padrão)
 * npm run fix:mojibake --write # aplica alterações
 */

import process from "node:process";

import { sanityClient } from "../src/lib/sanity/client";
import type { SanityBlock } from "../src/lib/sanity/blocks";

type SanityTextChild = {
 _type?: string;
 text?: string;
 [key: string]: unknown;
};

type SanityPost = {
 _id: string;
 title?: string | null;
 description?: string | null;
 seoTitle?: string | null;
 seoDescription?: string | null;
 canonicalUrl?: string | null;
 robots?: string | null;
 ogImageUrl?: string | null;
 answerSnippet?: string | null;
 tldr?: string | null;
 category?: string | null;
 tags?: string[] | null;
 content?: SanityBlock[];
 body?: SanityBlock[];
};

const WRITE_MODE = process.argv.includes("--write");
const token = process.env.SANITY_TOKEN;

if (WRITE_MODE && !token) {
 console.warn("[fix-mojibake] SANITY_TOKEN ausente. Abortando (modo --write). ");
 process.exit(1);
}

function decodeIfNeeded(value: string | null) {
 if (!value) return { changed: false, value };
 if (!/[ÃÂ�]/.test(value)) {
 return { changed: false, value };
 }
 try {
 const decoded = Buffer.from(value, "latin1").toString("utf8");
 if (decoded === value) return { changed: false, value };
 return { changed: true, value: decoded };
 } catch {
 return { changed: false, value };
 }
}

function decodeStringArrayIfNeeded(values?: string[] | null) {
 if (!Array.isArray(values) || values.length === 0) {
 return { changed: false, value: values ?? null };
 }
 let changed = false;
 const next = values.map((value) => {
 const decoded = decodeIfNeeded(value);
 if (decoded.changed) changed = true;
 return decoded.value ?? value;
 });
 return { changed, value: next };
}

function decodeBlocksIfNeeded(blocks?: SanityBlock[] | null) {
 if (!Array.isArray(blocks) || blocks.length === 0) {
 return { changed: false, value: blocks ?? null };
 }
 let changed = false;
 const next = blocks.map((block) => {
 if (!block || typeof block !== "object") return block;
 const anyBlock = block as unknown as { _type?: string; children?: SanityTextChild[] };
 if (anyBlock._type !== "block" || !Array.isArray(anyBlock.children)) return block;

 const nextChildren = anyBlock.children.map((child) => {
 if (!child || typeof child !== "object") return child;
 if (typeof child.text !== "string") return child;
 const decoded = decodeIfNeeded(child.text);
 if (!decoded.changed) return child;
 changed = true;
 return { ...child, text: decoded.value ?? child.text };
 });

 const childrenChanged = nextChildren.some((child, idx) => child !== anyBlock.children?.[idx]);
 if (!childrenChanged) return block;
 changed = true;
 return { ...(block as object), children: nextChildren } as SanityBlock;
 });
 return { changed, value: next };
}

async function run() {
 const query = `*[_type=="post"]{
 _id,
 title,
 description,
 seoTitle,
 seoDescription,
 canonicalUrl,
 robots,
 ogImageUrl,
 answerSnippet,
 tldr,
 category,
 tags,
 content,
 body
 }`;

 const data = await sanityClient.fetch<SanityPost[]>(query);

 let totalPosts = 0;
 let totalFields = 0;

 for (const post of (data as SanityPost[]) ?? []) {
 const fixes = {
 title: decodeIfNeeded(post.title ?? null),
 description: decodeIfNeeded(post.description ?? null),
 seoTitle: decodeIfNeeded(post.seoTitle ?? null),
 seoDescription: decodeIfNeeded(post.seoDescription ?? null),
 canonicalUrl: decodeIfNeeded(post.canonicalUrl ?? null),
 robots: decodeIfNeeded(post.robots ?? null),
 ogImageUrl: decodeIfNeeded(post.ogImageUrl ?? null),
 answerSnippet: decodeIfNeeded(post.answerSnippet ?? null),
 tldr: decodeIfNeeded(post.tldr ?? null),
 category: decodeIfNeeded(post.category ?? null),
 tags: decodeStringArrayIfNeeded(post.tags ?? null),
 content: decodeBlocksIfNeeded(post.content ?? null),
 body: decodeBlocksIfNeeded(post.body ?? null),
 };

 const changedFields = Object.entries(fixes).filter(([, result]) => result.changed);
 if (!changedFields.length) continue;

 totalPosts += 1;
 totalFields += changedFields.length;

 console.log(
 `[fix-mojibake] Post ${post._id} -> campos alterados: ${changedFields
 .map(([key]) => key)
 .join(", ")}`
 );

 if (!WRITE_MODE) continue;

 const payload: Record<string, unknown> = {};
 for (const [key, result] of Object.entries(fixes)) {
 payload[key] = result.value;
 }

 try {
 await sanityClient.patch(post._id).set(payload).commit({ autoGenerateArrayKeys: true });
 } catch (error) {
 console.error(`[fix-mojibake] Falha ao atualizar ${post._id}:`, String(error));
 }
 }

 console.log(
 `[fix-mojibake] Resumo: ${totalPosts} posts com ${totalFields} campos corrigidos. Modo: ${
 WRITE_MODE ? "write" : "dry-run"
 }`
 );

 if (!WRITE_MODE) {
 console.log('Execute novamente com "--write" para aplicar as alterações.');
 }
}

run().catch((err) => {
 console.error("[fix-mojibake] Erro inesperado:", err);
 process.exit(1);
});

