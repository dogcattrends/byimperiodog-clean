import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface ScheduleBody { post_id?:string; post_slug?:string; slug?:string; run_at:string; action?:'publish'; overwrite?:boolean }

// POST /api/admin/blog/schedule -> agenda publicação futura
// Body: { post_slug|slug, run_at (ISO), action?="publish", overwrite? }
export async function POST(req: NextRequest){
 const auth = requireAdmin(req); if(auth) return auth;
 let body: unknown = {};
 try { body = await req.json(); } catch { body = {}; }
 const { post_id, post_slug, slug, run_at, action='publish', overwrite=false } = (body as ScheduleBody);
 const resolvedSlug = (typeof post_slug === 'string' && post_slug.trim())
 ? post_slug.trim()
 : (typeof slug === 'string' && slug.trim() ? slug.trim() : null);
 if(!resolvedSlug || !run_at) {
 // post_id-only scheduling is deprecated (Supabase blog_posts is legacy)
 return NextResponse.json({ error:'post_slug-and-run_at-required' }, { status:400 });
 }
 const when = new Date(run_at);
 if(isNaN(when.getTime())) return NextResponse.json({ error:'invalid-run_at' }, { status:400 });
 const sb = supabaseAdmin();
 try {
 if(overwrite){
 await sb.from('blog_post_schedule_events').delete().eq('post_slug', resolvedSlug).is('executed_at', null);
 }
 const { error } = await sb.from('blog_post_schedule_events').insert({ post_id: post_id ?? null, post_slug: resolvedSlug, run_at: when.toISOString(), action, payload: { reason:'manual-schedule', post_slug: resolvedSlug } });
 if(error) return NextResponse.json({ error: error.message }, { status:500 });
 return NextResponse.json({ ok:true });
 } catch(e:unknown){
 const msg = e instanceof Error? e.message : 'error';
 return NextResponse.json({ error: msg }, { status:500 });
 }
}

// GET /api/admin/blog/schedule?post_slug=... -> lista eventos futuros pendentes
export async function GET(req: NextRequest){
 const auth = requireAdmin(req); if(auth) return auth;
 const url = new URL(req.url);
 const postSlug = url.searchParams.get('post_slug') ?? url.searchParams.get('slug');
 const postId = url.searchParams.get('post_id');
 const sb = supabaseAdmin();
 const q = sb.from('blog_post_schedule_events').select('id,post_id,post_slug,run_at,action,executed_at,created_at,payload').is('executed_at', null).order('run_at',{ ascending:true });
 const { data, error } = postSlug ? await q.eq('post_slug', postSlug) : (postId ? await q.eq('post_id', postId) : await q);
 if(error) return NextResponse.json({ error: error.message }, { status:500 });
 return NextResponse.json({ events: data||[] });
}
