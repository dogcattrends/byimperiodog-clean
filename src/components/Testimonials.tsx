"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { useReducedMotion } from 'framer-motion';
import CLIENT_PHOTOS from './clientPhotos';
import { cn } from '@/lib/cn';

type TestimonialsProps = {
  title?: string;
  photos?: string[];
  autoplayDelay?: number;
  fit?: 'cover' | 'contain';
  bgPattern?: boolean; // mantém padrão opcional atrás da imagem
  cities?: string[];
  jsonLd?: boolean;
  debug?: boolean;
};

const BLUR = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export default function Testimonials({
  title = 'Clientes',
  photos,
  autoplayDelay = 3500,
  fit = 'contain',
  bgPattern = false,
  cities,
  jsonLd = false,
  debug = false
}: TestimonialsProps) {
  const reduceMotion = useReducedMotion();
  const list = photos?.length ? photos : CLIENT_PHOTOS.slice();
  const total = list.length;
  const [index, setIndex] = useState(0);
  const current = useMemo(() => list[index % total], [index, list, total]);

  const DEFAULT_CITY_POOL = [
    'Bragança Paulista','Atibaia','Itatiba','Valinhos','Vinhedo','Campinas','Indaiatuba','Jundiaí','Louveira','Barueri - Alphaville','Santana de Parnaíba','São Paulo - Jardins','São Paulo - Vila Olímpia','São Paulo - Morumbi','Holambra','Jaguariúna','Joanópolis','Socorro','Morungaba','Extrema (MG)'
  ];
  const CITY_POOL = cities?.length ? cities : DEFAULT_CITY_POOL;
  const altFor = (p: string, i: number) => {
    const base = p.split('/').pop() || '';
    if (/^cliente/i.test(base)) return `Cliente By Império Dog em ${CITY_POOL[i % CITY_POOL.length]}`;
    return `Spitz Alemão - Cliente By Império Dog em ${CITY_POOL[i % CITY_POOL.length]}`;
  };

  // autoplay simples
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIndex(i => i + 1), autoplayDelay);
    return () => clearInterval(id);
  }, [autoplayDelay, reduceMotion]);

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

  const city = CITY_POOL[index % CITY_POOL.length];

  return (
    <section aria-label={title} className="relative py-14">
      {reviewsLd ? <Script id="ld-reviews" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsLd) }} /> : null}
      <div className="px-4 sm:px-6 mx-auto max-w-5xl">
        <div className="relative rounded-3xl border border-emerald-500/25 dark:border-emerald-400/25 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-600/5 dark:from-emerald-400/10 dark:via-transparent dark:to-emerald-500/10 backdrop-blur-sm shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_4px_18px_-4px_rgba(16,185,129,0.35)] p-6 sm:p-8">
          <div className="absolute inset-0 rounded-3xl pointer-events-none [mask:linear-gradient(to_bottom,black,transparent_88%)]" />
          <div className="mb-8 text-center relative">
            <h2 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 dark:from-emerald-300 dark:via-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent drop-shadow-sm">{title}</h2>
            <p className="sr-only" id="carousel-instructions">Carrossel automático. Um card por vez. Controles removidos.</p>
          </div>
          <div className="relative flex flex-col items-center" role="region" aria-roledescription="carrossel" aria-describedby="carousel-instructions">
          <div className="relative w-full flex justify-center">
            <div className={cn(
              'relative rounded-3xl overflow-hidden transition-all duration-500 w-[90vw] max-w-[480px] aspect-[4/3] flex items-center justify-center',
              bgPattern ? '[background:repeating-linear-gradient(45deg,rgba(16,185,129,0.10)_0_6px,transparent_6px_12px)]' : 'bg-transparent'
            )}>
              {current && (
                <Image
                  key={current}
                  src={current}
                  alt={altFor(current, index)}
                  fill
                  className={cn('transition-opacity duration-500 will-change-transform', fit === 'contain' ? 'object-contain p-1' : 'object-cover')}
                  placeholder="blur"
                  blurDataURL={BLUR}
                  sizes="(max-width: 640px) 90vw, 480px"
                  unoptimized
                />
              )}
              <span className="absolute top-2 left-2 rounded-full bg-white/90 dark:bg-zinc-800/90 px-2 py-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 ring-1 ring-zinc-300/60 dark:ring-zinc-600/50 shadow backdrop-blur-sm">
                {city}
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
