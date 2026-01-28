import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { requireAdmin, logAdminAction } from '@/lib/adminAuth';
import { sanityClient } from '@/lib/sanity';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Executa eventos vencidos (publish) até um limite (default 20)
export async function POST(req: Request){
 const auth = requireAdmin(req); if(auth) return auth;
 const url = new URL(req.url);
 const limit = parseInt(url.searchParams.get('limit')||'20',10);
 const now = new Date().toISOString();
 const sb = supabaseAdmin();
 try {
 const { data: events, error } = await sb.from('blog_post_schedule_events')
 .select('*')
 .is('executed_at', null)
 .lte('run_at', now)
 .order('run_at', { ascending:true })
 .limit(limit);
 if(error) throw error;
 const results: any[] = [];
 for (const ev of events||[]){
 const slug = (typeof (ev as any).post_slug === 'string' && (ev as any).post_slug.trim())
 ? String((ev as any).post_slug).trim()
 : (ev?.payload && typeof ev.payload === 'object'
 ? String((ev.payload as any).post_slug ?? (ev.payload as any).slug ?? '')
 : '');
 if(ev.action === 'publish' && slug){
 try {
 const postId = await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug }
 );
 if (!postId) throw new Error('post-not-found');
 await sanityClient.patch(postId).set({ status:'published', publishedAt: new Date().toISOString() }).commit();
 results.push({ id: ev.id, ok:true, action:'publish', post_slug: slug });
 try { revalidatePath('/blog'); revalidatePath(`/blog/${slug}`); } catch (e) { /* revalidate errors ignored */ }
 await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString() }).eq('id', ev.id);
 } catch (e: any) {
 const msg = e?.message || String(e);
 results.push({ id: ev.id, ok:false, error: msg, post_slug: slug || null });
 await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString(), payload: { ...(ev.payload||{}), error: msg } }).eq('id', ev.id);
 }
 } else {
 // unsupported action
 const reason = slug ? 'unsupported action' : 'missing post_slug in payload';
 results.push({ id: ev.id, ok:false, error: reason });
 await sb.from('blog_post_schedule_events').update({ executed_at: new Date().toISOString(), payload: { ...(ev.payload||{}), error: reason } }).eq('id', ev.id);
 }
 }
 return NextResponse.json({ ok:true, processed: results.length, results });
 } catch (e: unknown) {
 const msg = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message?: unknown }).message ?? e) : String(e);
 logAdminAction({ route: '/api/admin/blog/schedule/run-due', method: 'POST', action: 'run_due_error', payload: { error: msg } });
 return NextResponse.json({ ok: false, error: msg }, { status: 500 });
 }
}

export const dynamic = 'force-dynamic';
