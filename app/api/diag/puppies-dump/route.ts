import { NextResponse } from "next/server";

import { withPuppiesReadTable } from "@/lib/puppies/readTable";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
 try {
 const url = new URL(request.url);
 const allowLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
 if (process.env.NODE_ENV === "production" && !allowLocal) {
 return NextResponse.json({ ok: false, error: "Forbidden in production" }, { status: 403 });
 }

 const sb = supabaseAdmin();
 const r = await withPuppiesReadTable({
 sb,
 query: (table) => {
 const select =
 table === "puppies_v2"
 ? "id, name, status, color, gender, city, state, price, images, created_at"
 : "id, nome, name, status, color, gender, cover_url, midia, created_at";
 return (sb as any).from(table).select(select).order("created_at", { ascending: false }).limit(50);
 },
 });

 if ((r as any).error) return NextResponse.json({ ok: false, error: String((r as any).error) }, { status: 500 });

 const rows = Array.isArray((r as any).data)
 ? (r as any).data.map((row: any) => ({
 id: row.id,
 nome: row.nome ?? row.name ?? null,
 status: row.status ?? null,
 color: row.color ?? null,
 gender: row.gender ?? null,
 cover_url: row.cover_url ?? null,
 midia: row.midia ?? row.images ?? null,
 created_at: row.created_at ?? null,
 }))
 : [];

 return NextResponse.json({ ok: true, table: r.table, usedFallback: r.usedFallback, firstError: r.firstError, count: rows.length, rows, timestamp: new Date().toISOString() });
 } catch (err) {
 return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
 }
}
