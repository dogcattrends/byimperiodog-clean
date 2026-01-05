import { randomUUID } from "crypto";
import fs from "fs";
import { Buffer } from "node:buffer";
import path from "path";

import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeFilename } from "@/lib/uploadValidation";

const STORAGE_BUCKET = "puppies";

// Module-level appendLog used by helper functions. Writes to tmp/puppies-manage.log
const LOG_PATH = path.join(process.cwd(), "tmp", "puppies-manage.log");
function appendLog(obj: unknown) {
  try {
    const line = `[${new Date().toISOString()}] ${JSON.stringify(obj)}\n`;
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, line);
  } catch (e) {
    void e;
  }
}

type OrderEntry = {
  type: "existing" | "new";
  ref: string;
};

type JsonBody = {
  id?: string;
  name?: string;
  slug?: string | null;
  color?: string | null;
  sex?: string | null;
  city?: string | null;
  state?: string | null;
  priceCents?: number | null;
  status?: string | null;
  description?: string | null;
};

function mapStatusToDb(status?: string | null) {
  const value = (status || "disponivel").toLowerCase();
  if (value === "sold" || value === "vendido") return "vendido";
  if (value === "reserved" || value === "reservado") return "reservado";
  if (value === "indisponivel" || value === "unavailable" || value === "pending") return "indisponivel";
  return "disponivel";
}

function mapSexToDb(sex?: string | null) {
  const value = (sex || "femea").toLowerCase();
  return value === "male" || value === "macho" ? "macho" : "femea";
}

function normalizeGender(sex?: string | null) {
  const value = (sex || "female").toLowerCase();
  return value === "macho" || value === "male" ? "male" : "female";
}

function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean);
    }
  } catch (e) {
    void e;
  }
  return [];
}

function parseOrder(value: FormDataEntryValue | null): OrderEntry[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const type = item.type === "new" ? "new" : item.type === "existing" ? "existing" : null;
          const ref = typeof item.ref === "string" ? item.ref : typeof item.url === "string" ? item.url : null;
          if (!type || !ref) return null;
          return { type, ref } satisfies OrderEntry;
        })
        .filter((x): x is OrderEntry => x !== null);
    }
  } catch (e) {
    void e;
  }
  return [];
}

function extractFileToken(file: File): { token: string | null; originalName: string } {
  const name = file.name || "";
  if (name.includes("::")) {
    const [token, ...rest] = name.split("::");
    return { token: token || null, originalName: rest.join("::") || "upload" };
  }
  return { token: null, originalName: name || "upload" };
}

function publicUrlToPath(url: string): { bucket: string | null; path: string | null } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return { bucket: null, path: null };
  const normalized = url.replace(`${base}/storage/v1/object/public/`, "");
  const [bucket, ...rest] = normalized.split("/");
  if (!bucket || !rest.length) return { bucket: null, path: null };
  return { bucket, path: rest.join("/") };
}

async function uploadMediaFile(sb: ReturnType<typeof supabaseAdmin>, file: File, type: "image" | "video", originalName: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extFromName = originalName.includes(".") ? originalName.split(".").pop() : undefined;
  const ext = extFromName ? extFromName.toLowerCase() : type === "image" ? "jpg" : "mp4";
  const safeBase = sanitizeFilename(originalName.replace(/\.[^.]+$/, "")) || type;
  const folder = new Date().toISOString().slice(0, 10);
  const objectPath = `${folder}/${safeBase}-${randomUUID()}.${ext}`;
  const storage = sb.storage.from(STORAGE_BUCKET);
  const { error } = await storage.upload(objectPath, buffer, {
    contentType: file.type || (type === "image" ? "image/jpeg" : "video/mp4"),
    upsert: false,
  });
  if (error) {
    try {
      const msg = String(error.message ?? error);
      appendLog({ event: "upload-error", message: msg, path: objectPath, bucket: STORAGE_BUCKET });
    } catch (e) {
      void e;
    }
    // Do not throw here: return null so caller can continue and save the record without new uploads
    return null;
  }
  const { data } = storage.getPublicUrl(objectPath);
  return data.publicUrl;
}

async function deleteMedia(sb: ReturnType<typeof supabaseAdmin>, urls: string[]) {
  if (!urls.length) return;
  const pathsByBucket = new Map<string, string[]>();
  urls.forEach((url) => {
    const { bucket, path } = publicUrlToPath(url);
    if (bucket && path) {
      pathsByBucket.set(bucket, [...(pathsByBucket.get(bucket) ?? []), path]);
    }
  });
  await Promise.all(
    Array.from(pathsByBucket.entries()).map(([bucket, paths]) =>
      sb.storage
        .from(bucket)
        .remove(paths)
        .catch(() => null),
    ),
  );
}

function buildOrderedList(order: OrderEntry[], existing: string[], uploads: Map<string, string>) {
  if (!order.length) {
    return [...existing, ...Array.from(uploads.values())];
  }
  const usedUploads = new Set<string>();
  const usedExisting = new Set<string>();
  const result: string[] = [];

  order.forEach((entry) => {
    if (entry.type === "existing" && existing.includes(entry.ref) && !usedExisting.has(entry.ref)) {
      result.push(entry.ref);
      usedExisting.add(entry.ref);
    } else if (entry.type === "new") {
      const uploaded = uploads.get(entry.ref);
      if (uploaded) {
        result.push(uploaded);
        usedUploads.add(entry.ref);
      }
    }
  });

  const leftoverExisting = existing.filter((url) => !usedExisting.has(url));
  const leftoverUploads = Array.from(uploads.entries())
    .filter(([token]) => !usedUploads.has(token))
    .map(([, url]) => url);

  return [...result, ...leftoverExisting, ...leftoverUploads];
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const logPath = path.join(process.cwd(), "tmp", "puppies-manage.log");
  try {
    const guard = requireAdmin(req);
    if (guard) return guard;

    const contentType = req.headers.get("content-type") || "";
    const sb = supabaseAdmin();

    // Garante que o bucket de storage existe (cria se ausente) - tentativa best-effort
    try {
      const maybeStorage = (sb as unknown as { storage?: { getBucket?: (name: string) => Promise<{ data?: unknown; error?: unknown }>; createBucket?: (name: string, opts?: unknown) => Promise<unknown> } }).storage;
      if (maybeStorage && typeof maybeStorage.getBucket === "function") {
        const { data: bInfo, error: bErr } = (await maybeStorage.getBucket(STORAGE_BUCKET)) as { data?: unknown; error?: unknown };
        if (bErr || !bInfo) {
          if (typeof maybeStorage.createBucket === "function") {
            await maybeStorage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});
          }
        }
      }
    } catch (e) {
      void e;
    }

    appendLog({ event: "request-start", url: req.url, method: "POST", contentType });

    if (!contentType.includes("multipart/form-data")) {
      const body = (await req.json().catch(() => ({}))) as JsonBody;
      appendLog({ event: "json-payload", payload: { id: body.id, name: body.name ?? null } });
      if (!body.id) {
        appendLog({ event: "missing-id" });
        return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
      }

      const updates: Record<string, unknown> = {};
      if (body.status) updates.status = mapStatusToDb(body.status);
      if (typeof body.priceCents === "number") {
        updates.price_cents = body.priceCents;
        updates.preco = body.priceCents / 100;
      }
      if (body.description !== undefined) {
        updates.descricao = body.description;
        updates.description = body.description;
      }
      updates.updated_at = new Date().toISOString();

      const { data, error } = await sb.from("puppies").update(updates).eq("id", body.id).select().maybeSingle();
          if (error) {
            appendLog({ event: "db-error", error: String(error) });
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
          }
          appendLog({ event: "updated", id: body.id, durationMs: Date.now() - start });
          return NextResponse.json({ ok: true, puppy: data });
    }

  const formData = await req.formData();
  // Log basic form keys for diagnostics (dev-only append)
  try {
    appendLog({ event: "formdata-keys", keys: Array.from((formData as any).keys()) });
  } catch (err) {
    void err;
  }
  const id = (formData.get("id") as string) || undefined;
  const name = (formData.get("name") as string) || "";
  const slug = (formData.get("slug") as string) || null;
  const color = (formData.get("color") as string) || null;
  const sex = (formData.get("sex") as string) || null;
  const _city = (formData.get("city") as string) || null;
  const _state = ((formData.get("state") as string) || "").toUpperCase() || null;
  // mark as used to satisfy lint rules without removing data (keeps origin info available for future)
  void _city;
  void _state;
  const priceCents = Number(formData.get("priceCents")) || 0;
  const status = (formData.get("status") as string) || null;
  const description = (formData.get("description") as string) || null;

  const existingPhotoUrls = parseJsonArray(formData.get("existingPhotoUrls"));
  const existingVideoUrls = parseJsonArray(formData.get("existingVideoUrls"));
  const deletedPhotoUrls = parseJsonArray(formData.get("deletedPhotoUrls"));
  const deletedVideoUrls = parseJsonArray(formData.get("deletedVideoUrls"));
  const photoOrder = parseOrder(formData.get("photoOrder"));
  const videoOrder = parseOrder(formData.get("videoOrder"));

  const photoFiles = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File);
  const videoFiles = formData
    .getAll("videos")
    .filter((item): item is File => item instanceof File);

  // Log file counts and some important values for diagnostics
  try {
    appendLog({
      event: "formdata-parsed",
      id,
      name,
      existingPhotoUrlsLength: existingPhotoUrls.length,
      existingVideoUrlsLength: existingVideoUrls.length,
      deletedPhotoUrlsLength: deletedPhotoUrls.length,
      deletedVideoUrlsLength: deletedVideoUrls.length,
      photoFilesCount: photoFiles.length,
      videoFilesCount: videoFiles.length,
      priceCents,
    });
  } catch (err) {
    void err;
  }

  await deleteMedia(sb, [...deletedPhotoUrls, ...deletedVideoUrls]);

  const uploadedPhotos = new Map<string, string>();
  for (const file of photoFiles) {
    const { token, originalName } = extractFileToken(file);
    const url = await uploadMediaFile(sb, file, "image", originalName);
    if (url) uploadedPhotos.set(token ?? randomUUID(), url);
  }

  const uploadedVideos = new Map<string, string>();
  for (const file of videoFiles) {
    const { token, originalName } = extractFileToken(file);
    const url = await uploadMediaFile(sb, file, "video", originalName);
    if (url) uploadedVideos.set(token ?? randomUUID(), url);
  }

  const orderedPhotoUrls = buildOrderedList(photoOrder, existingPhotoUrls, uploadedPhotos);
  const orderedVideoUrls = buildOrderedList(videoOrder, existingVideoUrls, uploadedVideos);

  const mediaPayload = [
    ...orderedPhotoUrls.map((url) => ({ url, type: "image" })),
    ...orderedVideoUrls.map((url) => ({ url, type: "video" })),
  ];

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    nome: name,
    name,
    slug,
    cor: color,
    color,
    sexo: mapSexToDb(sex),
    gender: normalizeGender(sex),
    // Do not store location on the puppy record — leads carry origin info
    // city,
    // cidade: city,
    // state,
    // estado: state,
    price_cents: priceCents,
    preco: Number.isFinite(priceCents) ? priceCents / 100 : null,
    status: mapStatusToDb(status),
    descricao: description,
    description,
    // store cover under `cover_url`; avoid writing `image_url` column which may not exist
    cover_url: orderedPhotoUrls[0] ?? null,
    video_url: orderedVideoUrls[0] ?? null,
    // `media` column is a string[] in the DB types — store photos and videos together
    media: [...orderedPhotoUrls, ...orderedVideoUrls],
    // `midia` remains a JSON-serialized payload for compatibility
    midia: JSON.stringify(mediaPayload),
    updated_at: now,
  };

  if (!id) {
    payload.created_at = now;
  }

  // Best-effort: fetch actual table columns to filter payload and avoid schema-mismatch errors.
  // We declare defaults here and compute `finalPayload` below so we never send unknown columns.
  const defaultCols = [
    "id",
    "codigo",
    "name",
    "nome",
    "slug",
    "color",
    "cor",
    "preco",
    "price",
    "price_cents",
    "price_cents",
    "nascimento",
    "descricao",
    "description",
    "notes",
    "media",
    "midia",
    "cover_url",
    "microchip",
    "pedigree",
    "status",
    "sexo",
    "gender",
    "reserved_at",
    "sold_at",
    "created_at",
    "updated_at",
    // Note: do not assume location columns for puppies; we won't write them
  ];

  // Use a stable whitelist of columns to avoid relying on information_schema
  // queries which can fail depending on PostgREST/Supabase configuration.
  const found = new Set(defaultCols);
  try {
    appendLog({ event: "table-columns-fallback", table: "puppies", used: defaultCols });
  } catch (e) {
    void e;
  }

  // Filter payload to only allowed columns and apply alias mapping where appropriate
  const aliasMap: Record<string, string> = { cidade: "city", estado: "state", nome: "name" };
  const finalPayload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (found && found.has(k)) {
      finalPayload[k] = v;
    }
  }
  // map PT-BR -> EN when EN column exists but PT-BR does not
  for (const [pt, en] of Object.entries(aliasMap)) {
    if (payload[pt] !== undefined && found && !found.has(pt) && found.has(en) && finalPayload[en] === undefined) {
      finalPayload[en] = payload[pt];
      try {
        appendLog({ event: "mapped-column", from: pt, to: en });
      } catch (e) {
        void e;
      }
    }
  }

  // Ensure `status` is a valid puppy_status enum value to avoid DB check constraint failures
  try {
    const allowed = new Set(["disponivel", "reservado", "vendido", "indisponivel"]);
    if (finalPayload.status !== undefined) {
      const s = String(finalPayload.status || "").toLowerCase();
      finalPayload.status = allowed.has(s) ? s : "disponivel";
      appendLog({ event: "status-normalized", status: finalPayload.status });
    }
  } catch (e) {
    void e;
  }

  // For inserts, prefer to let DB set the default `status` to avoid constraint issues
  if (!id) {
    try {
      if (finalPayload.status !== undefined) {
        delete finalPayload.status;
        appendLog({ event: 'removed-status-for-insert' });
      }
    } catch (e) { void e; }
  }

  if (!Object.keys(finalPayload).length) {
    return NextResponse.json({ ok: false, error: "Nenhum campo válido para atualizar" }, { status: 400 });
  }

  const q = id
    ? sb.from("puppies").update(finalPayload).eq("id", id).select().maybeSingle()
    : sb.from("puppies").insert(finalPayload).select().maybeSingle();
  // Execute query and handle rare schema-mismatch errors by retrying with EN->PT-BR mapping
  try {
    const { data, error } = await q;
    if (error) {
      const rawMsg = String(error.message ?? error);
      const msg = rawMsg.toLowerCase();

      // If DB rejects the status with a check constraint, retry without sending status
      try {
        if (rawMsg.includes('puppies_status_check') || msg.includes('violates check constraint') && msg.includes('status')) {
          try { appendLog({ event: 'status-check-failed', message: rawMsg }); } catch (e) { void e; }
          const retryPayload = { ...finalPayload };
          if (retryPayload.status !== undefined) delete retryPayload.status;
          try { appendLog({ event: 'retry-without-status', payloadKeys: Object.keys(retryPayload) }); } catch (e) { void e; }
          const retryQ = id
            ? sb.from('puppies').update(retryPayload).eq('id', id).select().maybeSingle()
            : sb.from('puppies').insert(retryPayload).select().maybeSingle();
          const { data: rData, error: rErr } = await retryQ;
          if (rErr) return NextResponse.json({ ok: false, error: rErr.message }, { status: 500 });
          return NextResponse.json({ ok: true, puppy: rData });
        }
      } catch (e) {
        // ignore and continue with other error handlers
      }

      // If error indicates missing column like 'city' or 'state', attempt retry with PT-BR aliases
      if (msg.includes("could not find the 'city'") || msg.includes('column "city"') || msg.includes("could not find the 'state'") || msg.includes('column "state"')) {
        try {
          appendLog({ event: 'schema-error-detected', message: rawMsg });
        } catch (e) { void e; }
        const enToPt: Record<string, string> = { city: 'cidade', state: 'estado', name: 'nome' };
        const retryPayload: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(finalPayload)) {
          if (enToPt[k]) {
            retryPayload[enToPt[k]] = v;
          } else {
            retryPayload[k] = v;
          }
        }
        try {
          appendLog({ event: 'retry-with-pt-br', payloadKeys: Object.keys(retryPayload) });
        } catch (e) { void e; }
        const retryQ = id
          ? sb.from('puppies').update(retryPayload).eq('id', id).select().maybeSingle()
          : sb.from('puppies').insert(retryPayload).select().maybeSingle();
        const { data: rData, error: rErr } = await retryQ;
        if (rErr) return NextResponse.json({ ok: false, error: rErr.message }, { status: 500 });
        return NextResponse.json({ ok: true, puppy: rData });
      }

      // Generic handling: detect missing column(s) from the DB error and retry without them
      // Examples of messages: "could not find the 'slug' column..." or 'column "slug" does not exist'
      try {
        const missingCols = new Set<string>();
        const re1 = /could not find the '([^']+)'/gi;
        const re2 = /column "([^"]+)"/gi;
        let m: RegExpExecArray | null;
        while ((m = re1.exec(rawMsg))) missingCols.add(m[1]);
        while ((m = re2.exec(rawMsg))) missingCols.add(m[1]);

        // also consider some common optional columns that may not exist and can be safely removed
        const optionalCandidates = ['video_url', 'cover_url', 'image_url', 'images', 'media', 'midia', 'slug'];
        for (const cand of optionalCandidates) {
          if (rawMsg.toLowerCase().includes(cand)) missingCols.add(cand);
        }

        const toRemove = Array.from(missingCols).filter((c) => finalPayload[c] !== undefined);
        if (toRemove.length) {
          try {
            appendLog({ event: 'missing-columns-detected', missing: toRemove, message: rawMsg });
          } catch (e) { void e; }
          const retryPayload = { ...finalPayload };
          toRemove.forEach((c) => delete retryPayload[c]);
          try {
            appendLog({ event: 'retry-without-missing-cols', removed: toRemove, payloadKeys: Object.keys(retryPayload) });
          } catch (e) { void e; }
          const retryQ = id
            ? sb.from('puppies').update(retryPayload).eq('id', id).select().maybeSingle()
            : sb.from('puppies').insert(retryPayload).select().maybeSingle();
          const { data: rData, error: rErr } = await retryQ;
          if (rErr) return NextResponse.json({ ok: false, error: rErr.message }, { status: 500 });
          return NextResponse.json({ ok: true, puppy: rData });
        }
      } catch (e) {
        // ignore and fall through to return raw error
      }

      return NextResponse.json({ ok: false, error: rawMsg }, { status: 500 });
    }
    return NextResponse.json({ ok: true, puppy: data });
  } catch (err) {
    try {
      appendLog({ event: 'query-exception', error: String(err) });
    } catch (e) { void e; }
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
} catch (error) {
  try {
    const line = `[${new Date().toISOString()}] ${JSON.stringify({ event: "exception", error: String(error) })}\n`;
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, line);
  } catch (e) { void e; }
  console.error("[puppies/manage]", error);
  return NextResponse.json({ error: "Falha ao processar o formulário" }, { status: 500 });
}
}
