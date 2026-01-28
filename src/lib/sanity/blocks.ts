/*
 SANITY BLOCKS HELPERS (conventions)
 - These helpers convert Sanity blocks (Portable Text) to consumable
 primitives for the public site. Prefer `src/lib/sanity/*` imports.
 - Do not persist full block payloads in Supabase; only store small
 derived metadata when necessary (reading time, short summary).
*/

import type { TocItem } from "@/lib/blog/mdx/toc";
import { estimateReadingTime } from "@/lib/blog/reading-time";

type SanityTextChild = {
 _type?: string;
 text?: string;
};

export type SanityBlock = {
 _type?: string;
 style?: string;
 children?: SanityTextChild[];
 caption?: string;
 asset?: { url?: string };
 code?: string;
 language?: string;
 level?: number;
};

export function blocksToPlainText(blocks?: SanityBlock[]): string {
 if (!blocks || !blocks.length) return "";
 return blocks
 .map((block) => block?.children?.map((child) => child.text ?? "").join("") ?? "")
 .filter(Boolean)
 .join("\n\n");
}

function slugify(value: string) {
 const normalized = value
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "")
 .toLowerCase();
 return normalized
 .replace(/[^a-z0-9\s-]/g, "")
 .trim()
 .replace(/\s+/g, "-")
 .replace(/-+/g, "-");
}

function extractText(block: SanityBlock): string {
 if (!block) return "";
 if (block.children?.length) return block.children.map((child) => child.text ?? "").join("");
 return "";
}

export function buildTocFromBlocks(blocks?: SanityBlock[]): TocItem[] {
 const headings: TocItem[] = [];
 const stack: TocItem[] = [];
 (blocks ?? []).forEach((block) => {
 if (block._type !== "block") return;
 const style = block.style || "normal";
 const match = style.match(/^h([1-4])$/);
 if (!match) return;
 const depth = Number(match[1]);
 const text = extractText(block).trim();
 if (!text) return;
 const id = slugify(text);
 const item: TocItem = { id, depth, value: text, children: [] };
 while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
 if (!stack.length) headings.push(item);
 else stack[stack.length - 1].children.push(item);
 stack.push(item);
 });
 return headings;
}

export function estimateReadingTimeFromBlocks(blocks?: SanityBlock[]): number {
 return estimateReadingTime(blocksToPlainText(blocks));
}

export function slugFromSanity(slug?: { current?: string } | null, fallback?: string) {
 return slug?.current || fallback || "";
}
