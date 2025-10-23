import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Simula criação de cadastro; em versões futuras, persistir no banco
    const id = Math.random().toString(36).slice(2);
    return NextResponse.json({ ok: true, id, data: body ?? null });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}
