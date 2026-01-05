import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(_req: NextRequest) {
  const sb = supabaseAdmin();
  // reference the param to satisfy linter while preserving signature
  void _req;
  try {
    const { data, error } = await sb.from("puppies").select("*").limit(1);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ ok: true, columns: [] });
    const cols = Object.keys(data[0]);
    return NextResponse.json({ ok: true, columns: cols });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
