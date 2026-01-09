/**
 * mapDbPuppyToDomain
 * Converte um registro bruto do banco (possivelmente com campos PT-BR)
 * para o tipo de domínio `Puppy` garantindo campos normalizados:
 * - `name` (nome/name)
 * - `priceCents` (price_cents / preco)
 * - `status` normalizado para enum do domínio
 * - `images` (lista de URLs absolutos quando possível)
 * - `midia` preservada como array de strings para compatibilidade
 */
import { PuppyHelpers, type Puppy } from "../../domain/puppy";
import { PUPPY_COLORS, type City, type Color, type PuppyStatus } from "../../domain/taxonomies";

// Tipo híbrido para registros do DB com campos em PT e EN
type DbPuppyRow = Record<string, unknown> & {
  id?: string | number;
  nome?: string | null;
  name?: string | null;
  cor?: string | null;
  color?: string | null;
  sexo?: string | null;
  gender?: string | null;
  nascimento?: string | null;
  birth_date?: string | null;
  birthDate?: string | null;
  price_cents?: number | null;
  priceCents?: number | null;
  price?: number | string | null;
  preco?: string | number | null;
  status?: string | null;
  estado_status?: string | null;
  status_pt?: string | null;
  midia?: unknown;
  media?: unknown;
  images?: unknown;
  city?: string | null;
  cidade?: string | null;
  vaccinationStatus?: string | null;
  source?: string | null;
  reserved_by?: string | null;
  reservedBy?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  cost_cents?: number | null;
  costCents?: number | null;
  profit_margin_percentage?: number | null;
  profitMarginPercentage?: number | null;
  descricao?: string | null;
  description?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  reservation_expires_at?: string | null;
  reserved_at?: string | null;
  sold_at?: string | null;
  estado?: string | null;
  state?: string | null;
  is_highlighted?: boolean | null;
  isHighlighted?: boolean | null;
  is_featured?: boolean | null;
  isFeatured?: boolean | null;
  is_best_seller?: boolean | null;
  isBestSeller?: boolean | null;
  is_new_arrival?: boolean | null;
  isNewArrival?: boolean | null;
  pedigree?: boolean | unknown;
  microchip?: boolean | unknown;
  aggregate_rating?: number | null;
  average_rating?: number | null;
  review_count?: number | null;
  view_count?: number | null;
  favorite_count?: number | null;
  share_count?: number | null;
  inquiry_count?: number | null;
};

const URL_REGEX = new RegExp('^(https?:\\/\\/)[\\w.-]+(?:\\/[\\w\\-.~:@%\\/?#&+=]*)?$', 'i');
const CITY_SLUG_REGEX = /^[a-z0-9-]{2,60}$/;

function coerceColor(input?: string | null): Color {
  const val = (input || "").toLowerCase();
  const COLOR_SYNONYMS: Record<string, Color> = {
    orange: "laranja",
    "grey-white": "particolor",
    "gray-white": "particolor",
    white: "branco",
    black: "preto",
    grey: "sable",
    gray: "sable",
  };
  const mapped = (COLOR_SYNONYMS[val] as string) || val;
  const values = Object.keys(PUPPY_COLORS) as Color[];
  return (values.includes(mapped as Color) ? (mapped as Color) : "creme");
}

function coerceCity(input?: string | null): City {
  const val = (input || "sao-paulo").toLowerCase();
  return CITY_SLUG_REGEX.test(val) ? (val as City) : ("sao-paulo" as City);
}

function coerceStatus(input?: string | null): PuppyStatus {
  const val = (input || "available").toLowerCase();
  if (val === "disponivel") return "available";
  if (val === "reservado") return "reserved";
  if (val === "vendido") return "sold";
  if (["available", "reserved", "sold", "pending", "unavailable"].includes(val)) return val as PuppyStatus;
  return "available";
}

function safeDate(input?: string | null): Date {
  if (!input) return new Date();
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function stripHtml(input?: string | null): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

function parseMediaField(raw?: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((it) => {
        if (typeof it === "string") return it;
        if (it && typeof (it as Record<string, unknown>).url === "string") {
          return (it as { url: string }).url;
        }
        return null;
      })
      .filter((u): u is string => typeof u === "string" && u.length > 0);
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parseMediaField(parsed);
      return [];
    } catch {
      // pode ser uma única url
      return [s];
    }
  }
  return [];
}

export function mapDbPuppyToDomain(dbRow: DbPuppyRow): Puppy {
  const b = dbRow || {};

  const name = (b.nome || b.name || "filhote").toString().trim();
  const color = coerceColor(b.cor || b.color);
  const genderValue = (b.sexo || b.gender || "male").toString().toLowerCase();
  const sex = genderValue === "femea" || genderValue === "female" ? "female" : "male";
  const birthDate = safeDate(b.nascimento || b.birth_date || b.birthDate);

  // priceCents
  let priceCents = typeof b.price_cents === "number" ? b.price_cents : typeof b.priceCents === "number" ? b.priceCents : 0;
  if ((!priceCents || priceCents === 0) && typeof b.price === "number" && Number.isFinite(b.price)) {
    // No puppies_v2, `price` já vem em centavos (ver migração de sync).
    priceCents = Math.round(b.price);
  }
  if ((!priceCents || priceCents === 0) && typeof b.price === "string" && b.price.trim()) {
    const parsed = Number(b.price.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) priceCents = Math.round(parsed);
  }
  if ((!priceCents || priceCents === 0) && b.preco) {
    const asNum = typeof b.preco === "number" ? b.preco : parseFloat(String(b.preco).replace(/[^0-9.,-]/g, "").replace(/,/g, "."));
    if (!Number.isNaN(asNum)) priceCents = Math.round(asNum * 100);
  }

  // midia/media/images normalization
  const parsedMidia = parseMediaField(b.midia ?? b.media ?? b.images);
  const images = parsedMidia.filter((u) => typeof u === "string" && u.length && URL_REGEX.test(u));
  const thumbnail = images.length > 0 ? images[0] : undefined;

  const description = stripHtml(b.descricao || b.description || "");

  const id = b.id || b._id || name.slice(0, 12);
  const slug = b.slug || PuppyHelpers.generateSlug(name, color, sex);

  const now = new Date();

  const puppy: Puppy = {
    id: String(id),
    slug: String(slug),
    name,
    title: name,
    description,
    priceCents: priceCents || 0,
    currency: "BRL",
    breed: "Spitz Alemão Anão",
    color,
    sex,
    birthDate,
    readyForAdoptionDate: new Date(birthDate.getTime() + 60 * 24 * 60 * 60 * 1000),
    images,
    thumbnailUrl: thumbnail,
    galleryImages: images,

    // localização
    city: coerceCity(b.cidade || b.city),
    state: ((b.estado || b.state || "SP") + "").toUpperCase(),
    availableForShipping: true,

    // flags
    isHighlighted: Boolean(b.is_highlighted || b.isHighlighted || false),
    isFeatured: Boolean(b.is_featured || b.isFeatured || false),
    isBestSeller: Boolean(b.is_best_seller || b.isBestSeller || false),
    isNewArrival: Boolean(b.is_new_arrival || b.isNewArrival || false),

    // defaults / domain fields
    size: "mini",

    hasPedigree: Boolean(b.pedigree),
    vaccinationStatus: (b.vaccinationStatus ?? "up-to-date") as "up-to-date" | "pending" | "incomplete",
    hasMicrochip: Boolean(b.microchip),

    averageRating: Number(b.aggregate_rating ?? b.average_rating ?? 0) || 0,
    reviewCount: Number(b.review_count ?? 0) || 0,
    viewCount: Number(b.view_count ?? 0) || 0,
    favoriteCount: Number(b.favorite_count ?? 0) || 0,
    shareCount: Number(b.share_count ?? 0) || 0,
    inquiryCount: Number(b.inquiry_count ?? 0) || 0,

    source: (b.source ?? "own-breeding") as "own-breeding" | "partner" | "external",

    seoKeywords: [],
    createdAt: safeDate(b.created_at || b.createdAt || now.toISOString()),
    updatedAt: safeDate(b.updated_at || b.updatedAt || now.toISOString()),

    // garantir timestamps e valores mínimos do domínio
    reservationExpiresAt: b.reservation_expires_at ? safeDate(b.reservation_expires_at) : undefined,
    reservedAt: b.reserved_at ? safeDate(b.reserved_at) : undefined,
    soldAt: b.sold_at ? safeDate(b.sold_at) : undefined,
    reservedBy: b.reserved_by ?? b.reservedBy,
    internalNotes: b.notes ?? b.internalNotes,
    costCents: Number(b.cost_cents ?? b.costCents ?? 0) || 0,
    profitMarginPercentage: Number(b.profit_margin_percentage ?? b.profitMarginPercentage ?? 0) || 0,
  } as unknown as Puppy;

  // adicionar campos compatíveis com helpers de mídia existentes (midia/media)
  // preserva a lista bruta (strings) e também mantém `images` (string[])
  const puppyWithMidia = puppy as Puppy & { midia: string[]; media: Array<{ url: string; type: string }>; status: PuppyStatus };
  puppyWithMidia.midia = parsedMidia;
  puppyWithMidia.media = parsedMidia.map((u) => ({ url: u, type: "image" }));

  // status normalizado
  puppyWithMidia.status = coerceStatus(b.status ?? b.estado_status ?? b.status_pt);

  return puppyWithMidia as Puppy;
}

export default mapDbPuppyToDomain;

/**
 * Mapeia status do domínio (en) para o enum do banco (pt-BR).
 * Útil antes de inserts/updates para evitar violação de check constraint.
 */
export function mapDomainStatusToDb(status?: string) {
  const s = (status || "").toString().toLowerCase();
  const map: Record<string, string> = {
    available: "disponivel",
    reserved: "reservado",
    sold: "vendido",
    pending: "indisponivel",
    unavailable: "indisponivel",
    disponivel: "disponivel",
    reservado: "reservado",
    vendido: "vendido",
    indisponivel: "indisponivel",
  };
  return map[s] ?? "disponivel";
}
