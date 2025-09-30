"use client";
import React from 'react';
import Link from 'next/link';

type Result = { slug:string; title:string; excerpt:string|null; cover_url?:string|null; published_at?:string|null };

function highlight(text:string, q:string){
  if(!text) return null;
  try{
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re = new RegExp(`(${esc})`, 'ig');
    const parts = text.split(re);
    return parts.map((p, i)=> re.test(p)? <mark key={i} className="bg-yellow-200 text-black">{p}</mark> : <span key={i}>{p}</span>);
  }catch{ return text; }
}

export default function SearchBox({ initialQ }: { initialQ?: string }){
  const [q, setQ] = React.useState(initialQ||'');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<Result[]>([]);
  const [error, setError] = React.useState<string|undefined>();

  React.useEffect(()=>{
    if(!q || q.trim().length<2){ setResults([]); setError(undefined); return; }
    setLoading(true); setError(undefined);
    const ctrl = new AbortController();
    const id = setTimeout(async ()=>{
      try{
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal, cache:'no-store' });
        const j = await res.json();
        setResults(Array.isArray(j?.results)? j.results.slice(0,20): []);
      }catch(e:any){ if(e?.name!=='AbortError') setError('Falha ao buscar'); }
      finally{ setLoading(false); }
    }, 250);
    return ()=>{ clearTimeout(id); ctrl.abort(); };
  }, [q]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar artigos" className="w-full sm:w-96 rounded border px-3 py-2" />
        <button disabled className="rounded border px-3 py-2 opacity-60 cursor-default">Buscar</button>
      </div>
      {loading && <p className="text-sm text-zinc-600">Buscando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && q && results.length===0 && <p className="text-sm text-zinc-600">Sem resultados para “{q}”.</p>}
      {results.length>0 && (
        <ul className="space-y-3">
          {results.map((r)=> (
            <li key={r.slug} className="border rounded p-3 bg-white">
              <Link className="font-semibold hover:underline" href={`/blog/${r.slug}`}>{highlight(r.title, q)}</Link>
              {r.excerpt && <p className="text-sm text-zinc-600 line-clamp-2">{highlight(r.excerpt, q)}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
