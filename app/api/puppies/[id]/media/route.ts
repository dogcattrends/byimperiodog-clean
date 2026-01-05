import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id) return NextResponse.json({ error: "missing-id" }, { status: 400 });

    const admin = supabaseAdmin();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
    // Try to list files under a folder named after the puppy id
    const folder = `puppies/${id}`;
    const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 200, offset: 0 });
    if (error) {
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }

    const items = Array.isArray(data)
      ? data
          .filter((f: any) => !!f.name)
          .map((f: any) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(folder)}/${encodeURIComponent(f.name)}`)
      : [];

    return NextResponse.json({ items });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
