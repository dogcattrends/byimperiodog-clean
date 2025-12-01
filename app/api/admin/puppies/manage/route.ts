import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  // Suportar tanto JSON quanto FormData
  const contentType = req.headers.get("content-type") || "";
  let body: any = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    body = {
      id: formData.get("id") as string || undefined,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string || null,
      color: formData.get("color") as string || null,
      sex: formData.get("sex") as string || null,
      city: formData.get("city") as string || null,
      state: formData.get("state") as string || null,
      priceCents: Number(formData.get("priceCents")) || null,
      status: formData.get("status") as string || null,
      description: formData.get("description") as string || null,
    };

    // TODO: Processar uploads de fotos e vídeos
    // const photos = formData.getAll("photos");
    // const videos = formData.getAll("videos");
  } else {
    body = (await req.json().catch(() => ({}))) as {
      id?: string;
      name: string;
      slug?: string | null;
      color?: string | null;
      sex?: string | null;
      city?: string | null;
      state?: string | null;
      priceCents?: number | null;
      status?: string | null;
      description?: string | null;
    };
  }

  const payload: any = {
    nome: body.name,
    slug: body.slug || null,
    cor: body.color || null,
    sexo: body.sex || null,
    city: body.city || null,
    state: body.state || null,
    price_cents: body.priceCents ?? null,
    status: body.status || "disponivel",
    descricao: body.description || null,
  };

  const sb = supabaseAdmin();
  const { data, error } = body.id
    ? await sb.from("puppies").update(payload).eq("id", body.id).select().maybeSingle()
    : await sb.from("puppies").insert(payload).select().maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ puppy: data }, { status: 200 });
}
