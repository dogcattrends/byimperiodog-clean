import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdminOrUser } from "@/lib/supabaseAdminOrUser";

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { mode, client } = supabaseAdminOrUser(req);
  if (!client) {
    return NextResponse.json(
      { error: mode === "missing_token" ? "sessao_admin_expirada" : "supabase_indisponivel" },
      { status: 401 },
    );
  }

  const { data, error } = await client.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}
