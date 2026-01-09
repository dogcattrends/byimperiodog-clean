import type { Puppy } from "@/domain/puppy";

export type RawPuppy = Record<string, unknown> & {
  id?: string | null;

  // nomes
  name?: string | null;
  nome?: string | null;

  // chaves comuns do banco/admin
  codigo?: string | null;
  slug?: string | null;
  status?: string | null;
  color?: string | null;
  cor?: string | null;
  sex?: string | null;
  gender?: string | null;
  city?: string | null;
  cidade?: string | null;
  state?: string | null;
  estado?: string | null;

  price_cents?: number | string | null;
  preco?: number | string | null;
  nascimento?: string | null;

  image_url?: string | null;
  cover_url?: string | null;
  video_url?: string | null;

  description?: string | null;
  descricao?: string | null;
  notes?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  midia?: unknown;
  media?: unknown;
  images?: unknown;
};

export type PuppyDTO = Record<string, unknown> & {
  id?: string | null;
  codigo?: string | null;
  nome: string;
  gender: "female" | "male" | string;
  status: string;
  color: string;
  price_cents: number | null;
  nascimento: string;
  image_url: string;
  descricao: string;
  notes: string;
  video_url: string;
  midia: string[];
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") {
        const anyEntry = entry as { url?: unknown; src?: unknown };
        if (typeof anyEntry.url === "string") return anyEntry.url;
        if (typeof anyEntry.src === "string") return anyEntry.src;
      }
      return null;
    })
    .filter((u): u is string => typeof u === "string" && u.length > 0);
}

export function normalizePuppy(input: RawPuppy): PuppyDTO {
  const nome = asString(input.nome) || asString(input.name);
  const gender = asString(input.gender) || asString(input.sex) || "female";
  const status = asString(input.status) || "disponivel";
  const color = asString(input.color) || asString(input.cor);
  const priceCents = asNumberOrNull(input.price_cents);
  const imageUrl = asString(input.image_url);
  const descricao = asString(input.descricao) || asString(input.description);
  const notes = asString(input.notes);
  const videoUrl = asString(input.video_url);
  const midiaList = toStringArray(input.midia);
  const mediaList = toStringArray(input.media);
  const imagesList = toStringArray(input.images);
  const midia = midiaList.length ? midiaList : mediaList.length ? mediaList : imagesList;

  return {
    ...(input as Record<string, unknown>),
    id: typeof input.id === "string" ? input.id : null,
    codigo: typeof input.codigo === "string" ? input.codigo : null,
    nome,
    gender,
    status,
    color,
    price_cents: priceCents,
    nascimento: asString(input.nascimento),
    image_url: imageUrl,
    descricao,
    notes,
    video_url: videoUrl,
    midia,
  };
}

type MediaObj = {
  url?: string | null;
  type?: string | null;
  is_cover?: boolean | null;
  isCover?: boolean | null;
};

function cleanUrl(url?: string | null) {
  const u = (url ?? "").trim();
  return u.length ? u : null;
}

function stripQuery(url: string) {
  return url.split("?")[0].toLowerCase();
}

function extOf(url: string) {
  const clean = stripQuery(url);
  const m = clean.match(/\.(png|jpg|jpeg|webp|gif)$/);
  return m?.[1] ?? "";
}

function asMediaList(puppy: Puppy | RawPuppy): MediaObj[] {
  const p = puppy as RawPuppy;

  // 1) seu banco
  if (Array.isArray(p?.midia)) return p.midia as MediaObj[];

  // 2) outros possíveis
  if (Array.isArray(p?.media)) return p.media as MediaObj[];

  // 3) domínio pode ter images:
  // - string[]
  // - { url }[]
  if (Array.isArray((p as RawPuppy)?.images)) {
    const arr = (p as RawPuppy).images as unknown[];
    if (arr.length && typeof arr[0] === "string") {
      return (arr as string[]).map((u) => ({ url: u, type: "image" }));
    }
    return arr as MediaObj[];
  }

  if (Array.isArray((puppy as Puppy)?.images)) {
    const arr = (puppy as Puppy).images;
    return arr.map((u) => ({ url: u, type: "image" }));
  }

  return [];
}

export function getCoverImage(
  puppy: Puppy | RawPuppy
): { url: string; alt?: string; unoptimized?: boolean } | null {
  const list = asMediaList(puppy)
    .map((m) => ({ ...m, url: cleanUrl(m.url) }))
    .filter((m) => Boolean(m.url)) as Array<Required<Pick<MediaObj, "url">> & MediaObj>;

  if (!list.length) return null;

  // 1) se tiver item marcado como capa
  const flagged = list.find((m) => m.is_cover || m.isCover);
  if (flagged?.url) {
    const ext = extOf(flagged.url);
    return {
      url: flagged.url,
      alt: (puppy as any)?.name ?? (puppy as any)?.nome ?? "Filhote",
      unoptimized: ext === "gif",
    };
  }

  // 2) filtra imagens (type=image) — se type vazio, aceita
  const imagesOnly = list.filter((m) => {
    const t = (m.type ?? "").toLowerCase();
    return !t || t === "image";
  });

  const candidates = imagesOnly.length ? imagesOnly : list;

  // 3) escolha a primeira imagem disponível (ACEITAR GIFs como capa)
  const chosen = candidates[0];
  if (!chosen?.url) return null;
  const ext = extOf(chosen.url);
  return {
    url: chosen.url,
    alt: (puppy as any)?.name ?? (puppy as any)?.nome ?? "Filhote",
    unoptimized: ext === "gif",
  };
}
