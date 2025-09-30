import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, logAdminAction } from '@/lib/adminAuth';

export async function POST(req: Request){
  try{
  const auth = requireAdmin(req);
  if (auth) return auth; // 401
    const body = await req.json().catch(()=> ({}));
    const ga4 = (body.ga4 || '').trim();
    const meta_pixel_id = (body.meta_pixel_id || '').trim();
    const tiktok_pixel_id = (body.tiktok_pixel_id || '').trim();

    const supa = supabaseAdmin();
    const payload: Record<string, any> = {};
    if (ga4 !== undefined) payload.ga4_id = ga4 || null;
    if (meta_pixel_id !== undefined) payload.meta_pixel_id = meta_pixel_id || null;
    if (tiktok_pixel_id !== undefined) payload.tiktok_pixel_id = tiktok_pixel_id || null;

    const { error } = await supa
      .from('site_settings')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) {
      await logAdminAction({ route:'/api/admin/settings/pixels', method:'POST', action:'pixels_update_error', payload:{ msg:error.message } });
      throw new Error(error.message);
    }
    await logAdminAction({ route:'/api/admin/settings/pixels', method:'POST', action:'pixels_update_success', payload: payload });
    return NextResponse.json({ ok:true });
  }catch(e:any){
    return NextResponse.json({ error: String(e?.message||e) }, { status: 400 });
  }
}
