import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("admin_config")
    .select(
      "id,brand_name,brand_tagline,contact_email,contact_phone,instagram,tiktok,whatsapp_message,followup_rules,avg_response_minutes,template_first_contact,template_followup,seo_title_default,seo_description_default,seo_meta_tags"
    )
    .eq("id", "default")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = await req.json();
  const sb = supabaseAdmin();
  const { error } = await sb.from("admin_config").upsert(
    {
      id: "default",
      brand_name: body.brand_name,
      brand_tagline: body.brand_tagline,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      instagram: body.instagram,
      tiktok: body.tiktok,
      whatsapp_message: body.whatsapp_message,
      followup_rules: body.followup_rules,
      avg_response_minutes: body.avg_response_minutes,
      template_first_contact: body.template_first_contact,
      template_followup: body.template_followup,
      seo_title_default: body.seo_title_default,
      seo_description_default: body.seo_description_default,
      seo_meta_tags: body.seo_meta_tags,
    },
    { onConflict: "id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
