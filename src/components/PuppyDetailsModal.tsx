"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabasePublic } from '@/lib/supabasePublic';
import track from '@/lib/track';
import { Loader, Link as LinkIcon, Share2, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/dashboard/Modal';

export default function PuppyDetailsModal({ id, onClose }: { id:string; onClose:()=>void }){
  const [puppy, setPuppy] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);
  const [index,setIndex] = useState(0);
  const touchStartX = useRef<number| null>(null);
  const touchDeltaX = useRef(0);
  const [fitMode,setFitMode] = useState<'contain'|'cover'>('contain');
  const [lightbox,setLightbox] = useState(false);
  const lbWrapperRef = useRef<HTMLDivElement|null>(null);
  const [zoom,setZoom] = useState(1);
  const [pan,setPan] = useState({x:0,y:0});
  const panRef = useRef({x:0,y:0});
  // A11y roving focus para miniaturas
  const [thumbFocus,setThumbFocus] = useState(0);
  const thumbRefs = useRef<(HTMLButtonElement|null)[]>([]);
  const lightboxThumbRefs = useRef<(HTMLButtonElement|null)[]>([]);
  const lastPanPointRef = useRef<{x:number;y:number}|null>(null);
  // Multi-pointer tracking para pinch & pan
  const pointersRef = useRef<Map<number,{x:number;y:number}>>(new Map());
  const pinchStartRef = useRef<{
    distance:number;
    zoom:number;
    center:{x:number;y:number};
    pan:{x:number;y:number};
  }|null>(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabasePublic().from('puppies').select('*').eq('id', id).single();
        if(error) throw error;
        if(!abort){
          setPuppy(data);
          track.event?.('view_puppy_modal',{ id:data?.id, name: data?.nome||data?.name });
        }
      } catch(e:any){ if(!abort) setError(e?.message||'Erro'); }
      finally { if(!abort) setLoading(false); }
    })();

    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      abort = true;
      window.removeEventListener("keydown", esc);
    };
  }, [id, onClose]);

  const cover = useMemo(()=>{
    if(!puppy) return undefined;
    const media = puppy.midia || puppy.media;
    // midia pode ser array de objetos {url} ou strings
    const firstMedia = Array.isArray(media) && media.length? (media[0]?.url || media[0]): undefined;
    return puppy.imageUrl||puppy.image_url||puppy.image||puppy.foto||puppy.thumb||puppy.capa||puppy.cover||puppy.main_photo||puppy.photo||puppy.picture|| firstMedia;
  },[puppy]);

  // Lista completa de URLs (capa primeiro, depois resto único)
  const mediaUrls = useMemo(()=>{
    const raw = (puppy?.midia || puppy?.media) ?? [];
    const urls:string[] = [];
    for(const m of raw){
      const u = (m && typeof m === 'object')? m.url : m;
      if(u && typeof u === 'string') urls.push(u);
    }
    const base = cover? [cover, ...urls.filter(u=> u!==cover)] : urls;
    // Limitar a 24 para performance
    return Array.from(new Set(base)).slice(0,24);
  },[puppy, cover]);

  // Ajusta index se lista muda
  useEffect(()=>{ setIndex(0); },[puppy?.id]);
  useEffect(()=>{ setThumbFocus(0); },[puppy?.id]);
  // Preload imagem anterior e próxima
  useEffect(()=>{
    if(typeof window==='undefined') return;
    const preload = (u:string)=> { const img = new window.Image(); img.decoding='async'; img.loading='eager'; img.src = u; };
    const next = mediaUrls[index+1];
    const prev = mediaUrls[index-1];
    if(next) preload(next);
    if(prev) preload(prev);
  },[index, mediaUrls]);

  const canPrev = index>0;
  const canNext = index < mediaUrls.length-1;
  const goPrev = useCallback(()=> { if(canPrev) setIndex(i=> i-1); },[canPrev]);
  const goNext = useCallback(()=> { if(canNext) setIndex(i=> i+1); },[canNext]);

  // Teclas de navegação
  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      if(e.key==='ArrowLeft') { e.preventDefault(); goPrev(); }
      else if(e.key==='ArrowRight'){ e.preventDefault(); goNext(); }
    }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[goPrev, goNext]);

  // Handlers de swipe (mobile)
  const onTouchStart = (e:React.TouchEvent)=> { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const onTouchMove = (e:React.TouchEvent)=> { if(touchStartX.current!=null){ touchDeltaX.current = e.touches[0].clientX - touchStartX.current; } };
  const onTouchEnd = ()=> {
    if(touchStartX.current!=null){
      const d = touchDeltaX.current;
      if(Math.abs(d) > 60){
        if(d>0) goPrev(); else goNext();
      }
    }
    touchStartX.current = null; touchDeltaX.current=0;
  };

  // Lightbox zoom handlers -----------------------------------------
  useEffect(()=>{
    if(!lightbox){
      setZoom(1); setPan({x:0,y:0}); panRef.current={x:0,y:0}; lastPanPointRef.current=null;
      pointersRef.current.clear(); pinchStartRef.current=null;
      return;
    }
    function onWheel(e:WheelEvent){
      e.preventDefault();
      setZoom(z=> {
        const nz = Math.min(5, Math.max(1, z + (e.deltaY<0? 0.15 : -0.15)));
        return nz;
      });
    }
    const el = lbWrapperRef.current;
    if(el) el.addEventListener('wheel', onWheel, { passive:false });
    return ()=> { if(el) el.removeEventListener('wheel', onWheel as any); };
  },[lightbox]);
  // Clamp pan para não "perder" a imagem
  const clampPan = useCallback((p:{x:number;y:number}, z:number)=>{
    const el = lbWrapperRef.current;
    if(!el || z<=1) return {x:0,y:0};
    const { width, height } = el.getBoundingClientRect();
    const maxX = (width * (z-1))/2;
    const maxY = (height * (z-1))/2;
    return { x: Math.min(maxX, Math.max(-maxX, p.x)), y: Math.min(maxY, Math.max(-maxY, p.y)) };
  },[]);

  const onPointerDown = (e:React.PointerEvent)=>{
    if(!lightbox) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId,{ x:e.clientX, y:e.clientY });
    if(pointersRef.current.size===2){
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x; const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx,dy);
      const center = { x:(pts[0].x+pts[1].x)/2, y:(pts[0].y+pts[1].y)/2 };
      pinchStartRef.current = { distance:dist, zoom, center, pan:{...panRef.current} };
    }
  };
  const onPointerMove = (e:React.PointerEvent)=>{
    if(!lightbox) return;
    if(!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId,{ x:e.clientX, y:e.clientY });
  if(pointersRef.current.size===2 && pinchStartRef.current){
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x; const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx,dy);
      let newZoom = pinchStartRef.current.zoom * (dist / pinchStartRef.current.distance);
      newZoom = Math.min(5, Math.max(1, newZoom));
      const newCenter = { x:(pts[0].x+pts[1].x)/2, y:(pts[0].y+pts[1].y)/2 };
      const scaleDelta = newZoom / pinchStartRef.current.zoom;
      const panDelta = {
        x: pinchStartRef.current.pan.x + (newCenter.x - pinchStartRef.current.center.x)*(1 - scaleDelta),
        y: pinchStartRef.current.pan.y + (newCenter.y - pinchStartRef.current.center.y)*(1 - scaleDelta),
      };
      const clamped = clampPan(panDelta, newZoom);
      panRef.current = clamped;
      setPan(clamped);
      setZoom(newZoom);
    } else if(pointersRef.current.size===1 && !pinchStartRef.current){
      // Pan simples com um dedo
      const cur = Array.from(pointersRef.current.values())[0];
      if(!lastPanPointRef.current) lastPanPointRef.current = { ...cur };
      const dx = cur.x - lastPanPointRef.current.x;
      const dy = cur.y - lastPanPointRef.current.y;
      lastPanPointRef.current = { ...cur };
      if(zoom>1){
        const updated = { x: panRef.current.x + dx, y: panRef.current.y + dy };
        const clamped = clampPan(updated, zoom);
        panRef.current = clamped; setPan(clamped);
      }
    }
  };
  const onPointerUp = (e:React.PointerEvent)=>{
    if(!lightbox) return;
    pointersRef.current.delete(e.pointerId);
    if(pointersRef.current.size<2){
      pinchStartRef.current=null;
    }
    if(pointersRef.current.size===0){
      lastPanPointRef.current=null;
    }
  };

  // Close on ESC inside lightbox
  useEffect(()=>{
    function esc(e:KeyboardEvent){ if(e.key==='Escape' && lightbox){ e.preventDefault(); setLightbox(false); } }
    window.addEventListener('keydown', esc); return ()=> window.removeEventListener('keydown', esc);
  },[lightbox]);

  const name = puppy?.nome || puppy?.name || "Filhote";
  const formattedPrice = useMemo(()=>{
    const raw = puppy?.priceCents || puppy?.price_cents;
    if(!raw) return 'Sob consulta';
    return Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL'}).format(raw/100);
  },[puppy]);

  const shareLink = async ()=>{
    const link = window.location.href;
    try {
      if(navigator.share){
        await navigator.share({ title:`${name} - Spitz Alemão`, url:link });
      } else {
        await navigator.clipboard.writeText(link);
        setCopied(true); setTimeout(()=> setCopied(false),1500);
      }
    } catch(e){ console.error('Erro ao compartilhar:', e); }
  };

  const statusLabel = (status:string)=>{
    if(status==='reservado') return '🟡 Reservado';
    if(status==='vendido') return '❤️ Vendido';
    return '💚 Disponível';
  };

  const date = puppy?.birth_date || puppy?.nascimento;
  const formattedDate = date
    ? new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
  const instructionsId = `puppy-gallery-instructions-${id}`;
  const statusLiveId = `puppy-status-${id}`;

  // Focar miniatura quando roving index muda
  useEffect(()=>{
    thumbRefs.current[thumbFocus]?.focus();
  },[thumbFocus]);
  useEffect(()=>{
    if(lightbox) lightboxThumbRefs.current[thumbFocus]?.focus();
  },[thumbFocus, lightbox]);

  const onThumbListKey = (e:React.KeyboardEvent, inLightbox:boolean)=>{
    if(e.key==='ArrowRight' || e.key==='ArrowLeft'){
      e.preventDefault();
      setThumbFocus(f=>{
        const dir = e.key==='ArrowRight'? 1 : -1;
        const next = (f + dir + mediaUrls.length) % mediaUrls.length;
        setIndex(next);
        return next;
      });
    }
    if(e.key==='Home'){ e.preventDefault(); setThumbFocus(0); setIndex(0); }
    if(e.key==='End'){ e.preventDefault(); setThumbFocus(mediaUrls.length-1); setIndex(mediaUrls.length-1); }
  };

  return (<>
    <Modal open={true} onOpenChange={(o)=> { if(!o) onClose(); }} title={name} size="lg" description={puppy?.status? statusLabel(puppy.status): undefined}>
      {loading && !puppy && !error && (
        <div className="flex items-center justify-center py-10"><Loader className="h-6 w-6 animate-spin text-zinc-400" /></div>
      )}
      {error && <p className="text-sm text-red-600">Falha ao carregar: {error}</p>}
      {!loading && puppy && (
        <div className="space-y-5">
      {mediaUrls.length>0 && (
            <div
              className="relative group select-none"
              role="region"
              aria-roledescription="carrossel"
              aria-label={`Galeria de imagens de ${name}`}
              aria-describedby={instructionsId}
            >
              <div
                className="w-full overflow-hidden rounded-xl bg-zinc-100 aspect-[4/3] sm:aspect-[3/2] md:aspect-[16/10] relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
        onDoubleClick={()=> setLightbox(true)}
        onClick={(e)=> { if(e.detail===2) return; /* single click ignore */ }}
              >
                {/* Slider container */}
                <div className="h-full w-full relative">
                  <Image
                    key={mediaUrls[index]}
                    src={mediaUrls[index]}
                    alt={`Imagem ${index+1} de ${mediaUrls.length} - ${name}`}
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 960px"
          className={`will-change-transform ${fitMode==='contain'? 'object-contain bg-zinc-50':'object-cover'}`}
                  />
                </div>
                <span id={instructionsId} className="sr-only">
                  Use as setas esquerda e direita para navegar pelas imagens, Enter ou botão Zoom para ampliar. Pressione ESC para fechar o zoom.
                </span>
                {/* Indicadores & Controles */}
                {mediaUrls.length>1 && (
                  <>
                    <button
                      onClick={goPrev}
                      disabled={!canPrev}
                      aria-label="Anterior"
                      className="absolute top-1/2 -translate-y-1/2 left-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition"
                    >‹</button>
                    <button
                      onClick={goNext}
                      disabled={!canNext}
                      aria-label="Próxima"
                      className="absolute top-1/2 -translate-y-1/2 right-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition"
                    >›</button>
                    <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                      {mediaUrls.map((_,i)=> (
                        <span key={i} className={`h-1.5 rounded-full transition-all ${i===index? 'w-5 bg-white shadow':'w-2 bg-white/60'}`} />
                      ))}
                    </div>
                    <div className="absolute top-2 right-2 text-[11px] font-medium bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {index+1}/{mediaUrls.length}
                    </div>
                    <button
                      type="button"
                      onClick={()=> setFitMode(f=> f==='contain'?'cover':'contain')}
                      className="absolute top-2 left-2 text-[11px] font-medium bg-black/50 text-white px-2 py-0.5 rounded-md backdrop-blur-sm hover:bg-black/60"
                      aria-label="Alternar modo de ajuste"
                    >{fitMode==='contain'? 'Ajustar (cover)':'Enquadrar (contain)'}</button>
                    <button
                      type="button"
                      onClick={()=> setLightbox(true)}
                      className="absolute bottom-2 right-2 text-[11px] font-medium bg-black/50 text-white px-2 py-0.5 rounded-md backdrop-blur-sm hover:bg-black/60"
                      aria-label="Abrir em tela cheia"
                    >Zoom</button>
                  </>
                )}
              </div>
              {mediaUrls.length>1 && (
                <div
                  className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
                  role="listbox"
                  aria-label="Miniaturas do filhote"
                  onKeyDown={(e)=> onThumbListKey(e,false)}
                >
                  {mediaUrls.map((u,i)=> (
                    <button
                      key={u}
                      ref={el=> { thumbRefs.current[i]=el; }}
                      onClick={()=> { setIndex(i); setThumbFocus(i); }}
                      aria-label={`Ver imagem ${i+1}`}
                      role="option"
                      aria-selected={i===index}
                      aria-current={i===index? 'true': undefined}
                      tabIndex={i===thumbFocus? 0 : -1}
                      className={`relative rounded-md overflow-hidden flex-shrink-0 border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${i===index? 'ring-2 ring-[var(--accent)] border-[var(--accent)]':'border-transparent opacity-70 hover:opacity-100'}`}
                      style={{ width:72, height:72 }}
                    >
                      <Image src={u} alt={`Miniatura ${i+1} de ${mediaUrls.length}`} fill sizes="72px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-zinc-600">
            {formattedDate && <span className="inline-flex items-center gap-1"><span className="font-medium text-zinc-800">Nascimento:</span> {formattedDate}</span>}
            <span className="inline-flex items-center gap-1"><span className="font-medium text-zinc-800">Preço:</span> <span className="text-emerald-700 font-semibold">{formattedPrice}</span></span>
            {puppy.gender && <span className="inline-flex items-center gap-1 capitalize"><span className="font-medium text-zinc-800">Sexo:</span> {puppy.gender}</span>}
            {puppy.color && <span className="inline-flex items-center gap-1"><span className="font-medium text-zinc-800">Cor:</span> {puppy.color}</span>}
            {puppy.codigo && <span className="inline-flex items-center gap-1"><span className="font-medium text-zinc-800">Código:</span> {puppy.codigo}</span>}
            {puppy.status && (
              <span id={statusLiveId} className="inline-flex items-center gap-1" aria-live="polite">
                <span className="font-medium text-zinc-800">Status:</span> {statusLabel(puppy.status)}
              </span>
            )}
          </div>
          {puppy.description && <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-line break-words text-zinc-700">{puppy.description}</p>}
          {puppy.notes && (
            <div className="rounded-md bg-zinc-50 border border-zinc-200 p-4 text-xs sm:text-sm text-zinc-700">
              <p className="font-medium text-zinc-600 mb-1">Descrição do Filhote</p>
              <p className="whitespace-pre-line break-words">{puppy.notes}</p>
            </div>
          )}
          {Array.isArray(puppy.midia) && puppy.midia.length>1 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {puppy.midia.slice(1,13).map((m:any,i:number)=>{
                const url = m?.url || m; if(!url) return null;
                return (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                    <Image
                      src={url}
                      alt={`Imagem ${i+2} de ${name}`}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 180px"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:justify-end pt-1">
            <button
              onClick={()=>{
                const phone = process.env.NEXT_PUBLIC_WA_PHONE;
                const msg = `Olá! Quero saber mais sobre o filhote ${name}.`;
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                track.event?.('whatsapp_click_modal',{ puppy:name, id });
                window.open(url,'_blank');
              }}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600 transition w-full sm:w-auto"
              aria-label="Conversar via WhatsApp sobre o filhote"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
            </button>
            <button
              onClick={shareLink}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 transition w-full sm:w-auto"
            >
              {copied? (<><LinkIcon className="mr-2 h-4 w-4" /> Link copiado!</>) : (<><Share2 className="mr-2 h-4 w-4" /> Compartilhar</>)}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition w-full sm:w-auto"
            >Fechar</button>
          </div>
        </div>
      )}
  </Modal>
  {lightbox ? (
      <div
        ref={lbWrapperRef}
        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Imagem ampliada ${index+1} de ${mediaUrls.length}`}
        onClick={()=> setLightbox(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex items-center justify-between p-3 text-white text-xs gap-3 select-none">
          <div className="flex items-center gap-3">
            <span className="font-medium">{name}</span>
            <span className="opacity-70">{index+1}/{mediaUrls.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e)=>{ e.stopPropagation(); goPrev(); }} disabled={!canPrev} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30">‹</button>
            <button onClick={(e)=>{ e.stopPropagation(); goNext(); }} disabled={!canNext} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30">›</button>
            <button onClick={(e)=>{ e.stopPropagation(); setFitMode(f=> f==='contain'?'cover':'contain'); }} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">{fitMode==='contain'? 'Cover':'Contain'}</button>
            <button onClick={(e)=>{ e.stopPropagation(); setZoom(1); setPan({x:0,y:0}); panRef.current={x:0,y:0}; }} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Reset</button>
            <button onClick={(e)=>{ e.stopPropagation(); setLightbox(false); }} className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 font-medium">Fechar</button>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden" onClick={(e)=> e.stopPropagation()}>
          {mediaUrls[index] && (
            <Image
              src={mediaUrls[index]}
              alt={`Imagem ampliada ${index+1} de ${mediaUrls.length}`}
              fill
              sizes="100vw"
              className={`${fitMode==='contain'? 'object-contain':'object-cover'} select-none`}
              style={{ transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transition:'transform 0.05s linear' }}
              draggable={false}
            />
          )}
        </div>
  {mediaUrls.length>1 && (
          <div
            className="w-full overflow-x-auto flex gap-2 p-3 bg-black/60 backdrop-blur-sm"
            role="listbox"
            aria-label="Miniaturas em tela cheia"
            onKeyDown={(e)=> onThumbListKey(e,true)}
          >
            {mediaUrls.map((u,i)=> (
              <button
                key={u}
                ref={el=> { lightboxThumbRefs.current[i]=el; }}
                onClick={(e)=> { e.stopPropagation(); setIndex(i); setThumbFocus(i); }}
                role="option"
                aria-selected={i===index}
    aria-current={i===index? 'true': undefined}
                tabIndex={i===thumbFocus? 0 : -1}
                className={`relative flex-shrink-0 rounded-md overflow-hidden border focus:outline-none focus:ring-2 focus:ring-emerald-400 ${i===index? 'ring-2 ring-white border-white':'border-transparent opacity-60 hover:opacity-100'}`}
                style={{ width:60, height:60 }}
              >
    <Image src={u} alt={`Miniatura ${i+1} de ${mediaUrls.length}`} fill sizes="60px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    ) : null}
    {/* Região viva para leitores de tela anunciar mudança de imagem */}
    <span aria-live="polite" className="sr-only">Imagem {index+1} de {mediaUrls.length}</span>
  </>);
}
