import { NextResponse } from "next/server";

import { getRankedPuppies } from "@/lib/ai/catalog-ranking";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "60", 10) || 60, 1), 200);

    const filters = {
      status: ["disponivel", "reservado"],
      color: undefined,
      gender: undefined,
      city: undefined,
      state: undefined,
      limit,
    } as any;

    // 1) Try ranking (AI)
    let ranked: any[] = [];
    try {
      ranked = await getRankedPuppies({
        status: filters.status,
        limit: filters.limit,
      });
    } catch (err) {
      // ignore ranking errors
    }

    const rankedCount = Array.isArray(ranked) ? ranked.length : 0;

    // 2) Supabase Admin fallback
    const sb = supabaseAdmin();
    let sbData: any[] = [];
    try {
      const { data, error } = await sb
        .from("puppies")
        .select("id, nome, name, status, created_at, cover_url, midia")
        .in("status", filters.status)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && Array.isArray(data)) sbData = data as any[];
    } catch (err) {
      // ignore
    }

    const supabaseCount = sbData.length;

    // 3) REST fallback if still empty and env present
    let restData: any[] = [];
    const hasPublic = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (rankedCount === 0 && supabaseCount === 0 && hasPublic) {
      try {
        const urlRest = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/,'')}/rest/v1/puppies?select=*&status=in.(disponivel,reservado)&order=created_at.desc&limit=${limit}`;
        const res = await fetch(urlRest, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) restData = json as any[];
        }
      } catch (err) {
        // ignore
      }
    }

    const restCount = restData.length;

    // Normalize a small sample for inspection
    const sample = (
      (rankedCount > 0 ? ranked : supabaseCount > 0 ? sbData : restCount > 0 ? restData : []) as any[]
    ).slice(0, 10).map((r) => normalizePuppyFromDB(r));

    return NextResponse.json({
      ok: true,
      rankedCount,
      supabaseCount,
      restCount,
      finalCount: sample.length,
      hasPublicEnv: hasPublic,
      sample,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
