import FAQBlock from "@/components/answer/FAQBlock";
import PuppiesCatalogGrid from "@/components/catalog/PuppiesCatalogGrid";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import TrustBlock from "@/components/ui/TrustBlock";
import type { Puppy } from "@/domain/puppy";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { routes } from "@/lib/route";
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

const CATALOG_SNIPPET =
  "Este catálogo mostra filhotes de Spitz Alemão Anão (Lulu da Pomerânia) com status, fotos e rotina. Aqui você identifica a disponibilidade atual, compara perfis com critérios de socialização e documentação e segue direto para conversar com a criadora e orientar o próximo passo.";

const CATALOG_FAQ = [
  {
    question: "Como saber se um filhote está disponível?",
    answer: "O status aparece no card e informamos o próximo passo para reserva conforme a ordem de prioridade.",
  },
  {
    question: "O que preciso enviar para iniciar a reserva?",
    answer: "Basta preencher o formulário de contato com cidade, rotina e expectativas sobre o filhote.",
  },
  {
    question: "Como funciona a socialização inicial?",
    answer: "Os filhotes passam por rotina guiada com pessoas e sons domésticos antes da entrega.",
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
    "Escolha filhotes de Spitz Alemão Anão (Lulu da Pomerânia) com triagem veterinária, socialização guiada e mentoria vitalícia. Processo transparente e suporte direto com a criadora.",
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
          Spitz Alemão Anão Lulu da Pomerânia — Criador certificado
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900 sm:text-4xl">
          Filhotes disponíveis com processo premium
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-600">
          Cada filhote passa por triagem veterinária, socialização guiada e documentação completa.
          Trabalhamos com ninhadas limitadas para garantir atenção personalizada a cada novo tutor.
        </p>
        <div data-geo-answer="filhotes" className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Visão Rápida</h2>
          <p className="mt-3 text-sm text-zinc-600">{CATALOG_SNIPPET}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <PrimaryCTA href={routes.filhotes} tracking={{ location: "filhotes_page", ctaId: "filhotes_primary" }}>
            Ver catálogo completo
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
            title="Confiança comprovada"
            description="Processo guiado para entregarmos filhotes seguros e tutores preparados"
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
              Este catálogo apresenta filhotes disponíveis com informações de rotina, documentação e próximos passos para contato.
            </p>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-zinc-900">Pontos principais</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                <li>O status é atualizado e define a prioridade de reserva.</li>
                <li>Os cards informam rotina, socialização e documentação básica.</li>
                <li>O contato direto permite alinhar expectativas antes da reserva.</li>
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
                      <td className="px-4 py-3 font-medium text-zinc-900">Disponível</td>
                      <td className="px-4 py-3">Pode iniciar conversa e seguir para entrevista.</td>
                    </tr>
                    <tr className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium text-zinc-900">Reservado</td>
                      <td className="px-4 py-3">Já possui prioridade definida para outra família.</td>
                    </tr>
                    <tr className="border-t border-[var(--border)]">
                      <td className="px-4 py-3 font-medium text-zinc-900">Em preparo</td>
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

          <FAQBlock items={CATALOG_FAQ} />
        </div>
      </section>

      <section id="catalog" className="pb-16">
        <PuppiesCatalogGrid items={puppies} />
      </section>
    </main>
  );
}
