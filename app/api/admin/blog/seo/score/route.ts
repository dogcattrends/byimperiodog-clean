import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { sanityClient } from '@/lib/sanity';
import { blocksToPlainText } from '@/lib/sanity/blocks';

const ENTIDADES = ['spitz','pomerânia','filhote','adulto','treinamento','socialização','alimentação','saúde','grooming','vacina'];

export async function GET(req:Request){
 const auth = requireAdmin(req as any); if(auth) return auth;
 const url = new URL(req.url);
 const id = url.searchParams.get('id');
 const slug = url.searchParams.get('slug');
 if(!id && !slug) return NextResponse.json({ ok:false, error:'id ou slug obrigatório' },{ status:400 });
 try {
 const post = await sanityClient.fetch<any>(
 `*[_type == "post" && (${id ? '_id == $id' : 'slug.current == $slug'})][0]{
 _id,
 title,
 description,
 seoTitle,
 seoDescription,
 content,
 body,
 }`,
 id ? { id } : { slug }
 );
 if(!post) return NextResponse.json({ ok:false, error:'not found' },{ status:404 });

 const blocks = (post.content ?? post.body ?? []) as any[];
 const text = blocksToPlainText(blocks as any) || '';
 const words = (text.match(/\b\w+\b/g)||[]).length;
 const headings = Array.isArray(blocks)
 ? blocks.filter((b)=> b && b._type === 'block' && typeof b.style === 'string' && /^h\d+$/.test(b.style)).length
 : 0;
 const images = Array.isArray(blocks) ? blocks.filter((b)=> b && b._type === 'image').length : 0;
 const altWithText = 0;

 const densidadeEntidades = ENTIDADES.reduce((acc,e)=>{ const r=new RegExp(`\\b${e}\\b`,'gi'); const c=(text.match(r)||[]).length; acc[e]=c; return acc; },{} as Record<string,number>);
 const totalEntidades = Object.values(densidadeEntidades).reduce((a,b)=>a+b,0);
 // Score heurístico
 let score = 0;
 if(words>=800) score+=20; if(words>=1200) score+=5; if(words>=1800) score+=5;
 if(headings>=8) score+=15; if(headings>=12) score+=5;
 if(images>=2) score+=10; if(images>=4) score+=5;
 if(images > 0 && altWithText>=images) score+=10; else if(images > 0 && altWithText>=Math.max(1,Math.round(images*0.7))) score+=5;
 if(totalEntidades>=10) score+=15; if(totalEntidades>=20) score+=5;
 if(post.seoTitle) score+=5; if(post.seoDescription) score+=5; if(post.description) score+=5;
 const coverageAlt = images? Math.round((altWithText/images)*100):100;
 return NextResponse.json({ ok:true, score, coverageAlt, words, headings, images, entidades: densidadeEntidades });
 } catch (e: unknown) {
 const msg = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message?: unknown }).message ?? e) : String(e);
 return NextResponse.json({ ok: false, error: msg || 'erro' }, { status: 500 });
 }
}
