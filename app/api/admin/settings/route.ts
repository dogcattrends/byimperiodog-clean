import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin, logAdminAction } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const { data, error } = await supabaseAdmin()
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) {
    await logAdminAction({ route:'/api/admin/settings', method:'GET', action:'settings_get_error', payload:{ msg:error.message } });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAdminAction({ route:'/api/admin/settings', method:'GET', action:'settings_get_success' });
  return NextResponse.json({ settings: data });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth; // 401
  const body = await req.json();
  let goal = body.weekly_post_goal;
  if (goal !== undefined) {
    goal = parseInt(goal, 10);
    if (!goal || goal < 1 || goal > 100) return NextResponse.json({ error: 'weekly_post_goal inválido (1-100)' }, { status: 400 });
  }
  const payload: any = { id: 1, updated_at: new Date().toISOString() };
  if (goal) payload.weekly_post_goal = goal;
  const allowed = ['gtm_id','ga4_id','meta_pixel_id','tiktok_pixel_id','google_ads_id','google_ads_label','pinterest_tag_id','hotjar_id','clarity_id','meta_domain_verify'];
  for (const k of allowed) if (body[k] !== undefined) payload[k] = body[k];
  const { data, error } = await supabaseAdmin()
    .from("site_settings")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) {
    await logAdminAction({ route:'/api/admin/settings', method:'POST', action:'settings_update_error', payload:{ msg:error.message } });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAdminAction({ route:'/api/admin/settings', method:'POST', action:'settings_update_success', payload: payload });
  return NextResponse.json({ settings: data });
}
