import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { sanityClient } from '@/lib/sanity';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// POST /api/admin/blog/schedule/process -> executa eventos vencidos (uso manual / cron externo)
export async function POST(req: NextRequest){
 const auth = requireAdmin(req); if(auth) return auth;
 const sb = supabaseAdmin();
 const nowIso = new Date().toISOString();
 const { data: events, error } = await sb.from('blog_post_schedule_events')
 .select('id,post_id,post_slug,action,run_at,payload')
 .is('executed_at', null)
 .lte('run_at', nowIso)
 .order('run_at',{ ascending:true });
 if(error) return NextResponse.json({ error: error.message }, { status:500 });
 interface ProcResult { event_id:string|number; action:string; status:string }
 const results: ProcResult[] = [];
 for(const ev of events||[]){
 if(ev.action === 'publish'){
 const slug = (typeof (ev as any).post_slug === 'string' && (ev as any).post_slug.trim())
 ? String((ev as any).post_slug).trim()
 : (ev?.payload && typeof ev.payload === 'object'
 ? String((ev.payload as any).post_slug ?? (ev.payload as any).slug ?? '')
 : '');
 if(!slug){
 results.push({ event_id: ev.id, action:'publish', status:'skipped-missing-post-slug' });
 } else {
 const postId = await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug }
 );
 if(!postId){
 results.push({ event_id: ev.id, action:'publish', status:'skipped-post-not-found' });
 } else {
 await sanityClient.patch(postId).set({ status:'published', publishedAt: new Date().toISOString() }).commit();
 try { revalidatePath('/blog'); revalidatePath(`/blog/${slug}`); } catch (e) { /* noop */ }
 results.push({ event_id: ev.id, action:'publish', status:'executed' });
 }
 }
 } else {
 results.push({ event_id: ev.id, action: ev.action, status:'skipped-unknown-action' });
 }
 await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString() }).eq('id', ev.id);
 }
 return NextResponse.json({ processed: results.length, results });
}
