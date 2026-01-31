
import type { Metadata } from "next";
import PuppiesGridPremium from "@/components/PuppiesGridPremium";
import { staticPuppies as RAW_STATIC_PUPPIES } from "@/content/puppies-static";
import type { Puppy } from "@/domain/puppy";
import { getRankedPuppies, type RankedPuppy } from "@/lib/ai/catalog-ranking";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { staticPuppies } from "@/content/puppies-static";

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
  // Fallback 100% estático: ignora Supabase e exibe apenas staticPuppies
  return [...RAW_STATIC_PUPPIES];
}

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function FilhotesPage({ searchParams }: PageProps) {
  const filters = buildFiltersFromSearchParams(searchParams);
  const puppies = await fetchPuppies(filters);


  // Corrige: status inicial deve ser em inglês para compatibilidade com todos os filhotes
  let initialStatus = "";
  if (filters.status) {
    const statusArr = Array.isArray(filters.status) ? filters.status : [filters.status];
    // Se o usuário passou um filtro, usa o valor original (em inglês)
    if (statusArr.length === 1) {
      initialStatus = statusArr[0];
    }
  } else {
    // Default: mostra todos disponíveis e reservados (em inglês)
    initialStatus = "";
  }
  const initialFilters = {
    color: filters.color ?? "",
    gender: filters.gender ?? "",
    status: initialStatus,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50/30">
      <PuppiesGridPremium initialItems={puppies} initialFilters={initialFilters} />
    </div>
  );
}























