import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdminOrUser } from "@/lib/supabaseAdminOrUser";

export async function POST(req: NextRequest) {
 const guard = requireAdmin(req);
 if (guard) return guard;

 const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
 if (!id || !status) return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 });

 const { mode, client } = supabaseAdminOrUser(req);
 if (!client) {
 return NextResponse.json(
 { error: mode === "missing_token" ? "sessao_admin_expirada" : "supabase_indisponivel" },
 { status: 401 },
 );
 }

 const { error } = await client.from("leads").update({ status }).eq("id", id);
 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ ok: true });
}
