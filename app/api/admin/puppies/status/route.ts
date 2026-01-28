import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { clearAdminSupabaseCookies, isJwtExpiredError } from "@/lib/adminSession";
import { supabaseAdminOrUser } from "@/lib/supabaseAdminOrUser";

function mapStatus(status?: string | null) {
 const value = (status || "disponivel").toLowerCase();
 if (value === "sold" || value === "vendido") return "vendido";
 if (value === "reserved" || value === "reservado") return "reservado";
 return "disponivel";
}

export async function POST(req: NextRequest) {
 const guard = requireAdmin(req);
 if (guard) return guard;

 const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
 if (!id || !status) return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 });

 const { client: sb, mode } = supabaseAdminOrUser(req);
 if (!sb) {
 return NextResponse.json(
 { ok: false, error: mode === "missing_token" ? "Sessao admin ausente. Refaça login." : "Cliente Supabase indisponível." },
 { status: 401 },
 );
 }

 const update = { status: mapStatus(status), updated_at: new Date().toISOString() };
 const { error } = await sb.from("puppies").update(update).eq("id", id);
 if (error) {
 if (isJwtExpiredError(error)) {
 clearAdminSupabaseCookies();
 return NextResponse.json({ ok: false, error: "Sessão expirada. Refaça login." }, { status: 401 });
 }
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
 return NextResponse.json({ ok: true });
}
