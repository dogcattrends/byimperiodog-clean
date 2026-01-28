import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { sanityClient } from '@/lib/sanity';
import { blocksToPlainText } from '@/lib/sanity/blocks';

const ENTIDADES = ['spitz','pomerânia','filhote','adulto','treinamento','socialização','alimentação','saúde','grooming','vacina'];

function computeFromBlocks(blocks: any[], meta:{seoTitle?:string|null;seoDescription?:string|null;description?:string|null}){
 const text = blocksToPlainText(blocks as any) || '';
 const words = (text.match(/\b\w+\b/g)||[]).length;
 const headings = Array.isArray(blocks)
 ? blocks.filter((b)=> b && b._type === 'block' && typeof b.style === 'string' && /^h\d+$/.test(b.style)).length
 : 0;
 const images = Array.isArray(blocks) ? blocks.filter((b)=> b && b._type === 'image').length : 0;
 const altWithText = 0;
 const densidadeEntidades = ENTIDADES.reduce((acc,e)=>{ const r=new RegExp(`\\b${e}\\b`,'gi'); const c=(text.match(r)||[]).length; acc[e]=c; return acc; },{} as Record<string,number>);
 const totalEntidades = Object.values(densidadeEntidades).reduce((a,b)=>a+b,0);
 let score = 0;
 if(words>=800) score+=20; if(words>=1200) score+=5; if(words>=1800) score+=5;
 if(headings>=8) score+=15; if(headings>=12) score+=5;
 if(images>=2) score+=10; if(images>=4) score+=5;
 if(images > 0 && altWithText>=images) score+=10; else if(images > 0 && altWithText>=Math.max(1,Math.round(images*0.7))) score+=5;
 if(totalEntidades>=10) score+=15; if(totalEntidades>=20) score+=5;
 if(meta.seoTitle) score+=5; if(meta.seoDescription) score+=5; if(meta.description) score+=5;
 const coverageAlt = images? Math.round((altWithText/images)*100):100;
 return { score, coverageAlt, words, headings, images };
}

export async function POST(req:Request){
 const auth = requireAdmin(req); if(auth) return auth;
 try {
 const body = await req.json() as { ids?: string[]; slugs?: string[] };
 const ids:string[] = Array.isArray(body?.ids) ? body!.ids! : [];
 const slugs:string[] = Array.isArray(body?.slugs) ? body!.slugs! : [];
 if(!ids.length && !slugs.length) return NextResponse.json({ ok:false, error:'ids/slugs vazio' },{ status:400 });

 const filter = ids.length
 ? `*[_type == "post" && _id in $ids]`
 : `*[_type == "post" && slug.current in $slugs]`;
 const items = await sanityClient.fetch<any[]>(
 `${filter}{ _id, "slug": slug.current, description, seoTitle, seoDescription, content, body }`,
 ids.length ? { ids } : { slugs }
 );
 const results = (items || []).map((p) => {
 const blocks = (p.content ?? p.body ?? []) as any[];
 return {
 id: String(p._id),
 slug: p.slug ?? null,
 ...computeFromBlocks(blocks, { seoTitle: p.seoTitle ?? null, seoDescription: p.seoDescription ?? null, description: p.description ?? null }),
 };
 });

 return NextResponse.json({ ok:true, items: results });
 } catch (e: unknown) {
 const msg = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message?: unknown }).message ?? e) : String(e);
 return NextResponse.json({ ok: false, error: msg || 'erro' }, { status: 500 });
 }
}
