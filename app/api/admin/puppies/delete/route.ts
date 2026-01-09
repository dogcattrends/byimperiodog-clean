import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { clearAdminSupabaseCookies, isJwtExpiredError } from "@/lib/adminSession";
import { supabaseAdminOrUser } from "@/lib/supabaseAdminOrUser";

function publicUrlToPath(url: string): { bucket: string | null; path: string | null } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return { bucket: null, path: null };
  const normalized = url.replace(`${base}/storage/v1/object/public/`, "");
  const [bucket, ...rest] = normalized.split("/");
  if (!bucket || !rest.length) return { bucket: null, path: null };
  return { bucket, path: rest.join("/") };
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const { client: sb, mode } = supabaseAdminOrUser(req);
  if (!sb) {
    return NextResponse.json(
      { ok: false, error: mode === "missing_token" ? "Sessao admin ausente. Refaça login." : "Cliente Supabase indisponível." },
      { status: 401 },
    );
  }

  // Fetch media fields from the puppy record so we can delete associated files.
  // Try a targeted select first; if it fails (missing columns), fall back to selecting all columns.
  let puppy: any = null;
  try {
    const { data, error } = await sb.from("puppies").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    puppy = data;
  } catch (err) {
    if (isJwtExpiredError(err)) {
      clearAdminSupabaseCookies();
      return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
    }
    try {
      // fallback to selecting all columns
      const { data, error } = await sb.from("puppies").select("*").eq("id", id).maybeSingle();
      if (!error) puppy = data;
    } catch (e) {
      if (isJwtExpiredError(e)) {
        clearAdminSupabaseCookies();
        return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
      }
      // If we still can't fetch the row, log and continue to attempt delete (no media cleanup)
      try { console.error('[puppies/delete] failed to fetch puppy for media cleanup', String(e)); } catch (err) { void err; }
    }
  }

  const urls: string[] = [];
  if (puppy) {
    if (Array.isArray(puppy.media)) urls.push(...(puppy.media as string[]));
    if (typeof puppy.midia === "string" && puppy.midia) {
      try {
        const parsed = JSON.parse(puppy.midia);
        if (Array.isArray(parsed)) parsed.forEach((item: any) => item?.url && urls.push(String(item.url)));
      } catch (e) { void e; }
    }
    if (puppy.cover_url) urls.push(puppy.cover_url);
    if (puppy.video_url) urls.push(puppy.video_url);
  }

  // Group by bucket and attempt removal
  const pathsByBucket = new Map<string, string[]>();
  // Group urls by bucket using helper
  urls.forEach((u) => {
    const { bucket, path } = publicUrlToPath(u);
    if (bucket && path) {
      pathsByBucket.set(bucket, [...(pathsByBucket.get(bucket) ?? []), path]);
    }
  });

  await Promise.all(
    Array.from(pathsByBucket.entries()).map(([bucket, paths]) => sb.storage.from(bucket).remove(paths).catch(() => null)),
  );

  const { error } = await sb.from("puppies").delete().eq("id", id);
  if (error) {
    if (isJwtExpiredError(error)) {
      clearAdminSupabaseCookies();
      return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

