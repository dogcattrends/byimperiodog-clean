import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { message: "Configuração ausente: SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const { email } = await req.json();
    const value = String(email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return NextResponse.json({ message: "E-mail inválido" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { error } = await sb.from("newsletter_subscribers").insert({ email: value });
    if (error) {
      // 23505 = unique_violation
      if ((error as any).code === "23505") {
        return NextResponse.json({ message: "E-mail já inscrito" }, { status: 200 });
      }
      console.error("newsletter insert error", error);
      return NextResponse.json({ message: "Falha ao inscrever" }, { status: 500 });
    }

    return NextResponse.json({ message: "Inscrição confirmada" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Erro inesperado" }, { status: 500 });
  }
}

