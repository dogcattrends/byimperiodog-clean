import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, logAdminAction } from '@/lib/adminAuth';

// Publica um único post (ou vários via ids) definindo published_at se ainda não definido
export async function POST(req: Request){
  const auth = requireAdmin(req); if(auth) return auth;
  try {
    const body = await req.json().catch(()=>({}));
    const { id, ids } = body as { id?: string; ids?: string[] };
    if(!id && !(ids && ids.length)) return NextResponse.json({ ok:false, error:'id ou ids obrigatório'}, { status:400 });
    const sb = supabaseAdmin();
    const targetIds = ids && ids.length ? ids : [id!];
    const now = new Date().toISOString();
    const { data, error } = await sb.from('blog_posts').update({ status:'published', published_at: now, scheduled_at: null }).in('id', targetIds).select('slug');
    if(error) throw error;
    logAdminAction({ route:'/api/admin/blog/publish', method:'POST', action:'publish_posts', payload:{ ids: targetIds } });
    try {
      revalidatePath('/blog');
      for (const p of data||[]) revalidatePath(`/blog/${p.slug}`);
    } catch {}
    return NextResponse.json({ ok:true, updated: data?.length||0 });
  } catch(e:any){
    logAdminAction({ route:'/api/admin/blog/publish', method:'POST', action:'publish_posts_error', payload:{ error: e.message } });
     return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}
