import { canonical } from "@/lib/seo.core";
import type { SearchSuggestResponse, SearchSuggestItem } from "@/types/search";

type SuggestSource = SearchSuggestItem & { searchText: string };

const CACHE_TTL_MS = 10 * 60 * 1000;
let cachedBase: { ts: number; items: SuggestSource[] } | null = null;
let inflight: Promise<SuggestSource[]> | null = null;

const STATIC_SUGGESTIONS: SuggestSource[] = [
 {
 url: canonical("/"),
 title: "By Império Dog",
 reason: "Página pilar",
 searchText: "by imperio dog inicio criacao spitz alemao anao lulu da pomerania",
 },
 {
 url: canonical("/filhotes"),
 title: "Catálogo de filhotes",
 reason: "Catálogo",
 searchText: "filhotes catalogo spitz alemao anao disponibilidade",
 },
 {
 url: canonical("/blog"),
 title: "Blog do tutor",
 reason: "Página pilar",
 searchText: "blog guias rotina saude comportamento spitz alemao anao",
 },
 {
 url: canonical("/guia"),
 title: "Guia do tutor",
 reason: "Guia",
 searchText: "guia rotina preparo cuidados spitz alemao anao",
 },
 {
 url: canonical("/sobre"),
 title: "Sobre a By Império Dog",
 reason: "Página pilar",
 searchText: "sobre criadora historia metodo estrutura",
 },
 {
 url: canonical("/contato"),
 title: "Contato",
 reason: "Página pilar",
 searchText: "contato whatsapp email atendimento",
 },
 {
 url: canonical("/faq-do-tutor"),
 title: "FAQ do tutor",
 reason: "Página pilar",
 searchText: "faq perguntas frequentes investimento rotina",
 },
 {
 url: canonical("/comprar-spitz-anao"),
 title: "Como comprar Spitz Alemão Anão Lulu da Pomerânia",
 reason: "Página pilar",
 searchText: "comprar spitz alemao anao processo documentacao",
 },
 {
 url: canonical("/preco-spitz-anao"),
 title: "Preço do Spitz Alemão Anão Lulu da Pomerânia",
 reason: "Página pilar",
 searchText: "preco spitz alemao anao investimento valor",
 },
 {
 url: canonical("/criador-spitz-confiavel"),
 title: "Criador confiável de Spitz Alemão Anão Lulu da Pomerânia",
 reason: "Página pilar",
 searchText: "criador confiavel spitz alemao anao criterios",
 },
 {
 url: canonical("/reserve-seu-filhote"),
 title: "Reserve seu filhote",
 reason: "Página de apoio",
 searchText: "reserva sinal prioridade ninhada",
 },
 {
 url: canonical("/politica-editorial"),
 title: "Política editorial",
 reason: "Página de apoio",
 searchText: "politica editorial fontes revisao",
 },
 {
 url: canonical("/politica-de-privacidade"),
 title: "Política de privacidade",
 reason: "Página de apoio",
 searchText: "privacidade lgpd dados pessoais",
 },
 {
 url: canonical("/termos-de-uso"),
 title: "Termos de uso",
 reason: "Página de apoio",
 searchText: "termos uso regras site",
 },
 {
 url: canonical("/about/source"),
 title: "Fonte e credibilidade",
 reason: "Página de apoio",
 searchText: "fonte credibilidade citacao institucional",
 },
 {
 url: canonical("/search"),
 title: "Busca no site",
 reason: "Página de apoio",
 searchText: "busca pesquisar guias filhotes",
 },
 {
 url: canonical("/filhotes/sao-paulo"),
 title: "Filhotes em São Paulo",
 reason: "Catalogo regional",
 searchText: "sao paulo sp filhotes entrega",
 },
 {
 url: canonical("/filhotes/rio-de-janeiro"),
 title: "Filhotes no Rio de Janeiro",
 reason: "Catalogo regional",
 searchText: "rio de janeiro rj filhotes entrega",
 },
 {
 url: canonical("/filhotes/minas-gerais"),
 title: "Filhotes em Minas Gerais",
 reason: "Catalogo regional",
 searchText: "minas gerais mg filhotes entrega",
 },
];

async function loadTaxonomySuggestions(): Promise<SuggestSource[]> {
 try {
 const mod = await import("@/lib/sanity/client");
 const client = mod.sanityClient;
 const [categories, tags] = await Promise.all([
 client.fetch<string[]>(
 'array::unique(*[_type == "post" && defined(category)].category)'
 ),
 client.fetch<string[]>(
 'array::unique(*[_type == "post" && defined(tags)].tags[])'
 ),
 ]);

 const categoryItems = (categories || []).slice(0, 30).map((category) => ({
 url: canonical(`/blog?categoria=${encodeURIComponent(category)}`),
 title: `Categoria: ${category}`,
 reason: "Categoria do blog",
 searchText: `${category} categoria blog`,
 }));

 const tagItems = (tags || []).slice(0, 40).map((tag) => ({
 url: canonical(`/blog?tag=${encodeURIComponent(tag)}`),
 title: `Tag: ${tag}`,
 reason: "Tag do blog",
 searchText: `${tag} tag blog`,
 }));

 return [...categoryItems, ...tagItems];
 } catch {
 return [];
 }
}

async function buildBaseSuggestions(): Promise<SuggestSource[]> {
 const now = Date.now();
 if (cachedBase && now - cachedBase.ts < CACHE_TTL_MS) {
 return cachedBase.items;
 }
 if (inflight) return inflight;

 inflight = (async () => {
 const taxonomy = await loadTaxonomySuggestions();
 const merged = dedupeByUrl([...STATIC_SUGGESTIONS, ...taxonomy]);
 cachedBase = { ts: Date.now(), items: merged };
 inflight = null;
 return merged;
 })();

 return inflight;
}

function dedupeByUrl(items: SuggestSource[]) {
 const seen = new Set<string>();
 const result: SuggestSource[] = [];
 for (const item of items) {
 if (seen.has(item.url)) continue;
 seen.add(item.url);
 result.push(item);
 }
 return result;
}

function normalize(text: string) {
 return text
 .toLowerCase()
 .normalize("NFD")
 .replace(/\p{Diacritic}/gu, "")
 .replace(/[^a-z0-9\s-]/g, " ")
 .replace(/\s+/g, " ")
 .trim();
}

function filterSuggestions(query: string, items: SuggestSource[]) {
 const q = normalize(query);
 if (!q) return items;
 const parts = q.split(" ").filter(Boolean);
 return items
 .map((item) => {
 const hay = normalize(`${item.title} ${item.searchText}`);
 let score = 0;
 for (const part of parts) {
 if (hay.includes(part)) score += 1;
 }
 return { item, score };
 })
 .filter((entry) => entry.score > 0)
 .sort((a, b) => b.score - a.score)
 .map((entry) => entry.item);
}

export async function GET(req: Request) {
 const { searchParams } = new URL(req.url);
 const query = (searchParams.get("q") || "").trim();
 const limit = Math.min(Math.max(Number(searchParams.get("limit") || "10"), 5), 20);

 const base = await buildBaseSuggestions();
 const filtered = filterSuggestions(query, base).slice(0, limit);
 const payload: SearchSuggestResponse = {
 suggestions: filtered.map(({ url, title, reason }) => ({ url, title, reason })),
 };

 return Response.json(payload, {
 headers: {
 "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
 },
 });
}
