import { NextResponse } from "next/server";

import { withPuppiesReadTable } from "@/lib/puppies/readTable";
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
      PUPPIES_READ_SOURCE: process.env.PUPPIES_READ_SOURCE ?? null,
      PUPPIES_ADMIN_READ_SOURCE: process.env.PUPPIES_ADMIN_READ_SOURCE ?? null,
    };

    // Quick probe: attempt a minimal select via admin and public clients
    let adminProbe: { ok: boolean; error?: string; count?: number } = { ok: false };
    try {
      const admin = supabaseAdmin();
      const r = await withPuppiesReadTable({
        sb: admin,
        query: (table) => (admin as any).from(table).select("id").limit(1),
      });
      if (r && (r as any).data) {
        adminProbe = {
          ok: true,
          count: Array.isArray((r as any).data) ? (r as any).data.length : undefined,
          ...(r.table ? ({ table: r.table, usedFallback: r.usedFallback, firstError: r.firstError } as any) : null),
        } as any;
      }
      else adminProbe = { ok: false, error: "no-data" };
    } catch (e: unknown) {
      adminProbe = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }

    let publicProbe: { ok: boolean; error?: string; count?: number } = { ok: false };
    try {
      const pub = supabasePublic();
      const r2 = await withPuppiesReadTable({
        sb: pub,
        query: (table) => (pub as any).from(table).select("id").limit(1),
      });
      if (r2 && (r2 as any).data) {
        publicProbe = {
          ok: true,
          count: Array.isArray((r2 as any).data) ? (r2 as any).data.length : undefined,
          ...(r2.table ? ({ table: r2.table, usedFallback: r2.usedFallback, firstError: r2.firstError } as any) : null),
        } as any;
      }
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
