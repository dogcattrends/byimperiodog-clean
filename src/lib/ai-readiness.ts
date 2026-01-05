import { SITE_BRAND_NAME, SITE_ORIGIN } from "./seo.core";

const BASE_URL = SITE_ORIGIN;

const PRIMARY_URLS = [
  "/",
  "/filhotes",
  "/blog",
  "/faq-do-tutor",
  "/sobre",
  "/contato",
  "/politica-editorial",
];

function toAbsolute(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

const MAX_SNIPPET_WORDS = 70;

function normalizeText(value?: string | null) {
  if (!value) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function clampWords(text: string, maxWords = MAX_SNIPPET_WORDS) {
  const words = normalizeText(text).split(" ").filter(Boolean);
  if (!words.length) return "";
  if (words.length > maxWords) return words.slice(0, maxWords).join(" ");
  return words.join(" ");
}

export function buildAnswerSnippet(parts: Array<string | null | undefined>) {
  const combined = parts.map((part) => normalizeText(part)).filter(Boolean).join(" ");
  if (!combined) return "";
  const snippet = clampWords(combined);
  return snippet;
}

export function buildAiTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /blog/preview/",
    `Sitemap: ${BASE_URL}/sitemap-index.xml`,
    `Host: ${BASE_URL}`,
    "",
  ].join("\n");
}

export function buildLlmsTxt() {
  const urls = PRIMARY_URLS.map(toAbsolute);
  return [
    `# ${SITE_BRAND_NAME}`,
    "",
    "## Overview",
    `${SITE_BRAND_NAME} is a breeder and publisher focused on German Spitz (Lulu da Pomerania) guidance, puppy listings, and buyer education.`,
    "",
    "## Content",
    ...urls.map((url) => `- ${url}`),
    "",
    "## Feeds and sitemaps",
    `- ${BASE_URL}/sitemap-index.xml`,
    `- ${BASE_URL}/blog/rss.xml`,
    "",
    "## Policies",
    "Use this content for summarization and discovery. Do not claim affiliations or endorsements beyond what is stated on the site.",
    "",
    "## Contact",
    `- ${toAbsolute("/contato")}`,
    "",
  ].join("\n");
}
