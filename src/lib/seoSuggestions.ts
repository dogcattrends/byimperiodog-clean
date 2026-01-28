import { sanityClient } from './sanity';
import { supabaseAdmin } from './supabaseAdmin';

export interface SeoSuggestion { id:string; entity_type:string; entity_id:string|null; entity_ref:string|null; data_json:Record<string, unknown>|null; score:number|null; status:string; }

export async function listSuggestions(status='proposed', limit=50){
 const sb = supabaseAdmin();
 const { data, error } = await sb.from('seo_suggestions').select('id,entity_type,entity_id,entity_ref,data_json,score,status,created_at').eq('status', status).order('created_at',{ ascending:false }).limit(limit);
 if(error) throw error; return data||[];
}

export async function approveSuggestion(id:string){
 const sb = supabaseAdmin();
 const { data, error } = await sb.from('seo_suggestions').update({ status:'approved', approved_at: new Date().toISOString() }).eq('id', id).select('id').maybeSingle();
 if(error) throw error; return data;
}

export async function applySuggestion(id:string){
 const sb = supabaseAdmin();
 const { data: sug, error } = await sb.from('seo_suggestions').select('id,entity_type,entity_id,entity_ref,data_json,status').eq('id', id).maybeSingle();
 if(error) throw error; if(!sug) throw new Error('not-found');
 if(sug.status !== 'approved' && sug.status !== 'proposed') throw new Error('invalid-status');
 if((sug.entity_type === 'post' || sug.entity_type === 'blog_post') && (sug.entity_ref || sug.entity_id)){
 const patch: Record<string, unknown> = {};
 const d = (sug as { data_json: Record<string, unknown>|null }).data_json || {};

 // Compat com chaves antigas (snake_case) e novas (camelCase)
 if(d.seoTitle || d.seo_title) patch.seoTitle = (d.seoTitle ?? d.seo_title) as unknown;
 if(d.seoDescription || d.seo_description) patch.seoDescription = (d.seoDescription ?? d.seo_description) as unknown;
 if(d.ogImageUrl || d.og_image_url) patch.ogImageUrl = (d.ogImageUrl ?? d.og_image_url) as unknown;
 if(d.canonicalUrl || d.canonical_url || d.canonical) patch.canonicalUrl = (d.canonicalUrl ?? d.canonical_url ?? d.canonical) as unknown;
 if(d.robots) patch.robots = d.robots as unknown;

 if(Object.keys(patch).length){
 let postId: string | null = null;
 if(sug.entity_id){
 // best-effort: entity_id pode ser legado (uuid do Supabase). Preferir entity_ref.
 postId = null;
 }
 if(!postId && sug.entity_ref){
 postId = await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug: sug.entity_ref }
 );
 }
 if(!postId) throw new Error('post-not-found');
 await sanityClient.patch(postId).set(patch).commit();
 }
 }
 await sb.from('seo_suggestions').update({ status:'applied', approved_at: new Date().toISOString(), approved_by: null, approved_at_ext: new Date().toISOString() }).eq('id', id);
 return { applied:true };
}
