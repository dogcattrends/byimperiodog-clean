import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, logAdminAction } from '@/lib/adminAuth';

// GET /api/admin/blog/schedule/events?month=2025-09 (YYYY-MM) -> lista
export async function GET(req: Request){
  const auth = requireAdmin(req); if(auth) return auth;
  const url = new URL(req.url);
  const month = url.searchParams.get('month');
  try {
    const sb = supabaseAdmin();
    if(!month){
      const { data, error } = await sb.from('blog_post_schedule_events').select('*').order('run_at');
      if(error) throw error;
      return NextResponse.json({ ok:true, items: data });
    }
    const start = new Date(month+'-01T00:00:00Z');
    if(isNaN(start.getTime())) return NextResponse.json({ ok:false, error:'month inválido' }, { status:400 });
    const end = new Date(start); end.setMonth(end.getMonth()+1);
    const { data, error } = await sb.from('blog_post_schedule_events').select('*').gte('run_at', start.toISOString()).lt('run_at', end.toISOString()).order('run_at');
    if(error) throw error;
    return NextResponse.json({ ok:true, items: data });
  } catch(e:any){
    return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}

// POST cria evento { post_id, run_at, action, payload? }
export async function POST(req: Request){
  const auth = requireAdmin(req); if(auth) return auth;
  try {
    const body = await req.json();
    const { post_id, run_at, action, payload } = body;
    if(!post_id || !run_at || !action) return NextResponse.json({ ok:false, error:'post_id, run_at, action obrigatórios' }, { status:400 });
    const sb = supabaseAdmin();
    const { data, error } = await sb.from('blog_post_schedule_events').insert([{ post_id, run_at, action, payload: payload||null }]).select('*').single();
    if(error) throw error;
    if(action==='publish') { try { await sb.from('blog_posts').update({ scheduled_at: run_at, status:'scheduled' }).eq('id', post_id); } catch {} }
    logAdminAction({ route:'/api/admin/blog/schedule/events', method:'POST', action:'schedule_create', payload:{ id:data.id, post_id, run_at, action } });
    return NextResponse.json({ ok:true, event: data });
  } catch(e:any){
    return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}

// DELETE ?id=
export async function DELETE(req: Request){
  const auth = requireAdmin(req); if(auth) return auth;
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if(!id) return NextResponse.json({ ok:false, error:'id obrigatório' }, { status:400 });
    const sb = supabaseAdmin();
    const { data: before, error: selErr } = await sb.from('blog_post_schedule_events').select('post_id, run_at, action').eq('id', id).maybeSingle();
    if(selErr) throw selErr;
    const { error } = await sb.from('blog_post_schedule_events').delete().eq('id', id);
    if(error) throw error;
    logAdminAction({ route:'/api/admin/blog/schedule/events', method:'DELETE', action:'schedule_delete', payload:{ id, before } });
    return NextResponse.json({ ok:true });
  } catch(e:any){
    return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}

export const dynamic = 'force-dynamic';
