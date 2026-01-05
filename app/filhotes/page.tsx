import FAQBlock from "@/components/answer/FAQBlock";
import PuppiesCatalogGrid from "@/components/catalog/PuppiesCatalogGrid";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import TrustBlock from "@/components/ui/TrustBlock";
import type { Puppy } from "@/domain/puppy";
import { getRankedPuppies, type RankedPuppy } from "@/lib/ai/catalog-ranking";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { routes } from "@/lib/route";
import { pageMetadata } from "@/lib/seo";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { TRUST_BLOCK_ITEMS } from "@/lib/trust-data";

// Using a server-rendered catalog to guarantee SSR content. Mantemos o mesmo card/layout
// em todas as páginas para simplificar a experiência.

type CatalogPuppy = Puppy & {
  rankingFlag?: RankedPuppy["flag"];
  rankingScore?: number;
  rankingReason?: string;
};

type CatalogFilters = {
  color?: string;
  gender?: string;
  status?: string | string[];
  city?: string;
  state?: string;
};

const DEFAULT_STATUSES = ["disponivel", "reservado"] as const;

const STATUS_SYNONYMS: Record<string, string[]> = {
  available: ["available", "disponivel"],
  reserved: ["reserved", "reservado"],
  sold: ["sold", "vendido"],
  disponivel: ["disponivel", "available"],
  reservado: ["reservado", "reserved"],
  vendido: ["vendido", "sold"],
};

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
  "Este catálogo mostra filhotes de Spitz Alemão Anão (Lulu da Pomerânia) com status, fotos e rotina. Aqui você identifica a disponibilidade atual, compara perfis com critérios de socialização e documento e segue direto para conversar com a criadora e orientar o próximo passo.";

const CATALOG_FAQ = [
  {
    question: "Como saber se um filhote esta disponivel?",
    answer: "O status aparece no card e informamos o proximo passo para reserva conforme a ordem de prioridade.",
  },
  {
    question: "O que preciso enviar para iniciar a reserva?",
    answer: "Basta preencher o formulario de contato com cidade, rotina e expectativas sobre o filhote.",
  },
  {
    question: "Como funciona a socializacao inicial?",
    answer: "Os filhotes passam por rotina guiada com pessoas e sons domesticos antes da entrega.",
  },
];

const ensureArray = (value?: string | string[] | null) => {
  if (!value) return [] as string[];
  return Array.isArray(value) ? value : [value];
};

const normalizeStatusFilter = (value?: string | string[]) => {
  const list = ensureArray(value);
  if (list.length === 0) return [...DEFAULT_STATUSES, "available", "reserved"];

  const normalized: string[] = [];
  for (const raw of list) {
    if (!raw) continue;
    const s = raw.toLowerCase();
    // include synonyms (both pt/eng) when known
    if (STATUS_SYNONYMS[s]) {
      for (const v of STATUS_SYNONYMS[s]) normalized.push(v);
    } else {
      normalized.push(s);
    }
  }

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
  title: "Filhotes disponiveis premium | By Imperio Dog",
  description:
    "Escolha filhotes de Spitz Alemao Anao (Lulu da Pomerania) com triagem veterinaria, socializacao guiada e mentoria vitalicia. Processo transparente e suporte direto com a criadora.",
  path: "/filhotes",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchPuppies(filters: CatalogFilters): Promise<CatalogPuppy[]> {
  try {
    const normalizedStatuses = normalizeStatusFilter(filters.status);
    // debug: log filters and normalized statuses to help diagnose mismatches
    // eslint-disable-next-line no-console
    console.info('[catalog] fetchPuppies filters:', { filters, normalizedStatuses });
    // 1) Try direct Supabase query first (guarantee SSR data if available)
    const sb = supabaseAdmin();
    let query = sb.from("puppies").select("*");

    if (normalizedStatuses.length === 1) {
      query = query.eq("status", normalizedStatuses[0]);
    } else if (normalizedStatuses.length > 1) {
      query = query.in("status", normalizedStatuses);
    }

    if (filters.color) {
      const colorCandidates = normalizeColorFilter(filters.color);
      if (colorCandidates.length === 1) query = query.eq("color", colorCandidates[0]);
      else query = query.in("color", colorCandidates);
    }
    if (filters.gender) query = query.eq("gender", filters.gender);
    if (filters.city) query = query.eq("city", filters.city);
    if (filters.state) query = query.eq("state", filters.state);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(60);

    // debug: log raw supabase response for diagnostics
    // eslint-disable-next-line no-console
    console.info('[catalog] supabase raw response', {
      dataLength: Array.isArray(data) ? data.length : 0,
      sample: Array.isArray(data) ? data.slice(0, 3) : data,
      error,
    });

    // eslint-disable-next-line no-console
    if (error) {
      console.error('[catalog] Erro ao buscar filhotes (direct supabase):', error);
    }

    if (Array.isArray(data) && data.length > 0) {
      // eslint-disable-next-line no-console
      console.info('[catalog] direct supabase count:', data.length);
      return (data ?? []).map((raw: any) => ({
        ...normalizePuppyFromDB(raw),
        rankingFlag: undefined,
        rankingScore: undefined,
        rankingReason: undefined,
      }));
    }

    // 2) If no results, fall back to ranking (AI) — optional enhancement
    const ranked = await getRankedPuppies({
      status: normalizedStatuses,
      color: filters.color,
      gender: filters.gender,
      city: filters.city,
      state: filters.state,
      limit: 60,
    });
    // debug: log ranked count
    // eslint-disable-next-line no-console
    console.info('[catalog] getRankedPuppies result count:', Array.isArray(ranked) ? ranked.length : 0);

    if (ranked.length > 0) {
      return ranked.map((row) => {
        const normalized = normalizePuppyFromDB(row);
        return {
          ...normalized,
          rankingFlag: row.flag,
          rankingScore: row.score,
          rankingReason: row.reason,
        };
      });
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
      // eslint-disable-next-line no-console
      console.info('[catalog:fallback] REST URL', url);
      const res = await fetch(url, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as any[];
        // eslint-disable-next-line no-console
        console.info('[catalog:fallback] REST response length', Array.isArray(data) ? data.length : 0);
        if (Array.isArray(data) && data.length > 0) {
          // normalizar formato usado pela UI
          const fallback = data.map((raw: any) => ({ ...normalizePuppyFromDB(raw), rankingFlag: undefined, rankingScore: undefined, rankingReason: undefined }));
          // substituir apenas se encontrarmos algo
          if (fallback.length > 0) {
            // eslint-disable-next-line no-console
            console.info(`[catalog:fallback] carregou ${fallback.length} filhotes via REST Supabase`);
            puppies = fallback;
          }
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('[catalog:fallback] Supabase REST retornou status', res.status);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[catalog:fallback] erro ao carregar via REST Supabase', err);
    }
  }

  return (
    <main className="bg-gradient-to-b from-white to-zinc-50/40">

      <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
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
          <h2 className="text-xl font-semibold text-zinc-900">AnswerSnippet</h2>
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
            <h2 className="text-xl font-semibold text-zinc-900">Resumo para IA</h2>
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
