import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin, logAdminAction } from '@/lib/adminAuth';
import { batchEnsureEmbeddings } from '@/lib/embeddings.store.blog';
import { sanityClient } from '@/lib/sanity/client';


// Minimal reindex endpoint: re-embeds latest N published posts using OpenAI if available
export async function POST(req: NextRequest){
 const auth = requireAdmin(req); if(auth) return auth;
 try{
 const { searchParams } = new URL(req.url);
 const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit')||'50')||50));

 const posts = await sanityClient.fetch<Array<{ slug: string; title?: string | null; plain?: string | null }>>(
 `*[_type == "post" && status == "published" && defined(slug.current)]
 | order(coalesce(publishedAt, _updatedAt) desc)[0...$limit]{
 "slug": slug.current,
 title,
 "plain": pt::text(coalesce(content, body))
 }`,
 { limit }
 );
 if(!posts || posts.length===0) return NextResponse.json({ ok:true, updated:0 });

 const result = await batchEnsureEmbeddings(
 posts.map((p) => ({ slug: p.slug, title: p.title ?? null, content: p.plain ?? null })),
 limit
 );
 const updated = result.filter((r) => r.ok).length;

 await logAdminAction({ route:'/api/admin/embeddings/reindex', method:'POST', action:'reindex', payload:{ count: posts.length } });
 return NextResponse.json({ ok:true, updated, attempted: posts.length });
 }catch(e:any){
 await logAdminAction({ route:'/api/admin/embeddings/reindex', method:'POST', action:'reindex_error', payload:{ error: e?.message } });
 return NextResponse.json({ ok:false, error: e?.message||String(e) },{ status:500 });
 }
}
