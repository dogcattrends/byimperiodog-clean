import type { Metadata } from "next";
import dynamicImport from "next/dynamic";

import PrimaryCTA from "@/components/ui/PrimaryCTA";
import TrustBlock from "@/components/ui/TrustBlock";
import type { Puppy } from "@/domain/puppy";
import { getRankedPuppies, type RankedPuppy } from "@/lib/ai/catalog-ranking";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { routes } from "@/lib/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { TRUST_BLOCK_ITEMS } from "@/lib/trust-data";

const PuppiesGridPremium = dynamicImport(() => import("@/components/PuppiesGridPremium"), {
  ssr: true,
  loading: () => (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="h-96 rounded-3xl bg-gradient-to-br from-zinc-100 to-zinc-50 animate-pulse" />
      </div>
    </section>
  ),
});

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

const ensureArray = (value?: string | string[] | null) => {
  if (!value) return [] as string[];
  return Array.isArray(value) ? value : [value];
};

const normalizeStatusFilter = (value?: string | string[]) => {
  const list = ensureArray(value);
  if (list.length === 0) return [...DEFAULT_STATUSES];
  const map: Record<string, string> = {
    available: "disponivel",
    reserved: "reservado",
    sold: "vendido",
  };
  const normalized = list
    .map((status) => status?.toLowerCase())
    .map((status) => map[status] || status)
    .filter((status): status is string => Boolean(status));
  return normalized.length > 0 ? normalized : [...DEFAULT_STATUSES];
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

export const metadata: Metadata = {
  title: "Filhotes disponíveis premium | By Império Dog",
  description:
    "Escolha filhotes de Spitz Alemão Anão e Lulu da Pomerânia com pedigree CBKC, triagem veterinária e mentoria vitalícia. Processo transparente e suporte direto com a criadora.",
  alternates: { canonical: "/filhotes" },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchPuppies(filters: CatalogFilters): Promise<CatalogPuppy[]> {
  try {
    const normalizedStatuses = normalizeStatusFilter(filters.status);
    const ranked = await getRankedPuppies({
      status: normalizedStatuses,
      color: filters.color,
      gender: filters.gender,
      city: filters.city,
      state: filters.state,
      limit: 60,
    });

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

    const sb = supabaseAdmin();
    let query = sb.from("puppies").select("*");

    if (normalizedStatuses.length === 1) {
      query = query.eq("status", normalizedStatuses[0]);
    } else if (normalizedStatuses.length > 1) {
      query = query.in("status", normalizedStatuses);
    }

    if (filters.color) query = query.eq("color", filters.color);
    if (filters.gender) query = query.eq("gender", filters.gender);
    if (filters.city) query = query.eq("city", filters.city);
    if (filters.state) query = query.eq("state", filters.state);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(60);

    if (error) {
      console.error("[catalog] Erro ao buscar filhotes (fallback):", error);
      return [];
    }

    return (data ?? []).map((raw: any) => ({
      ...normalizePuppyFromDB(raw),
      rankingFlag: undefined,
      rankingScore: undefined,
      rankingReason: undefined,
    }));
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
  const puppies = await fetchPuppies(filters);

  const normalizedStatuses = normalizeStatusFilter(filters.status);
  const initialFilters = {
    color: filters.color ?? "",
    gender: filters.gender ?? "",
    status: normalizedStatuses.length === 1 ? normalizedStatuses[0] : "",
  };

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

      <section id="catalog" className="pb-16">
        <PuppiesGridPremium
          initialItems={puppies}
          initialFilters={initialFilters}
          cardOptions={{
            showPrice: false,
            showContactCTA: false,
            primaryLabel: "Quero esse filhote",
            ctaTrackingId: "filhotes_card_primary",
          }}
        />
      </section>
    </main>
  );
}
