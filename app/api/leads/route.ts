import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const url = new URL(req.url);
    const utm_source   = url.searchParams.get("utm_source")   ?? body.utm_source ?? null;
    const utm_medium   = url.searchParams.get("utm_medium")   ?? body.utm_medium ?? null;
    const utm_campaign = url.searchParams.get("utm_campaign") ?? body.utm_campaign ?? null;

    const { error } = await supabaseAdmin()
      .from("leads")
      .insert({
        nome: body.nome ?? null,
        telefone: body.telefone ?? null,
        cidade: body.cidade ?? null,
        preferencia: body.preferencia ?? null,
        mensagem: body.mensagem ?? null,
        utm_source, utm_medium, utm_campaign,
        referer: req.headers.get("referer"),
        page: url.pathname,
        gclid: url.searchParams.get("gclid"),
        fbclid: url.searchParams.get("fbclid"),
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
