import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { processLeadIntel } from "@/lib/leadIntel";
import { supabaseAdminOrUser } from "@/lib/supabaseAdminOrUser";

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });

  const { mode, client } = supabaseAdminOrUser(req);
  if (!client) {
    return NextResponse.json(
      { error: mode === "missing_token" ? "sessao_admin_expirada" : "supabase_indisponivel" },
      { status: 401 },
    );
  }

  const { data, error } = await client.from("lead_ai_insights").select("*").eq("lead_id", leadId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, insight: data });
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const { leadId, force } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });

  try {
    const result = await processLeadIntel(leadId, Boolean(force));
    return NextResponse.json({ ok: true, insight: result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
