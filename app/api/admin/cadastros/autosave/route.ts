import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Aqui poderíamos persistir rascunhos em DB; por ora apenas confirma recebimento
    return NextResponse.json({ ok: true, received: body ?? null });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}
