import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const colorParam = url.searchParams.get("color");
    const gender = url.searchParams.get("gender");

    const STATUS_SYNONYMS: Record<string, string[]> = {
      available: ["available", "disponivel"],
      reserved: ["reserved", "reservado"],
      sold: ["sold", "vendido"],
      disponivel: ["disponivel", "available"],
      reservado: ["reservado", "reserved"],
      vendido: ["vendido", "sold"],
    };

    const COLOR_SYNONYMS: Record<string, string[]> = {
      branco: ["white", "branco"],
      white: ["white", "branco"],
      laranja: ["laranja", "orange"],
      orange: ["orange", "laranja"],
      preto: ["black", "preto"],
      black: ["black", "preto"],
      creme: ["creme"],
      'grey-white': ["grey-white", "grey white", "cinza"],
    };

    const defaultStatuses = ["disponivel", "reserved", "available", "reservado"];
    let statuses: string[] = [];
    if (statusParam) {
      for (const raw of statusParam.split(",").map((s) => s.trim()).filter(Boolean)) {
        const s = raw.toLowerCase();
        if (STATUS_SYNONYMS[s]) statuses.push(...STATUS_SYNONYMS[s]);
        else statuses.push(s);
      }
    } else {
      statuses = defaultStatuses;
    }

    const sb = supabaseAdmin();
    let query = sb.from("puppies").select("*");
    if (statuses.length === 1) query = query.eq("status", statuses[0]);
    else if (statuses.length > 1) query = query.in("status", statuses);

    if (colorParam) {
      const v = colorParam.toLowerCase();
      const candidates = COLOR_SYNONYMS[v] ? Array.from(new Set(COLOR_SYNONYMS[v].map((c) => c.toLowerCase()))) : [v];
      if (candidates.length === 1) query = query.eq("color", candidates[0]);
      else query = query.in("color", candidates);
    }
    if (gender) query = query.eq("gender", gender.toLowerCase());

    const { data, error } = await query.order("created_at", { ascending: false }).limit(20);

    if (error) {
      return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }

    const sample = Array.isArray(data) ? data.slice(0, 10).map((r: any) => ({ id: r.id, status: r.status, color: r.color, gender: r.gender, created_at: r.created_at, midia: r.midia || r.images || null })) : [];

    return NextResponse.json({ ok: true, count: Array.isArray(data) ? data.length : 0, sample, timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
