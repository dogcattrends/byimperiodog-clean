import { ImageResponse } from 'next/og';
import { supabaseAnon } from '@/lib/supabaseAnon';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function fetchPost(slug:string){
  try { const sb = supabaseAnon(); const { data } = await (sb as any).from('blog_posts').select('title,excerpt,cover_url,status').eq('slug', slug).maybeSingle(); if(!data || data.status!=='published') return null; return data; } catch { return null; }
}

export default async function OG({ params }:{ params:{ slug:string } }){
  const post = await fetchPost(params.slug);
  const title = post?.title || 'Blog';
  const excerpt = post?.excerpt || '';
  const cover = post?.cover_url;
  const gradient = 'linear-gradient(135deg,#1e293b 0%,#0f766e 45%,#16a34a 100%)';
  return new ImageResponse(
    (
      <div style={{ fontFamily:'system-ui,Segoe UI,Roboto', height:'100%', width:'100%', display:'flex', flexDirection:'column', background: cover? '#000':'#0f172a', color:'#fff', position:'relative' }}>
        {cover && (
          <img src={cover} width={1200} height={630} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55) contrast(1.05)' }} />
        )}
        {!cover && (
          <div style={{ position:'absolute', inset:0, background: gradient }} />
        )}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.75) 100%)' }} />
        <div style={{ display:'flex', flexDirection:'column', padding:'56px 72px 60px', gap:32, justifyContent:'space-between', height:'100%' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <div style={{ fontSize:20, letterSpacing:2, fontWeight:600, textTransform:'uppercase', opacity:0.9 }}>By Império Dog</div>
            <h1 style={{ fontSize:70, lineHeight:1.05, fontWeight:700, margin:0 }}>{title.slice(0,140)}</h1>
            {excerpt && <p style={{ fontSize:28, lineHeight:1.25, fontWeight:400, opacity:0.9, margin:0 }}>{excerpt.slice(0,200)}</p>}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:24, width:'100%' }}>
            <span style={{ fontWeight:500 }}>www.byimperiodog.com.br</span>
            <span style={{ fontSize:22, fontWeight:400, opacity:0.85 }}>{post? 'Artigo':'Conteúdo indisponível'}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
