import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { withPuppiesReadTable } from "@/lib/puppies/readTable";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(_req: NextRequest) {
 const sb = supabaseAdmin();
 // reference the param to satisfy linter while preserving signature
 void _req;
 try {
 const r = await withPuppiesReadTable({
 sb,
 query: (table) => (sb as any).from(table).select("*").limit(1),
 });
 if ((r as any).error) return NextResponse.json({ ok: false, error: (r as any).error.message ?? String((r as any).error) }, { status: 500 });
 const data = (r as any).data as any[] | null;
 if (!data || data.length === 0) return NextResponse.json({ ok: true, table: r.table, usedFallback: r.usedFallback, firstError: r.firstError, columns: [] });
 const cols = Object.keys(data[0]);
 return NextResponse.json({ ok: true, table: r.table, usedFallback: r.usedFallback, firstError: r.firstError, columns: cols });
 } catch (err: any) {
 return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
 }
}
