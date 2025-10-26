import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ items: [] });
  const { data, error } = await sb.from("redirects").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const payload = await req.json();
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase-not-configured" }, { status: 500 });
  const { from_path, to_url, code = 301, enabled = true } = payload || {};
  if (!from_path || !to_url) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }
  const { data, error } = await sb
    .from("redirects")
    .insert({ from_path, to_url, code, enabled })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing-id" }, { status: 400 });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ error: "supabase-not-configured" }, { status: 500 });
  const { error } = await sb.from("redirects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
