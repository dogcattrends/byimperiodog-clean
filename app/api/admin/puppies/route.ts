import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { clearAdminSupabaseCookies, isJwtExpiredError } from "@/lib/adminSession";
import { supabaseAdminOrUser } from "@/lib/supabaseAdminOrUser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any | null;

function parseStringList(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((item) => String(item)).filter(Boolean);
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean);
      } catch {
        // ignore JSON parse errors and fall back to split below
      }
    }
    return trimmed
      .split(/[\n;,|]/)
      .map((chunk) => chunk.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }
  return [];
}

function extractBucketPath(raw: string): { bucket: string | null; path: string | null } {
  let value = raw.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\//i, "");
  value = value.replace(/^public\//, "");
  if (value.startsWith("storage/v1/object/public/")) {
    value = value.replace(/^storage\/v1\/object\/public\//, "");
  }

  const match = value.match(/^(?<bucket>[^/]+)\/(?<path>.+)$/);
  if (match?.groups?.bucket && match?.groups?.path) {
    return { bucket: match.groups.bucket, path: match.groups.path };
  }

  return { bucket: null, path: null };
}

async function resolveMediaUrl(rawInput: unknown, client: SupabaseClient): Promise<string | null> {
  if (rawInput == null) return null;
  const raw = String(rawInput).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const { bucket, path } = extractBucketPath(raw);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

  if (bucket && path) {
    if (client?.storage) {
      try {
        const { data: signed } = await client.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
        if (signed?.signedUrl) return signed.signedUrl;
      } catch (err) {
        console.warn("[puppies-route] Falha ao gerar URL assinada", err);
      }

      const { data: pub } = client.storage.from(bucket).getPublicUrl(path);
      if (pub?.publicUrl) return pub.publicUrl;
    }

    if (base) return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }

  if (base) return `${base}/storage/v1/object/public/${raw.replace(/^\/+/, "")}`;
  return raw;
}

function inferTypeFromUrl(url: string): "image" | "video" {
  return /\.(mp4|webm|mov|m4v)$/i.test(url) ? "video" : "image";
}

async function hydrateMedia(record: unknown, client: SupabaseClient) {
  if (!record) return record;

  const rec = record as Record<string, unknown>;

  const rawMediaArray = Array.isArray(rec.midia) ? (rec.midia as unknown[]) : undefined;
  const fallbackList = rawMediaArray && rawMediaArray.length ? [] : parseStringList(rec.images ?? rec.media ?? rec.midia);
  const mediaSource = rawMediaArray && rawMediaArray.length ? rawMediaArray : fallbackList;

  const resolvedEntries = (
    await Promise.all(
      (mediaSource as unknown[]).map(async (entry) => {
        let baseUrl = "";
        if (typeof entry === "string") baseUrl = entry;
        else if (entry && typeof entry === "object") {
          const obj = entry as Record<string, unknown>;
          if (typeof obj.url === "string") baseUrl = obj.url;
          else if (typeof obj.src === "string") baseUrl = obj.src;
        }
        if (!baseUrl) return null;
        const resolvedUrl = await resolveMediaUrl(baseUrl, client);
        if (!resolvedUrl) return null;
        let type: "image" | "video" = "image";
        if (entry && typeof entry === "object") {
          const obj = entry as Record<string, unknown>;
          if (obj.type === "video") type = "video";
        }
        return {
          url: resolvedUrl,
          type: type === "video" ? "video" : inferTypeFromUrl(resolvedUrl),
        };
      })
    )
  ).filter((item): item is { url: string; type: "image" | "video" } => Boolean(item));

  const explicitVideo = await resolveMediaUrl((rec.video_url ?? rec.videoUrl) as unknown, client);
  if (explicitVideo && !resolvedEntries.some((entry) => entry.type === "video")) {
    resolvedEntries.push({ url: explicitVideo, type: "video" });
  }

  const imageUrls = resolvedEntries.filter((entry) => entry.type === "image").map((entry) => entry.url);
  const videoUrls = resolvedEntries.filter((entry) => entry.type === "video").map((entry) => entry.url);
  const resolvedCover = imageUrls[0] ?? (await resolveMediaUrl((rec.image_url ?? rec.imageUrl) as unknown, client)) ?? null;

  const finalImages = imageUrls.length ? imageUrls : resolvedCover ? [resolvedCover] : [];

  return {
    ...(rec as Record<string, unknown>),
    image_url: resolvedCover,
    video_url: videoUrls[0] ?? explicitVideo ?? null,
    images: finalImages,
    media: finalImages,
    midia: resolvedEntries,
  };
}

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { client: supabase, mode } = supabaseAdminOrUser(req);
  if (!supabase) {
    return NextResponse.json(
      { error: mode === "missing_token" ? "Sessao admin ausente. Refaça login." : "Cliente Supabase indisponível." },
      { status: 401 },
    );
  }
  const { data, error } = await supabase
    .from("puppies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isJwtExpiredError(error)) {
      clearAdminSupabaseCookies();
      return NextResponse.json({ error: "Sessão expirada. Refaça login." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hydrated = await hydrateMedia(data, supabase);
  return NextResponse.json({ puppy: hydrated });
}
