// Persistence layer for blog post embeddings (Supabase). No new envs.
import { embedText } from './rag';
import { supabaseAdmin } from './supabaseAdmin';

export async function ensurePostEmbedding(post: { id:string; content_mdx?:string|null; title?:string|null }){
  const content = `${post.title||''}\n\n${post.content_mdx||''}`.slice(0,12000);
  const sb = supabaseAdmin();
  try {
    const vec = await embedText(content);
    // Store embedding as JSON string to match existing expectations in tests and DB.
    await sb.from('blog_post_embeddings').upsert({ post_id: post.id, source: 'mdx', embedding: JSON.stringify(vec) });
    return true;
  } catch(e){
    console.warn('[embeddings] store failed', e);
    return false;
  }
}

export async function batchEnsureEmbeddings(posts: { id:string; content_mdx?:string|null; title?:string|null }[], limit=30){
  const slice = posts.slice(0, limit);
  const out: { id:string; ok:boolean }[] = [];
  for(const p of slice){
    const ok = await ensurePostEmbedding(p);
    out.push({ id:p.id, ok });
  }
  return out;
}
