import { NextResponse } from 'next/server';

import { requireAdmin, logAdminAction } from '@/lib/adminAuth';
import { sanityBlogRepo, sanityClient } from '@/lib/sanity';
import { blocksToPlainText } from '@/lib/sanity/blocks';

/*
 POST /api/admin/blog/translate
 Body: { post_id: string; target_lang: string; force?: boolean }
 - Gera versão localizada do post em blog_post_localizations se não existir
 - Usa OpenAI ou fallback simples
*/

interface TranslateReq { post_id?: string; slug?: string; target_lang: string; force?: boolean }

export async function POST(req: Request){
 try {
 const auth = requireAdmin(req);
 if (auth) return auth;

 const body = await req.json() as TranslateReq;
 if((!body.post_id && !body.slug) || !body.target_lang) return NextResponse.json({ ok:false, error:'post_id (ou slug) e target_lang obrigatórios'}, { status:400 });
 const lang = body.target_lang;

 const base = await sanityClient.fetch<any>(
 `*[_type == "post" && (${body.post_id ? '_id == $id' : 'slug.current == $slug'})][0]{
 _id,
 title,
 description,
 seoTitle,
 seoDescription,
 slug,
 category,
 tags,
 coverUrl,
 ogImageUrl,
 content,
 body,
 }`,
 body.post_id ? { id: body.post_id } : { slug: body.slug }
 );
 if(!base) return NextResponse.json({ ok:false, error:'Post não encontrado'}, { status:404 });

 const baseSlug = (base.slug?.current || body.slug || '').trim();
 const locSlug = `${baseSlug}-${lang.toLowerCase()}`.replace(/[^a-z0-9-]/g,'');

 if(!body.force){
 const existingId = await sanityClient.fetch<string | null>(
 `*[_type == "post" && slug.current == $slug][0]._id`,
 { slug: locSlug }
 );
 if(existingId) {
 return NextResponse.json({ ok:true, reused:true, localization_id: existingId, post_id: existingId, slug: locSlug });
 }
 }

 const openaiKey = process.env.OPENAI_API_KEY;
 let translatedText: string; let translatedTitle: string; let translatedSeoTitle: string; let translatedSeoDesc: string;
 const baseBlocks = (base.content ?? base.body ?? []) as any[];
 const baseText = blocksToPlainText(baseBlocks as any) || '';
 if(!openaiKey){
 // fallback simples (marca idioma, não traduz realmente)
 translatedTitle = `[${lang}] ${base.title}`;
 translatedText = `Tradução placeholder (${lang}).\n\n` + baseText;
 translatedSeoTitle = `[${lang}] ${(base.seoTitle || base.title || '')}`.slice(0,60);
 translatedSeoDesc = `[${lang}] ${(base.seoDescription || base.description || base.title || '')}`.slice(0,155);
 } else {
 const prompt = `Traduza para o idioma alvo mantendo clareza e SEO natural, sem adicionar informações novas. Responda SOMENTE com texto (sem JSON, sem markdown). Idioma destino: ${lang}.\n\nTexto:\n\n${baseText}`;
 const res = await fetch('https://api.openai.com/v1/chat/completions',{ method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${openaiKey}`}, body: JSON.stringify({ model:'gpt-4o-mini', temperature:0.4, messages:[{ role:'user', content: prompt }], max_tokens:4000 }) });
 if(!res.ok){ const t = await res.text(); throw new Error('Falha OpenAI translate: '+t); }
 const j = await res.json();
 translatedText = (j.choices?.[0]?.message?.content || baseText).trim();
 translatedTitle = `[${lang}] ${(base.title || '').trim()}`.slice(0,140);
 translatedSeoTitle = translatedTitle.slice(0,60);
 translatedSeoDesc = translatedText.slice(0,155);
 }

 const saved = await sanityBlogRepo.upsertPost({
 title: translatedTitle,
 slug: locSlug,
 excerpt: base.description ?? null,
 content: translatedText,
 status: 'draft',
 category: base.category ?? null,
 tags: Array.isArray(base.tags) ? base.tags : [],
 coverUrl: base.coverUrl ?? null,
 seoTitle: translatedSeoTitle,
 seoDescription: translatedSeoDesc,
 ogImageUrl: base.ogImageUrl ?? null,
 publishedAt: null,
 scheduledAt: null,
 } as any);
 if(!saved) throw new Error('Falha ao salvar tradução no Sanity');

 logAdminAction({ route:'/api/admin/blog/translate', method:'POST', action:'translate_post', payload:{ baseSlug, locSlug, lang, postId: saved.id } });
 return NextResponse.json({ ok:true, localization_id: saved.id, post_id: saved.id, slug: saved.slug });
 } catch (e: unknown) {
 const msg = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message?: unknown }).message ?? e) : String(e);
 return NextResponse.json({ ok: false, error: msg }, { status: 500 });
 }
}
