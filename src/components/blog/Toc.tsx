"use client";
import clsx from 'classnames';
import React, { useEffect, useState } from 'react';

import type { TocItem } from '@/lib/blog/mdx/toc';

interface TOCProps { toc: TocItem[]; className?: string; minDepth?: number; maxDepth?: number }

function flatten(items: TocItem[]): TocItem[] { return items.flatMap(i => [i, ...flatten(i.children)]); }

export default function TOC({ toc, className, minDepth = 2, maxDepth = 4 }: TOCProps){
  const flat = flatten(toc).filter(i => i.depth >= minDepth && i.depth <= maxDepth);
  const [active, setActive] = useState<string|null>(null);

  useEffect(()=>{
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '0px 0px -60% 0px', threshold: [0,1] });
    flat.forEach(i => {
      const el = document.getElementById(i.id);
      if(el) obs.observe(el);
    });
    return ()=> obs.disconnect();
  },[flat]);

  if(!flat.length) return null;
  return (
    <nav aria-label="Índice" className={clsx('sticky top-28 hidden xl:block w-60 text-sm max-h-[80vh] overflow-auto pr-2', className)}>
      <div className="mb-2 font-semibold tracking-wide text-text-muted">No artigo</div>
      <ul className="space-y-1 border-l border-border pl-3">
        {flat.map(i => (
          <li key={i.id} className={clsx('transition-colors', active===i.id ? 'text-brand font-semibold' : 'text-text-soft hover:text-text')}>
            <a
              href={`#${i.id}`}
              aria-current={active===i.id ? 'true' : undefined}
              className={clsx('block line-clamp-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand', i.depth === 3 && 'ml-3 text-[13px]')}
              onClick={(e)=>{
              e.preventDefault();
              const el = document.getElementById(i.id);
              if(el) {
                history.replaceState(null, '', `#${i.id}`);
                window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
                // Move o foco para o heading (acessibilidade: leitores de tela/teclado)
                if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
                window.setTimeout(() => {
                  const node = el as HTMLElement;
                  if (typeof node.focus === 'function') {
                    node.focus({ preventScroll: true });
                  }
                }, 200);
              }
            }}
            >
              {i.value}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
