// Persistence layer for blog post embeddings (Supabase). No new envs.
import { embedText } from './rag';
import { supabaseAdmin } from './supabaseAdmin';

export async function ensurePostEmbedding(post: { slug: string; content?: string | null; title?: string | null }){
 const slug = String(post.slug || '').trim();
 if (!slug) return false;
 const content = `${post.title||''}\n\n${post.content||''}`.slice(0,12000);
 const sb = supabaseAdmin();
 try {
 const vec = await embedText(content);
 // Store embedding as JSON string to match existing expectations in tests and DB.
 await sb
 .from('blog_post_embeddings')
 .upsert(
 { post_slug: slug, source: 'sanity', embedding: JSON.stringify(vec) },
 { onConflict: 'post_slug,source' }
 );
 return true;
 } catch(e){
 console.warn('[embeddings] store failed', e);
 return false;
 }
}

export async function batchEnsureEmbeddings(posts: { slug: string; content?: string | null; title?: string | null }[], limit=30){
 const slice = posts.slice(0, limit);
 const out: { slug:string; ok:boolean }[] = [];
 for(const p of slice){
 const ok = await ensurePostEmbedding(p);
 out.push({ slug:p.slug, ok });
 }
 return out;
}
