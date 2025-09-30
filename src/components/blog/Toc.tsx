"use client";
import React, { useEffect, useState } from 'react';

interface TocItem { id:string; text:string; level:number; }
export function Toc(){
  const [items,setItems] = useState<TocItem[]>([]);
  const [active,setActive] = useState<string>('');
  useEffect(()=>{
    const hs = Array.from(document.querySelectorAll('article h2, article h3')) as HTMLElement[];
    const mapped = hs.map(h=> ({ id: h.id || h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'', text: h.textContent||'', level: h.tagName==='H2'?2:3 }));
    mapped.forEach(m=>{ const el=document.getElementById(m.id); if(el) el.id=m.id; });
    setItems(mapped.filter(m=> m.id));
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) setActive(e.target.id); });
    },{ rootMargin:'0px 0px -70% 0px', threshold:[0,1] });
    hs.forEach(h=> obs.observe(h));
    return ()=> obs.disconnect();
  },[]);
  if(!items.length) return null;
  return (
    <nav aria-label="Tabela de Conteúdo" className="sticky top-24 hidden lg:block w-64 text-sm">
      <div className="mb-2 font-semibold tracking-wide text-zinc-700">No artigo</div>
      <ul className="space-y-1 border-l pl-3">
        {items.map(i=> (
          <li key={i.id}>
            <a data-evt="toc_click" data-id={i.id} href={`#${i.id}`} className={`block truncate hover:text-emerald-600 transition ${active===i.id? 'text-emerald-600 font-medium':'text-zinc-600'} ${i.level===3? 'ml-2 text-[13px]':''}`}>{i.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
