import type { Metadata } from "next";

import PuppiesGridPremium from "@/components/PuppiesGridPremium";
import type { Puppy } from "@/domain/puppy";
import { getRankedPuppies, type RankedPuppy } from "@/lib/ai/catalog-ranking";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
  title: "Filhotes Disponíveis - Spitz Alemão (Lulu da Pomerânia) | By Imperio Dog",
  description:
    "Descubra filhotes de Spitz Alemão (Lulu da Pomerânia) disponíveis com saúde garantida, pedigree e suporte completo. Reserve seu filhote de forma segura hoje mesmo.",
  alternates: {
    canonical: "/filhotes",
  },
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

    return (data ?? []).map((raw) => ({
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
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50/30">
      <PuppiesGridPremium initialItems={puppies} initialFilters={initialFilters} />
    </div>
  );
}























