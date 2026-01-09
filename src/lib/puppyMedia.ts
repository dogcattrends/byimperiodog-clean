import type { Puppy } from "@/domain/puppy";

export type PuppyMediaItem = {
  url?: string | null;
  path?: string | null;
  type?: string | null;
  poster?: string | null;
  posterUrl?: string | null;
  thumbnailUrl?: string | null;
  isCover?: boolean;
  is_cover?: boolean;
  order?: number;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "puppy-images";

const isImageExtension = (url: string) => /\.(png|jpe?g|webp|avif)(\?.*)?$/i.test(url);
const isVideoExtension = (url: string) => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);

const toAbsoluteUrl = (raw?: string | null) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!SUPABASE_URL) return null;
  const normalized = trimmed.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${normalized}`;
};

export const normalizeMedia = (puppy: Puppy | any) => {
  const rawSources: Array<PuppyMediaItem | string> = [
    ...(puppy?.midia ?? puppy?.media ?? []),
    ...(puppy?.galleryImages ?? []),
    ...(puppy?.images ?? []),
  ];
  if (Array.isArray(rawSources)) {
    return rawSources
      .map<PuppyMediaItem | null>((entry) => {
        if (!entry) return null;
        if (typeof entry === "string") return { url: entry };
        return entry;
      })
      .filter((entry): entry is PuppyMediaItem => Boolean(entry))
      .map((item, index) => ({
        url: toAbsoluteUrl(item.url ?? item.path ?? item.poster ?? item.thumbnailUrl ?? undefined),
        poster: toAbsoluteUrl(item.poster ?? item.posterUrl ?? item.thumbnailUrl ?? undefined),
        type: (item.type ?? "").toLowerCase(),
        isCover: Boolean(item.isCover ?? item.is_cover),
        order: typeof item.order === "number" ? item.order : index,
      }))
      .filter((item) => Boolean(item.url)) as Array<
      Required<Pick<PuppyMediaItem, "url">> & { type: string; poster?: string; isCover: boolean; order: number }
    >;
  }
  return [];
};

export type CoverMedia =
  | { kind: "video"; url: string; poster?: string }
  | { kind: "image"; url: string }
  | { kind: "none" };

export function getCoverMedia(puppy: Puppy | any): CoverMedia {
  const normalized = normalizeMedia(puppy);

  const videoCandidates = normalized
    .filter((item) => item.type.includes("video") || isVideoExtension(item.url ?? ""))
    .sort((a, b) => (a.isCover === b.isCover ? a.order - b.order : b.isCover ? 1 : -1));

  if (videoCandidates.length) {
    const video = videoCandidates[0];
    const poster =
      video.poster ||
      normalized.find((item) => (item.type.includes("image") || isImageExtension(item.url ?? "")))?.url;
    return { kind: "video", url: String(video.url), poster: poster ? String(poster) : undefined };
  }

  const imageCandidates = normalized
    .filter((item) => item.type.includes("image") || isImageExtension(item.url ?? ""))
    .sort((a, b) => (a.isCover === b.isCover ? a.order - b.order : b.isCover ? 1 : -1));

  if (imageCandidates.length) {
    const image = imageCandidates[0];
    return { kind: "image", url: String(image.url) };
  }

  return { kind: "none" };
}

// --- Compat layer (API anterior) ---------------------------------
type Cover = { url: string; alt?: string; unoptimized?: boolean } | null;

export function getCoverImage(puppy: Puppy | any): Cover {
  const m = getCoverMedia(puppy);
  if (m.kind === "image") return { url: m.url, alt: puppy?.name ?? puppy?.nome ?? "Filhote", unoptimized: false };
  if (m.kind === "video") {
    // prefer poster if available, otherwise return video url as fallback
    const poster = m.poster;
    if (poster) return { url: poster, alt: puppy?.name ?? puppy?.nome ?? "Filhote", unoptimized: false };
    return { url: m.url, alt: puppy?.name ?? puppy?.nome ?? "Filhote", unoptimized: false };
  }
  return null;
}

