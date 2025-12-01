import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SupabaseClient = ReturnType<typeof supabaseAdmin> | null;

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

async function hydrateMedia(record: any, client: SupabaseClient) {
  if (!record) return record;

  const rawImageList = Array.isArray(record.images) && record.images.length
    ? (record.images as unknown[])
    : parseStringList(record.midia ?? record.media);

  const resolvedImages = (
    await Promise.all(rawImageList.map((item) => resolveMediaUrl(item, client)))
  ).filter((url): url is string => Boolean(url));

  const resolvedCover = (await resolveMediaUrl(record.image_url ?? record.imageUrl ?? resolvedImages[0], client)) ?? null;
  const resolvedVideo = (await resolveMediaUrl(record.video_url ?? record.videoUrl, client)) ?? null;

  if (process.env.NODE_ENV !== "production") {
    console.debug("[admin-puppies-route] media hydration", {
      rawImageList,
      resolvedImages,
      resolvedCover,
      resolvedVideo,
    });
  }

  const images = resolvedImages.length ? resolvedImages : resolvedCover ? [resolvedCover] : [];

  return {
    ...record,
    image_url: resolvedCover,
    video_url: resolvedVideo,
    images,
    midia: images,
    media: images,
  };
}

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("puppies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hydrated = await hydrateMedia(data, supabase);
  return NextResponse.json({ puppy: hydrated });
}
