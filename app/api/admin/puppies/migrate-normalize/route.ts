import fs from "fs";
import path from "path";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const sb = supabaseAdmin();
  try {
    const { data: rows, error: selectError } = await sb.from("puppies").select("*");
    if (selectError) return NextResponse.json({ ok: false, error: selectError.message }, { status: 500 });
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, message: "no rows" });
    }

    // Backup current rows to tmp before applying normalization (one-off safety)
    try {
      const backupDir = path.join(process.cwd(), "tmp");
      fs.mkdirSync(backupDir, { recursive: true });
      const backupFile = path.join(
        backupDir,
        `puppies-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      );
      fs.writeFileSync(backupFile, JSON.stringify(rows, null, 2), "utf8");
    } catch (e) {
      // If backup fails, continue but log will not be created
    }

    const errors: Array<{ id?: string; error: string }> = [];
    let updated = 0;

    for (const r of rows) {
      try {
        const id = (r as any).id as string | undefined;
        if (!id) continue;

        // determine photo urls
        let existingPhotoUrls: string[] = [];
        const imgs = (r as any).images;
        const mediaField = (r as any).media;
        const midiaField = (r as any).midia;

        if (Array.isArray(imgs)) {
          existingPhotoUrls = imgs.filter((u: any) => typeof u === "string");
        } else if (typeof mediaField === "string") {
          try {
            const parsed = JSON.parse(mediaField);
            if (Array.isArray(parsed)) existingPhotoUrls = parsed.map(String).filter(Boolean);
          } catch {
            existingPhotoUrls = [];
          }
        } else if (Array.isArray(mediaField)) {
          existingPhotoUrls = mediaField.map(String).filter(Boolean);
        }

        // build midia payload
        let mediaPayload: Array<{ url: string; type: string }> = [];
        if (typeof midiaField === "string") {
          try {
            const parsed = JSON.parse(midiaField);
            if (Array.isArray(parsed)) mediaPayload = parsed as any;
          } catch {
            mediaPayload = [];
          }
        } else if (Array.isArray(midiaField)) {
          mediaPayload = midiaField as any;
        } else if (existingPhotoUrls.length) {
          mediaPayload = existingPhotoUrls.map((u) => ({ url: u, type: "image" }));
        }

        const updates: Record<string, any> = {};
        const normalizedMedia = JSON.stringify(existingPhotoUrls);
        const normalizedMidia = JSON.stringify(mediaPayload);

        if ((r as any).media !== normalizedMedia) updates.media = normalizedMedia;
        if ((r as any).midia !== normalizedMidia) updates.midia = normalizedMidia;
        if (!(r as any).cover_url && (r as any).image_url) updates.cover_url = (r as any).image_url;

        if (Object.keys(updates).length === 0) continue;

        updates.updated_at = new Date().toISOString();

        const { error: upErr } = await sb.from("puppies").update(updates).eq("id", id);
        if (upErr) {
          errors.push({ id, error: upErr.message });
        } else {
          updated++;
        }
      } catch (e: any) {
        errors.push({ error: String(e) });
      }
    }

    return NextResponse.json({ ok: true, updated, errors });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
