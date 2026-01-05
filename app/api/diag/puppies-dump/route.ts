import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const allowLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (process.env.NODE_ENV === "production" && !allowLocal) {
      return NextResponse.json({ ok: false, error: "Forbidden in production" }, { status: 403 });
    }

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("puppies")
      .select("id, nome, name, status, color, gender, cover_url, midia, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });

    const rows = Array.isArray(data)
      ? data.map((r: any) => ({
          id: r.id,
          nome: r.nome ?? r.name ?? null,
          status: r.status ?? null,
          color: r.color ?? null,
          gender: r.gender ?? null,
          cover_url: r.cover_url ?? null,
          midia: r.midia ?? null,
          created_at: r.created_at ?? null,
        }))
      : [];

    return NextResponse.json({ ok: true, count: rows.length, rows, timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
