import { NextResponse } from "next/server";

import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabaseAdmin";
import { supabasePublic } from "@/lib/supabasePublic";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const envs = {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasServiceRoleKey: hasServiceRoleKey(),
    };

    // Quick probe: attempt a minimal select via admin and public clients
    let adminProbe: { ok: boolean; error?: string; count?: number } = { ok: false };
    try {
      const admin = supabaseAdmin();
      const r = await admin.from("puppies").select("id").limit(1);
      if (r && r.data) adminProbe = { ok: true, count: Array.isArray(r.data) ? r.data.length : undefined };
      else adminProbe = { ok: false, error: "no-data" };
    } catch (e: unknown) {
      adminProbe = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }

    let publicProbe: { ok: boolean; error?: string; count?: number } = { ok: false };
    try {
      const pub = supabasePublic();
      const r2 = await pub.from("puppies").select("id").limit(1);
      if (r2 && r2.data) publicProbe = { ok: true, count: Array.isArray(r2.data) ? r2.data.length : undefined };
      else publicProbe = { ok: false, error: "no-data" };
    } catch (e: unknown) {
      publicProbe = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }

    return NextResponse.json({ ok: true, envs, adminProbe, publicProbe });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
