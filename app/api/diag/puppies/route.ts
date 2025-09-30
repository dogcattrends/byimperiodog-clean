import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = supabaseAdmin();
    const { data, error } = await s
      .from("puppies")
      .select("id, nome, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      count: data?.length ?? 0,
  ids: (data ?? []).map((r: { id: string }) => r.id),
      sample: data,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
