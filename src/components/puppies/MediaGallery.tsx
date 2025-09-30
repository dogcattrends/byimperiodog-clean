"use client";
import React, { useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import { useToast } from '@/components/ui/toast';

export interface MediaGalleryProps {
  media: string[];
  cover?: string;
  onChange: (list: string[]) => void;
  onSelectCover?: (url: string) => void;
  max?: number;
  className?: string;
  label?: string;
}

export default function MediaGallery({ media, cover, onChange, onSelectCover, max=6, className='', label='Galeria (até 6)' }: MediaGalleryProps){
  const { push } = useToast();
  const [progress,setProgress] = useState<Record<string,number>>({});
  const liveRef = React.useRef<HTMLDivElement|null>(null);

  async function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const files = e.target.files; if(!files?.length) return; const remaining = Math.max(0, max - media.length); if(remaining===0){ push({ type:'error', message:`Limite de ${max} imagens`}); return; }
    const list = Array.from(files).slice(0, remaining);
    const newUrls:string[] = [];
    for(const f of list){
      try {
        const buf = await f.arrayBuffer();
        const b64 = `data:${f.type};base64,${Buffer.from(buf).toString('base64')}`;
        setProgress(p=>({...p,[f.name]:10}));
        const r = await adminFetch('/api/admin/puppies/upload',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ filename:f.name, dataBase64:b64 })});
        const j = await r.json(); if(!r.ok) throw new Error(j?.error||'upload falhou');
        setProgress(p=>({...p,[f.name]:100}));
        newUrls.push(j.url);
      } catch(err:any){ push({ type:'error', message: err?.message||'Erro upload'}); }
    }
    if(newUrls.length){
      let next = [...media, ...newUrls];
      const coverUrl = cover || newUrls[0];
      if(!cover && coverUrl && onSelectCover){ onSelectCover(coverUrl); }
      if(coverUrl){ next = [coverUrl, ...next.filter(u=> u!==coverUrl)]; }
      onChange(next);
      liveRef.current && (liveRef.current.textContent = `${newUrls.length} imagem(ns) adicionada(s). Total: ${next.length}`);
    }
    e.target.value='';
  }

  function onDragStart(e:React.DragEvent<HTMLLIElement>, index:number){ e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed='move'; }
  function onDragOver(e:React.DragEvent<HTMLLIElement>){ e.preventDefault(); e.dataTransfer.dropEffect='move'; }
  function onDrop(e:React.DragEvent<HTMLLIElement>, index:number){
    e.preventDefault();
    const fromStr = e.dataTransfer.getData('text/plain');
    const from = parseInt(fromStr,10);
    if(isNaN(from) || from===index) return;
    const arr = [...media];
    const [moved] = arr.splice(from,1);
    arr.splice(index,0,moved);
    onChange(arr);
    liveRef.current && (liveRef.current.textContent = 'Imagem reposicionada. Nova ordem aplicada.');
  }

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="font-medium" id="media-gallery-label">{label}</label>
        <input aria-labelledby="media-gallery-label" type="file" accept="image/*" multiple onChange={handleFile} className="text-[11px]" />
      </div>
      <div ref={liveRef} aria-live="polite" className="sr-only" />
      {Object.keys(progress).length>0 && (
        <div className="flex flex-col gap-1 text-[10px]" aria-label="Uploads em progresso">
          {Object.entries(progress).map(([k,v])=> (
            <div key={k} className="flex items-center gap-2">
              <span className="truncate max-w-[120px]" title={k}>{k}</span>
              <div className="flex-1 h-1 rounded bg-[var(--surface-2)] overflow-hidden"><div style={{width:`${v}%`}} className="h-full bg-[var(--accent)] transition-[width]" /></div>
            </div>
          ))}
        </div>
      )}
      {media.length>0 && <ul className="grid grid-cols-3 gap-2" aria-label="Galeria reordenável" role="list">
        {media.map((m,i)=> {
          const isCover = cover===m;
          return (
            <li key={m} role="listitem" draggable onDragStart={(e)=> onDragStart(e,i)} onDragOver={onDragOver} onDrop={(e)=> onDrop(e,i)} className={`relative group aspect-square overflow-hidden rounded-lg border ${isCover? 'border-[var(--accent)] ring-2 ring-[var(--accent)]':'border-[var(--border)]'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m} alt={isCover? 'Capa (arraste para reordenar)': 'Miniatura (arraste)'} className="h-full w-full object-cover select-none pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/50 to-black/0" />
              <button type="button" onClick={()=> onChange(media.filter((_,x)=> x!==i))} aria-label="Remover" className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-[11px] opacity-0 group-hover:opacity-100 transition">×</button>
              {onSelectCover && (
                <button type="button" onClick={()=> onSelectCover(m)} className={`absolute left-1 bottom-1 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${isCover? 'bg-[var(--accent)] text-[var(--accent-contrast)]':'bg-black/40 text-white'} opacity-0 group-hover:opacity-100 transition`}>{isCover? 'CAPA':'Definir capa'}</button>
              )}
            </li>
          );})}
      </ul>}
      {media.length===0 && <p className="text-[11px] text-[var(--text-muted)]">Nenhuma mídia enviada.</p>}
      <p className="text-[10px] text-[var(--text-muted)]">Arraste para reordenar. A primeira é usada como capa para a vitrine.</p>
    </div>
  );
}
