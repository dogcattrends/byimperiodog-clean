import FAQBlock from "@/components/answer/FAQBlock";
import PuppiesCatalogGrid from "@/components/catalog/PuppiesCatalogGrid";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import TrustBlock from "@/components/ui/TrustBlock";
import type { Puppy } from "@/domain/puppy";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { pageMetadata } from "@/lib/seo";
import { supabasePublic } from "@/lib/supabasePublic";
import { TRUST_BLOCK_ITEMS } from "@/lib/trust-data";

// Using a server-rendered catalog to guarantee SSR content. Mantemos o mesmo card/layout
// em todas as páginas para simplificar a experiência.

type CatalogPuppy = Puppy;

type CatalogFilters = {
 color?: string;
 gender?: string;
 status?: string | string[];
 city?: string;
 state?: string;
};

const DEFAULT_STATUSES = ["disponivel", "reservado"] as const;

const COLOR_SYNONYMS: Record<string, string[]> = {
 branco: ["white", "branco", "white"],
 white: ["white", "branco"],
 laranja: ["laranja", "orange"],
 orange: ["orange", "laranja"],
 preto: ["black", "preto"],
 black: ["black", "preto"],
 creme: ["creme", "creme"],
 'grey-white': ["grey-white", "grey white", "cinza"],
};

// CATALOG_SNIPPET was unused and removed to satisfy lint rules

const CATALOG_FAQ = [
 {
 question: "Como saber se um filhote está disponível?",
 answer: "O status aparece no card. Se estiver Disponível, você pode iniciar a conversa e seguir para a entrevista. Se estiver Reservado, você ainda pode pedir orientação e entrar na lista de espera quando fizer sentido.",
 },
 {
 question: "O que preciso enviar para iniciar a reserva?",
 answer: "Para agilizar, envie sua cidade/estado, sua rotina (tempo em casa), se já há outros pets/crianças e suas preferências (sexo/cor). A partir disso alinhamos expectativas e explicamos as próximas etapas.",
 },
 {
 question: "Como funciona a socialização inicial?",
 answer: "A rotina inclui exposição gradual a pessoas, manuseio, sons do dia a dia e adaptação ao ambiente doméstico. Também orientamos o tutor com checklist e próximos passos para a chegada.",
 },
];

const ensureArray = (value?: string | string[] | null) => {
 if (!value) return [] as string[];
 return Array.isArray(value) ? value : [value];
};

const normalizeStatusFilter = (value?: string | string[]) => {
 const list = ensureArray(value);
 // Para consultas no banco, use sempre os valores canônicos (pt-BR).
 // Se a coluna `status` for ENUM, incluir valores inválidos (ex: "available") pode quebrar a query.
 if (list.length === 0) return [...DEFAULT_STATUSES];

 const normalized: string[] = [];
 for (const raw of list) {
 if (!raw) continue;
 const s = raw.toLowerCase();
 // Mapear sempre para os status canônicos do DB (pt-BR)
 if (s === "available" || s === "disponivel") normalized.push("disponivel");
 else if (s === "reserved" || s === "reservado") normalized.push("reservado");
 else if (s === "sold" || s === "vendido") normalized.push("vendido");
 }

 // Se o usuário passou algo inválido (ex: status=foo), não filtrar por isso.
 if (normalized.length === 0) return [...DEFAULT_STATUSES];

 // dedupe
 return Array.from(new Set(normalized));
};

const normalizeColorFilter = (value?: string) => {
 if (!value) return [] as string[];
 const v = value.toLowerCase();
 if (COLOR_SYNONYMS[v]) return Array.from(new Set(COLOR_SYNONYMS[v].map((c) => c.toLowerCase())));
 return [v];
};

const coerceSingleValue = (value?: string | string[]) => {
 if (!value) return undefined;
 if (Array.isArray(value)) return value[0];
 return value;
};

const buildFiltersFromSearchParams = (searchParams?: Record<string, string | string[] | undefined>): CatalogFilters => ({
 color: coerceSingleValue(searchParams?.color),
 gender: coerceSingleValue(searchParams?.gender),
 status: searchParams?.status,
 city: coerceSingleValue(searchParams?.city),
 state: coerceSingleValue(searchParams?.state),
});

export const metadata = pageMetadata({
 title: "Filhotes disponíveis premium | By Império Dog",
 description:
 "Escolha filhotes de Spitz Alemão Anão Lulu da Pomerânia com triagem veterinária, socialização guiada e mentoria vitalícia. Processo transparente e suporte direto com a criadora.",
 path: "/filhotes",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchPuppies(filters: CatalogFilters): Promise<CatalogPuppy[]> {
 try {
 const normalizedStatuses = normalizeStatusFilter(filters.status);
 // 1) Query direta no Supabase (SSR). Sem filtros por coluna específica para
 // manter compatibilidade com schemas antigos (PT-BR) e evitar erros de coluna inexistente.
 const sb = supabasePublic();
 const { data, error } = await sb.from("puppies").select("*").order("created_at", { ascending: false }).limit(200);

 if (error) {
 console.error("[catalog] Erro ao buscar filhotes (direct supabase):", error);
 }

 const wantedDomainStatuses = normalizedStatuses
 .map((s) => (s || "").toLowerCase())
 .map((s) => (s === "disponivel" ? "available" : s === "reservado" ? "reserved" : s === "vendido" ? "sold" : s))
 .filter(Boolean);

 const colorCandidates = filters.color ? normalizeColorFilter(filters.color) : [];
 const wantedSex = filters.gender
 ? (filters.gender.toLowerCase() === "femea" || filters.gender.toLowerCase() === "fêmea" || filters.gender.toLowerCase() === "female" ? "female" : "male")
 : undefined;
 const wantedCity = filters.city?.toLowerCase();
 const wantedState = filters.state?.toUpperCase();

 const normalized: Puppy[] = (data ?? []).map((raw: unknown) => normalizePuppyFromDB(raw));
 const filtered = normalized
 .filter((p: Puppy) => (wantedDomainStatuses.length ? wantedDomainStatuses.includes(p.status) : true))
 .filter((p: Puppy) => (colorCandidates.length ? colorCandidates.includes((p.color || "").toLowerCase()) : true))
 .filter((p: Puppy) => (wantedSex ? p.sex === wantedSex : true))
 .filter((p: Puppy) => (wantedCity ? (p.city || "").toLowerCase() === wantedCity : true))
 .filter((p: Puppy) => (wantedState ? (p.state || "").toUpperCase() === wantedState : true));

 if (filtered.length > 0) {
 // eslint-disable-next-line no-console
 console.info('[catalog] direct supabase count:', filtered.length);
 return filtered.slice(0, 60);
 }

 // If still empty, continue to REST fallback later in the caller
 return [];
 } catch (error) {
 console.error("[catalog] Exception ao buscar filhotes:", error);
 return [];
 }
}

type PageProps = {
 searchParams?: Record<string, string | string[] | undefined>;
};

export default async function FilhotesPage({ searchParams }: PageProps) {
 const filters = buildFiltersFromSearchParams(searchParams);
 const normalizedStatuses = normalizeStatusFilter(filters.status);
 let puppies = await fetchPuppies(filters);

 // Fallback: se a função principal não trouxe registros, tentar consulta direta via REST
 // (útil em dev quando clientes AI / ranking falham ou variáveis de ambiente não estiverem acessíveis)
 if ((!puppies || puppies.length === 0) && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
 try {
 const base = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/,'');
 const statusesParam = normalizedStatuses.length > 0 ? `status=in.(${normalizedStatuses.map(s => encodeURIComponent(s)).join(',')})` : '';
 const colorCandidates = filters.color ? normalizeColorFilter(filters.color) : [];
 const colorParam = colorCandidates.length > 0 ? `color=in.(${colorCandidates.map(c => encodeURIComponent(c)).join(',')})` : '';
 const parts = ['select=*', statusesParam, colorParam, 'order=created_at.desc', 'limit=60'].filter(Boolean);
 const url = `${base}/rest/v1/puppies?${parts.join('&')}`;
 const res = await fetch(url, {
 headers: {
 apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
 Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
 },
 cache: 'no-store',
 });
 if (res.ok) {
 const data = (await res.json()) as any[];
 if (Array.isArray(data) && data.length > 0) {
 // normalizar formato usado pela UI
 const fallback = data.map((raw: any) => normalizePuppyFromDB(raw));
 // substituir apenas se encontrarmos algo
 if (fallback.length > 0) {
 puppies = fallback;
 }
 }
 } else {
 console.warn("[catalog:fallback] Supabase REST retornou status", res.status);
 }
 } catch (err) {
 console.error("[catalog:fallback] erro ao carregar via REST Supabase", err);
 }
 }

 return (
 <main className="bg-gradient-to-b from-white to-zinc-50/40">

 <section className="container mx-auto px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pb-16 lg:pt-16">
 <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
 Catálogo de filhotes — Spitz Alemão Anão Lulu da Pomerânia
 </p>
 <h1 className="mt-2 text-2xl sm:text-4xl font-semibold text-zinc-900">
 Filhotes disponíveis
 </h1>
 <p className="mt-4 max-w-3xl text-base text-zinc-600">
 Veja fotos, status e detalhes de cada filhote. Atendimento direto com a criadora.
 </p>
 <div data-geo-answer="filhotes" className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
   <div className="flex items-center gap-2 mb-3">
     <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.05 8.05a3 3 0 114.24-4.24 3 3 0 01-4.24 4.24zm13.9 0a3 3 0 10-4.24-4.24 3 3 0 004.24 4.24zM12 21a5 5 0 01-5-5c0-2.5 2.5-5 5-5s5 2.5 5 5a5 5 0 01-5 5zm-7-7a3 3 0 114.24-4.24A3 3 0 015 14zm14 0a3 3 0 10-4.24-4.24A3 3 0 0119 14z" /></svg>
     <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900">Catálogo de Filhotes</h1>
   </div>
 <div className="flex items-center gap-2 mb-1">
   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
   <h2 className="text-xl font-semibold text-zinc-900">Visão Rápida</h2>
 </div>
 <p className="mt-3 text-sm text-zinc-600">
 Confira disponibilidade, fotos reais e informações essenciais para decidir com segurança. Antes de reservar, alinhe expectativas e tire dúvidas com nossa equipe.
 </p>
 </div>
 <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
 <PrimaryCTA href="#catalog" tracking={{ location: "filhotes_page", ctaId: "filhotes_primary" }}>
 Ver filhotes disponíveis
 </PrimaryCTA>
 <PrimaryCTA
 href="/guia"
 variant="ghost"
 tracking={{ location: "filhotes_page", ctaId: "filhotes_secondary" }}
 >
 Receber o guia do tutor
 </PrimaryCTA>
 </div>
 <div className="mt-10 max-w-5xl">
 <TrustBlock
 title="Processo guiado"
 description="Etapas claras para entregar filhotes seguros e preparar o tutor para a rotina"
 items={TRUST_BLOCK_ITEMS}
 />
 </div>
 </section>

 <section className="container mx-auto px-4 pb-16 sm:px-6 lg:px-8">
 <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
 <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
 <h2 className="text-xl font-semibold text-zinc-900">Informações Básicas</h2>
 <div className="mt-4">
 <h3 className="text-sm font-semibold text-zinc-900">Definição rápida</h3>
 <p className="mt-2 text-sm text-zinc-600">
 Use esta página para comparar perfis, entender o significado de cada status e decidir o melhor momento para iniciar a conversa com a criadora.
 </p>
 </div>
 <div className="mt-4">
 <div className="flex items-center gap-2 mb-1 mt-4">
   <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
   <h3 className="text-sm font-semibold text-zinc-900">Pontos principais</h3>
 </div>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
   <li>Status mostra se o filhote está disponível ou reservado.</li>
   <li>Veja fotos reais e resumo de rotina.</li>
   <li>Alinhamento de expectativas antes da reserva.</li>
 </ul>
 </div>
 <div className="mt-4">
 <h3 className="text-sm font-semibold text-zinc-900">Tabela comparativa</h3>
 <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--border)]">
 <table className="w-full text-left text-sm text-zinc-600">
 <thead className="bg-zinc-50 text-xs uppercase tracking-[0.2em] text-zinc-500">
 <tr>
 <th className="px-4 py-3">Status</th>
 <th className="px-4 py-3">O que significa</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-t border-[var(--border)]">
   <td className="px-4 py-3 font-medium text-zinc-900 flex items-center gap-2">
     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20a8 8 0 100-16 8 8 0 000 16zm0-8v4m0-8h.01" /></svg>
     Disponível
   </td>
   <td className="px-4 py-3">Pode iniciar conversa e seguir para entrevista.</td>
 </tr>
 <tr className="border-t border-[var(--border)]">
   <td className="px-4 py-3 font-medium text-zinc-900 flex items-center gap-2">
     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h1l2 7h13l2-7h1" /></svg>
     Reservado
   </td>
   <td className="px-4 py-3">Já possui prioridade definida para outra família.</td>
 </tr>
 <tr className="border-t border-[var(--border)]">
   <td className="px-4 py-3 font-medium text-zinc-900 flex items-center gap-2">
     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
     Em preparo
   </td>
   <td className="px-4 py-3">Ninhada monitorada aguardando janela de entrega.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 <div className="mt-4">
 <h3 className="text-sm font-semibold text-zinc-900">Fontes</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
 <li>
 <a className="underline decoration-dotted" href="https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" target="_blank" rel="noreferrer">
 FCI - German Spitz
 </a>
 </li>
 <li>
 <a className="underline decoration-dotted" href="https://wsava.org/global-guidelines/global-nutrition-guidelines/" target="_blank" rel="noreferrer">
 WSAVA - Global Nutrition Guidelines
 </a>
 </li>
 </ul>
 </div>
 </section>

 <div className="flex items-center gap-2 mb-2 mt-10">
   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
   <h2 className="text-lg font-semibold text-zinc-900">Perguntas frequentes</h2>
 </div>
 <FAQBlock items={CATALOG_FAQ} />
 </div>
 </section>

 <section id="catalog" className="pb-16">
 <PuppiesCatalogGrid items={puppies} />
 </section>
 </main>
 );
}
