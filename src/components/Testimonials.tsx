"use client";

import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Script from 'next/script';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import CLIENT_PHOTOS from './clientPhotos';

type Variant = 'carousel' | 'grid';

interface TestimonialsProps {
  title?: string;
  photos?: string[];
  autoplayDelay?: number;
  fit?: 'cover' | 'contain';
  bgPattern?: boolean;
  cities?: string[];
  jsonLd?: boolean;
  debug?: boolean;
  variant?: Variant;
  showCount?: number; // usado no grid
}

const BLUR = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const DEFAULT_CITY_POOL = [
  'Bragança Paulista','Atibaia','Itatiba','Valinhos','Vinhedo','Campinas','Indaiatuba','Jundiaí','Louveira','Barueri - Alphaville','Santana de Parnaíba','São Paulo - Jardins','São Paulo - Vila Olímpia','São Paulo - Morumbi','Holambra','Jaguariúna','Joanópolis','Socorro','Morungaba','Extrema (MG)'
];

export default function Testimonials({
  title = 'Clientes',
  photos,
  autoplayDelay = 3500,
  fit = 'contain',
  bgPattern = false,
  cities,
  jsonLd = false,
  debug = false,
  variant = 'carousel',
  showCount = 6
}: TestimonialsProps) {
  const reduceMotion = useReducedMotion();
  const list = photos?.length ? photos : CLIENT_PHOTOS.slice();
  const CITY_POOL = cities?.length ? cities : DEFAULT_CITY_POOL;
  const total = list.length;
  const [index, setIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const current = useMemo(() => list[index % total], [index, list, total]);
  const city = CITY_POOL[index % CITY_POOL.length];

  const altFor = useCallback((p: string, i: number) => {
    const base = p.split('/').pop() || '';
    const c = CITY_POOL[i % CITY_POOL.length];
    if (/^cliente/i.test(base)) return `Cliente By Império Dog em ${c}`;
    return `Spitz Alemão - Cliente By Império Dog em ${c}`;
  }, [CITY_POOL]);

  // autoplay avançado com pausa em hover/focus
  useEffect(() => {
    if (variant !== 'carousel') return;
    if (reduceMotion || isPaused || total < 2) return;
    timerRef.current && clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIndex(i => (i + 1) % total), autoplayDelay);
    return () => { timerRef.current && clearTimeout(timerRef.current); };
  }, [autoplayDelay, reduceMotion, isPaused, total, index, variant]);

  const goTo = useCallback((i: number) => setIndex(((i % total) + total) % total), [total]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // JSON-LD simples (mesmo placeholder anterior)
  const reviewsLd = jsonLd ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'By Império Dog',
    review: list.slice(0, 12).map(() => ({
      '@type': 'Review',
      reviewBody: 'Cliente verificado',
      author: { '@type': 'Person', name: 'Cliente verificado' }
    }))
  } : null;
  // Prefetch próxima imagem para transição suave (sempre declara hook antes de early return)
  useEffect(() => {
    if (!total || variant !== 'carousel') return;
    const nextIdx = (index + 1) % total;
    const nextSrc = list[nextIdx];
    if (!nextSrc) return;
    const img = new window.Image();
    img.src = nextSrc;
  }, [index, list, total, variant]);

  if (!total) return null;

  return (
    <section aria-label={title} className="relative py-16">
      {reviewsLd ? <Script id="ld-reviews" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsLd) }} /> : null}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">{title}</h2>
            {variant === 'carousel' && <p className="mt-1 text-sm text-[var(--text-muted)]">Histórias reais de famílias e seus Spitz.</p>}
          </div>
          {variant === 'carousel' && total > 1 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={prev} aria-label="Anterior" className="btn-outline px-2 py-1 text-xs">←</button>
              <button type="button" onClick={next} aria-label="Próximo" className="btn-outline px-2 py-1 text-xs">→</button>
            </div>
          )}
        </header>

        {variant === 'grid' && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {list.slice(0, showCount).map((p, i) => (
              <li key={p} className={cn('relative aspect-square overflow-hidden rounded-xl ring-1 ring-[var(--border)] bg-[var(--surface)]')}> 
                <Image
                  src={p}
                  alt={altFor(p, i)}
                  fill
                  className={cn('object-cover', fit === 'contain' && 'object-contain p-1')}
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 15vw"
                  placeholder="blur"
                  blurDataURL={BLUR}
                  unoptimized
                />
              </li>
            ))}
          </ul>
        )}

        {variant === 'carousel' && (
          <div
            className="group relative"
            role="group"
            aria-roledescription="carrossel"
            aria-label="Depoimentos de clientes"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={(e) => {
              if (e.touches.length !== 1) return;
              touchStartX.current = e.touches[0].clientX;
              touchDeltaX.current = 0;
              setPaused(true);
            }}
            onTouchMove={(e) => {
              if (touchStartX.current == null) return;
              touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
            }}
            onTouchEnd={() => {
              if (touchStartX.current == null) return;
              const delta = touchDeltaX.current;
              const threshold = 40; // px
              if (Math.abs(delta) > threshold) {
                if (delta < 0) next(); else prev();
              }
              touchStartX.current = null;
              touchDeltaX.current = 0;
              setPaused(false);
            }}
          >
            <div className={cn(
              'relative mx-auto w-full max-w-[640px] aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-[var(--border)] bg-[var(--surface)] flex items-center justify-center shadow-sm',
              bgPattern && '[background:repeating-linear-gradient(45deg,rgba(16,185,129,0.07)_0_6px,transparent_6px_12px)]'
            )}>
              <AnimatePresence mode="wait" initial={false}>
                {current && (
                  <motion.figure
                    key={current}
                    className="relative w-full h-full"
                    initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    <Image
                      src={current}
                      alt={altFor(current, index)}
                      fill
                      className={cn('will-change-transform', fit === 'contain' ? 'object-contain p-2' : 'object-cover')}
                      sizes="(max-width: 768px) 90vw, 640px"
                      placeholder="blur"
                      blurDataURL={BLUR}
                      unoptimized
                    />
                    <figcaption className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/55 text-white text-[11px] px-2 py-1 backdrop-blur-sm shadow-sm">
                      {city}
                    </figcaption>
                  </motion.figure>
                )}
              </AnimatePresence>
              {total > 1 && (
                <>
                  <button type="button" aria-label="Anterior" onClick={prev} className="focus-visible:focus-ring absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 text-white px-2 py-1 text-sm backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100">
                    ←
                  </button>
                  <button type="button" aria-label="Próximo" onClick={next} className="focus-visible:focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 text-white px-2 py-1 text-sm backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100">
                    →
                  </button>
                </>
              )}
            </div>
            {total > 1 && (
              <div className="mt-4 flex justify-center gap-2" aria-label="Seleção de foto">
                {list.map((p, i) => {
                  const active = i === (index % total);
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-label={`Mostrar foto ${i + 1}`}
                      aria-pressed={active}
                      onClick={() => goTo(i)}
                      className={cn('h-2.5 rounded-full transition-colors', active ? 'w-6 bg-emerald-500' : 'w-2.5 bg-[var(--border)] hover:bg-emerald-400/70')}
                    />
                  );
                })}
              </div>
            )}
            {debug && (
              <pre className="mt-4 text-xs text-[var(--text-muted)]">index: {index} paused: {String(isPaused)}</pre>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
