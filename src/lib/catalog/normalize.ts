/**
 * NORMALIZAÇÃO DE DADOS
 * Centraliza a conversão de registros do Supabase para o tipo `Puppy` de domínio.
 * Inclui validação (Zod), saneamento e defaults seguros.
 */

import { z } from "zod";

import { PuppyHelpers, type Puppy } from "@/domain/puppy";
import { PUPPY_COLORS, type City, type Color, type PuppyStatus } from "@/domain/taxonomies";

// Paleta controlada; evita valores fora da taxonomia
const COLOR_VALUES: Color[] = Object.keys(PUPPY_COLORS) as Color[];

const CITY_SLUG_REGEX = /^[a-z0-9-]{2,60}$/;
const URL_REGEX = /^(https?:\/\/)[\w.-]+(?:\/[\w\-.~:@%/?#&+=]*)?$/i;

export const RawPuppySchema = z.object({
  id: z.string().uuid().or(z.string().min(8)),
  slug: z.string().min(2).max(160).optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(4000).optional(),
  price_cents: z.number().int().min(0).max(5_000_000).default(0),
  color: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  birth_date: z.string().datetime().optional(),
  images: z.array(z.string().regex(URL_REGEX)).max(32).optional(),
  city: z.string().regex(CITY_SLUG_REGEX).optional(),
  state: z.string().min(2).max(2).optional(),
  status: z.string().optional(),
  aggregate_rating: z.number().min(0).max(5).optional(),
  review_count: z.number().int().min(0).optional(),
  view_count: z.number().int().min(0).optional(),
  favorite_count: z.number().int().min(0).optional(),
  share_count: z.number().int().min(0).optional(),
  inquiry_count: z.number().int().min(0).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type RawPuppyFromDB = z.infer<typeof RawPuppySchema>;

function coerceColor(input?: string): Color {
  const val = (input || "").toLowerCase();
  return (COLOR_VALUES.includes(val as Color) ? (val as Color) : "creme");
}

function coerceCity(input?: string): City {
  const val = (input || "sao-paulo").toLowerCase();
  return val as City; // cidade é slug controlado na base
}

function coerceStatus(input?: string): PuppyStatus {
  const val = (input || "available").toLowerCase();
  // Mapeia português para inglês
  if (val === "disponivel") return "available";
  if (val === "reservado") return "reserved";
  if (val === "vendido") return "sold";
  if (["available", "reserved", "sold", "pending", "unavailable"].includes(val)) {
    return val as PuppyStatus;
  }
  return "available";
}

function safeDate(input?: string): Date {
  if (!input) return new Date();
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function stripHtml(input?: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

export function normalizePuppyFromDB(rawInput: unknown): Puppy {
  const raw = RawPuppySchema.safeParse(rawInput);
  const base = raw.success ? raw.data : (rawInput as Partial<RawPuppyFromDB>);
  const b = base as Partial<Record<string, unknown>>;

  // Suporta campos em português e inglês
  const name = ((b.nome as string) || (b.name as string) || "filhote").trim();
  const color = coerceColor((b.cor as string) || (b.color as string));
  const genderValue = (b.sexo as string) || (b.gender as string);
  const sex = genderValue === "femea" || genderValue === "female" ? "female" : "male";
  const birthDate = safeDate((b.nascimento as string) || (b.birth_date as string));

  // Preço: converte de decimal para centavos se necessário
  let priceCents = (b.price_cents as number) ?? 0;
  if ((b.preco as string) && !b.price_cents) {
    const precoDecimal = parseFloat(b.preco as string);
    priceCents = Math.round(precoDecimal * 100);
  }

  // Mapeia campo 'midia' do banco para 'images'
  const midiaArray = (b.midia as unknown) || (b.images as unknown) || [];
  const images = Array.isArray(midiaArray)
    ? (midiaArray as unknown[])
      .filter((item) => item && (typeof item === 'string' || ((item as Record<string, unknown>)?.url)))
      .map((item) => (typeof item === 'string' ? (item as string) : ((item as Record<string, unknown>).url as string)))
        .filter((u: string) => URL_REGEX.test(u))
    : [];
  const thumbnail = images.length > 0 ? images[0] : undefined;

  // Descrição em português ou inglês
  const description = stripHtml((b.descricao as string) || (b.description as string)) || "";

  return {
    id: base.id as string,
    slug: base.slug || PuppyHelpers.generateSlug(name, color, sex),
    name,
    title: name,
    description,
    priceCents,
    currency: "BRL",
    breed: "Spitz Alemão Anão",
    color,
    sex,
    size: "mini",
    birthDate,
    readyForAdoptionDate: new Date(birthDate.getTime() + 60 * 24 * 60 * 60 * 1000),
    images,
    thumbnailUrl: thumbnail,
    city: coerceCity(((b.cidade as string) || (b.city as string))),
    state: (((b.estado as string) || (b.state as string) || "SP").toUpperCase()),
    availableForShipping: true,
    status: coerceStatus(b.status as string),
    isHighlighted: false,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    source: "own-breeding",
    hasPedigree: true,
    vaccinationStatus: "up-to-date",
    hasMicrochip: false,
    averageRating: (b.aggregate_rating as number) ?? 0,
    reviewCount: (b.review_count as number) ?? 0,
    viewCount: (b.view_count as number) ?? 0,
    favoriteCount: (b.favorite_count as number) ?? 0,
    shareCount: (b.share_count as number) ?? 0,
    inquiryCount: (b.inquiry_count as number) ?? 0,
    seoKeywords: [],
    createdAt: safeDate(b.created_at as string),
    updatedAt: safeDate(b.updated_at as string),
  };
}
