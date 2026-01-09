import { randomUUID } from "crypto";
import fs from "fs";
import { Buffer } from "node:buffer";
import path from "path";

import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { clearAdminSupabaseCookies, isJwtExpiredError } from "@/lib/adminSession";
import { supabaseAdminOrUser } from "@/lib/supabaseAdminOrUser";
import { sanitizeFilename } from "@/lib/uploadValidation";

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";

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

function mapStatusToDb(status?: string | null) {
  const value = (status || "disponivel").toLowerCase();
  if (value === "sold" || value === "vendido") return "vendido";
  if (value === "reserved" || value === "reservado") return "reservado";
  return "disponivel";
}

function serializeError(err: unknown) {
  try {
    if (!err) return String(err);
    if (typeof err === 'string') return err;
    // Supabase error objects often have `message` and `details`.
    if (typeof err === 'object') {
      const asAny = err as any;
      if (typeof asAny.message === 'string') return asAny.message;
      return JSON.stringify(err, Object.getOwnPropertyNames(err));
    }
    return String(err);
  } catch (e) {
    return String(err);
  }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uploadMediaFile(sb: any, file: File, type: "image" | "video", originalName: string) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteMedia(sb: any, urls: string[]) {
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
    const { client: sb, mode } = supabaseAdminOrUser(req);
    if (!sb) {
      return NextResponse.json(
        { ok: false, error: mode === "missing_token" ? "Sessao admin ausente. Refaça login." : "Cliente Supabase indisponível." },
        { status: 401 },
      );
    }

    // Garante que o bucket de storage existe (cria se ausente) - tentativa best-effort
    try {
      // Só tenta criar bucket em modo service (user token normalmente não tem permissão)
      if (mode === "service") {
        const maybeStorage = (sb as unknown as { storage?: { getBucket?: (name: string) => Promise<{ data?: unknown; error?: unknown }>; createBucket?: (name: string, opts?: unknown) => Promise<unknown> } }).storage;
        if (maybeStorage && typeof maybeStorage.getBucket === "function") {
          const { data: bInfo, error: bErr } = (await maybeStorage.getBucket(STORAGE_BUCKET)) as { data?: unknown; error?: unknown };
          if (bErr || !bInfo) {
            if (typeof maybeStorage.createBucket === "function") {
              await maybeStorage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      void e;
    }

    appendLog({ event: "request-start", url: req.url, method: "POST", contentType });

    // Conservative set of columns that are commonly present across legacy/canonical schemas.
    // Optional columns like `media` must be detected before being sent.
    const conservativeCols = [
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
      "nascimento",
      "descricao",
      "notes",
      "midia",
      "cover_url",
      "video_url",
      "microchip",
      "pedigree",
      "status",
      "sexo",
      "gender",
      "reserved_at",
      "sold_at",
      "created_at",
      "updated_at",
    ];

    const detectPuppiesColumns = async (id?: string): Promise<Set<string> | null> => {
      try {
        if (id) {
          const { data, error } = await sb.from("puppies").select("*").eq("id", id).maybeSingle();
          if (error) throw error;
          if (data && typeof data === "object") return new Set(Object.keys(data as Record<string, unknown>));
          return null;
        }
        const { data, error } = await sb.from("puppies").select("*").limit(1);
        if (error) throw error;
        if (Array.isArray(data) && data[0] && typeof data[0] === "object") {
          return new Set(Object.keys(data[0] as Record<string, unknown>));
        }
        return null;
      } catch (err) {
        if (isJwtExpiredError(err)) {
          clearAdminSupabaseCookies();
          return null;
        }
        return null;
      }
    };

    if (!contentType.includes("multipart/form-data")) {
      const body = (await req.json().catch(() => ({}))) as any;
      appendLog({ event: "json-payload", payload: { id: body.id ?? null, name: body.name ?? body.nome ?? null } });

      // If an id is provided, treat as update. Otherwise, allow create via JSON
      if (body.id) {
        const detectedCols = await detectPuppiesColumns(body.id);
        const cols = detectedCols ?? new Set(conservativeCols);

        const updates: Record<string, unknown> = {};
        if (body.status) updates.status = mapStatusToDb(body.status);
        if (typeof body.priceCents === "number" || typeof body.price_cents === "number") {
          const cents = typeof body.priceCents === 'number' ? body.priceCents : body.price_cents;
          updates.price_cents = cents;
          updates.preco = cents / 100;
        }
        if (body.description !== undefined || body.descricao !== undefined) {
          updates.descricao = body.descricao ?? body.description;
          // Only send `description` if the schema actually has it.
          if (cols.has('description')) {
            updates.description = body.description ?? body.descricao;
          }
        }
        updates.updated_at = new Date().toISOString();

        // Filter updates to existing columns to avoid schema cache errors.
        const finalUpdates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (v === null || v === undefined) continue;
          if (cols.has(k)) finalUpdates[k] = v;
        }

        try {
          appendLog({ event: 'before-json-update', id: body.id, updates: finalUpdates });
        } catch (e) { void e; }
        const { data, error } = await sb.from("puppies").update(finalUpdates).eq("id", body.id).select().maybeSingle();
        if (error) {
          if (isJwtExpiredError(error)) {
            clearAdminSupabaseCookies();
            return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
          }
          const ser = serializeError(error);
          appendLog({ event: "db-error", error: ser });

          // If the DB indicates missing column(s), retry without those keys.
          // Common errors: "Could not find the 'description' column ..." / "column \"description\" does not exist"
          try {
            const missingCols = new Set<string>();
            const re1 = /could not find the '([^']+)'/gi;
            const re2 = /column "([^"]+)"/gi;
            let m: RegExpExecArray | null;
            while ((m = re1.exec(ser))) missingCols.add(m[1]);
            while ((m = re2.exec(ser))) missingCols.add(m[1]);

            const retryUpdates = { ...updates } as Record<string, unknown>;
            const toRemove = Array.from(missingCols).filter((c) => retryUpdates[c] !== undefined);
            if (toRemove.length) {
              toRemove.forEach((c) => delete retryUpdates[c]);
              try { appendLog({ event: 'retry-json-without-missing-cols', removed: toRemove, payloadKeys: Object.keys(retryUpdates) }); } catch (e) { void e; }
              const { data: rData, error: rErr } = await sb.from('puppies').update(retryUpdates).eq('id', body.id).select().maybeSingle();
              if (!rErr) {
                appendLog({ event: 'updated-after-missing-cols-retry', id: body.id, durationMs: Date.now() - start });
                return NextResponse.json({ ok: true, puppy: rData });
              }
              if (isJwtExpiredError(rErr)) {
                clearAdminSupabaseCookies();
                return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
              }
              const rser = serializeError(rErr);
              appendLog({ event: 'db-error-retry', error: rser });
              return NextResponse.json({ ok: false, error: rser }, { status: 500 });
            }
          } catch (e) {
            void e;
          }

          // If the DB rejects due to the status check constraint, retry without status
          try {
            const low = (ser || '').toLowerCase();
            if (ser.includes('puppies_status_check') || (low.includes('violates check constraint') && low.includes('status'))) {
              try { appendLog({ event: 'status-check-failed-json', message: ser }); } catch (e) { void e; }
              const retryUpdates = { ...updates } as Record<string, unknown>;
              if (retryUpdates.status !== undefined) delete retryUpdates.status;
              try { appendLog({ event: 'retry-json-without-status', payloadKeys: Object.keys(retryUpdates) }); } catch (e) { void e; }
              const { data: rData, error: rErr } = await sb.from('puppies').update(retryUpdates).eq('id', body.id).select().maybeSingle();
              if (rErr) {
                if (isJwtExpiredError(rErr)) {
                  clearAdminSupabaseCookies();
                  return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
                }
                const rser = serializeError(rErr);
                appendLog({ event: 'db-error-retry', error: rser });
                return NextResponse.json({ ok: false, error: rser }, { status: 500 });
              }
              appendLog({ event: 'updated-after-retry', id: body.id, durationMs: Date.now() - start });
              return NextResponse.json({ ok: true, puppy: rData });
            }
          } catch (e) { void e; }

          return NextResponse.json({ ok: false, error: ser }, { status: 500 });
        }
        // If no row was returned, the update likely affected 0 rows (RLS denied or id not found)
        if (!data) {
          appendLog({ event: 'updated-none', id: body.id, reason: 'no-row-returned', durationMs: Date.now() - start });
          return NextResponse.json(
            { ok: false, error: "Atualização não aplicada (sem permissão/RLS ou registro não encontrado)." },
            { status: 403 },
          );
        }
        appendLog({ event: "updated", id: body.id, durationMs: Date.now() - start });
        return NextResponse.json({ ok: true, puppy: data });
      }

      // Build insert payload from JSON body (best-effort mapping of fields)
      try {
        const now = new Date().toISOString();
        const priceCents = typeof body.price_cents === 'number' ? body.price_cents : typeof body.priceCents === 'number' ? body.priceCents : 0;
        const mediaArr: string[] = Array.isArray(body.midia) ? body.midia : Array.isArray(body.media) ? body.media : [];
        const mediaPayload = Array.isArray(body.midia)
          ? body.midia.map((u: string) => ({ url: u, type: /\.mp4$|video\//.test(String(u)) ? 'video' : 'image' }))
          : [];

        const detectedCols = await detectPuppiesColumns();
        const cols = detectedCols ?? new Set(conservativeCols);

        const insertPayload: Record<string, unknown> = {
          nome: body.nome ?? body.name ?? null,
          name: body.name ?? body.nome ?? null,
          slug: body.slug ?? null,
          cor: body.color ?? body.cor ?? null,
          color: body.color ?? body.cor ?? null,
          sexo: mapSexToDb(body.gender ?? body.sex ?? null),
          gender: normalizeGender(body.gender ?? body.sex ?? null),
          price_cents: priceCents || null,
          preco: Number.isFinite(priceCents) ? priceCents / 100 : null,
          status: mapStatusToDb(body.status ?? null),
          descricao: body.descricao ?? body.description ?? null,
          cover_url: body.image_url ?? null,
          video_url: body.video_url ?? null,
          // Only send `media` if the DB schema actually has the column.
          ...(cols.has("media") ? { media: mediaArr } : null),
          midia: JSON.stringify(mediaPayload),
          created_at: now,
          updated_at: now,
        };

        // Filter to only existing columns (prevents PostgREST schema cache errors like missing `media`).
        const finalInsert: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(insertPayload)) {
          if (v === null || v === undefined) continue;
          if (cols.has(k)) finalInsert[k] = v;
        }

        // For inserts, avoid sending `status` to let the DB apply its default
        // (this prevents violating the `puppies_status_check` constraint
        // when the incoming value does not match DB expectations).
        try {
          if (finalInsert.status !== undefined) {
            delete finalInsert.status;
            appendLog({ event: 'removed-status-for-insert-json' });
          }
        } catch (e) { void e; }

        const { data, error } = await sb.from('puppies').insert(finalInsert).select().maybeSingle();
        if (error) {
          if (isJwtExpiredError(error)) {
            clearAdminSupabaseCookies();
            return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
          }
          const ser = serializeError(error);
          appendLog({ event: 'db-error', error: ser });

          // Retry without missing columns (e.g., 'description' not present in schema)
          try {
            const missingCols = new Set<string>();
            const re1 = /could not find the '([^']+)'/gi;
            const re2 = /column "([^"]+)"/gi;
            let m: RegExpExecArray | null;
            while ((m = re1.exec(ser))) missingCols.add(m[1]);
            while ((m = re2.exec(ser))) missingCols.add(m[1]);

            const retryPayload = { ...finalInsert } as Record<string, unknown>;
            const toRemove = Array.from(missingCols).filter((c) => retryPayload[c] !== undefined);
            if (toRemove.length) {
              toRemove.forEach((c) => delete retryPayload[c]);
              try { appendLog({ event: 'retry-insert-json-without-missing-cols', removed: toRemove, payloadKeys: Object.keys(retryPayload) }); } catch (e) { void e; }
              const { data: rData, error: rErr } = await sb.from('puppies').insert(retryPayload).select().maybeSingle();
              if (!rErr) {
                appendLog({ event: 'created-after-missing-cols-retry', id: (rData && (rData as any).id) ?? null, durationMs: Date.now() - start });
                return NextResponse.json({ ok: true, puppy: rData });
              }
              if (isJwtExpiredError(rErr)) {
                clearAdminSupabaseCookies();
                return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
              }
              const rser = serializeError(rErr);
              appendLog({ event: 'db-error-retry', error: rser });
              return NextResponse.json({ ok: false, error: rser }, { status: 500 });
            }
          } catch (e) {
            void e;
          }

          return NextResponse.json({ ok: false, error: ser }, { status: 500 });
        }
        if (!data) {
          appendLog({ event: 'created-none', reason: 'no-row-returned', durationMs: Date.now() - start });
          return NextResponse.json({ ok: false, error: 'Criação não aplicada.' }, { status: 500 });
        }
        appendLog({ event: 'created', id: (data && (data as any).id) ?? null, durationMs: Date.now() - start });
        return NextResponse.json({ ok: true, puppy: data });
      } catch (e: unknown) {
        appendLog({ event: 'create-json-exception', error: String(e) });
        return NextResponse.json({ ok: false, error: 'Erro ao criar registro' }, { status: 500 });
      }
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
  const descricaoFromForm = (formData.get("descricao") as string) || null;
  const descriptionFromForm = (formData.get("description") as string) || null;
  const descriptionText = descricaoFromForm || descriptionFromForm || null;

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
    // store cover under `cover_url`; avoid writing `image_url` column which may not exist
    cover_url: orderedPhotoUrls[0] ?? null,
    video_url: orderedVideoUrls[0] ?? null,
    // `media` column is a string[] in the DB types — store photos and videos together
    media: [...orderedPhotoUrls, ...orderedVideoUrls],
    // `midia` remains a JSON-serialized payload for compatibility
    midia: JSON.stringify(mediaPayload),
    updated_at: now,
  };

  // Store description only in `descricao` by default.
  // Some schemas don't have `description`; writing it causes PostgREST schema cache errors.
  if (descriptionText) {
    payload.descricao = descriptionText;
  }

  if (!id) {
    payload.created_at = now;
  }

  // Detect actual columns so we never send fields that don't exist (e.g., `media`).
  const detectedCols = await detectPuppiesColumns(id);
  const found = detectedCols ?? new Set(conservativeCols);
  try {
    appendLog({ event: detectedCols ? 'table-columns-detected' : 'table-columns-conservative', table: 'puppies', used: Array.from(found) });
  } catch (e) {
    void e;
  }

  // Filter payload to only allowed columns and apply alias mapping where appropriate
  const aliasMap: Record<string, string> = { cidade: "city", estado: "state", nome: "name" };
  const finalPayload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    // Only include known columns and skip null/undefined values to avoid
    // sending `field: null` for columns that may not exist in some schemas.
    if (found && found.has(k) && v !== null && v !== undefined) {
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
    const allowed = new Set([
      // PT-BR
      "disponivel",
      "reservado",
      "vendido",
      "indisponivel",
      "em_breve",
      // EN
      "available",
      "reserved",
      "sold",
      "unavailable",
      "pending",
    ]);
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
  try {
    appendLog({ event: "before-query", id: id ?? null, status: finalPayload.status ?? null, payloadKeys: Object.keys(finalPayload) });
  } catch (e) {
    void e;
  }
  // Execute query and handle rare schema-mismatch errors by retrying with EN->PT-BR mapping
  try {
    const { data, error } = await q;
    if (error) {
      const rawMsg = String(error.message ?? error);
      const msg = rawMsg.toLowerCase();

      try {
        appendLog({ event: 'query-error', message: rawMsg, payloadKeys: Object.keys(finalPayload) });
      } catch (e) { void e; }

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
    // If no row returned, the mutation likely affected 0 rows (RLS denied or id not found)
    if (!data) {
      try {
        appendLog({ event: id ? 'updated-none' : 'created-none', id: id ?? null, reason: 'no-row-returned' });
      } catch (e) {
        void e;
      }
      return NextResponse.json(
        { ok: false, error: id ? "Atualização não aplicada (sem permissão/RLS ou registro não encontrado)." : "Criação não aplicada." },
        { status: id ? 403 : 500 },
      );
    }
    return NextResponse.json({ ok: true, puppy: data });
  } catch (err) {
    try {
      appendLog({ event: 'query-exception', error: serializeError(err) });
    } catch (e) { void e; }
    return NextResponse.json({ ok: false, error: serializeError(err) }, { status: 500 });
  }
} catch (error) {
  try {
    const line = `[${new Date().toISOString()}] ${JSON.stringify({ event: "exception", error: serializeError(error) })}\n`;
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, line);
  } catch (e) { void e; }
  console.error("[puppies/manage]", error);
  return NextResponse.json({ error: "Falha ao processar o formulário" }, { status: 500 });
}
}
