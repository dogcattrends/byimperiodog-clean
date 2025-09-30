"use client";
import * as React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';

export function Header(){
  const pathname = usePathname();
  const [query,setQuery] = React.useState('');
  const [menuOpen,setMenuOpen] = React.useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onSubmit(e:React.FormEvent){ e.preventDefault(); /* TODO hook search */ }
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/80" role="banner">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="hidden sm:block min-w-0">
          <Breadcrumbs path={pathname} />
        </div>
        <form onSubmit={onSubmit} role="search" className="relative hidden md:block w-72 max-w-xs">
          <label htmlFor="dash-search" className="sr-only">Buscar</label>
          <input id="dash-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar..." className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
          <MagnifyingGlassIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        </form>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={()=> setMenuOpen(o=>!o)} aria-haspopup="menu" aria-expanded={menuOpen} className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-semibold text-[var(--accent-contrast)]">BI</span>
          <span className="hidden md:inline">Você</span>
          <ChevronDownIcon className="h-4 w-4 text-[var(--text-muted)] transition group-data-[state=open]:rotate-180" />
        </button>
        {menuOpen && (
          <motion.ul initial={{opacity:0, y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:4}} transition={{duration:prefersReducedMotion?0:.18}} onMouseLeave={()=> setMenuOpen(false)} role="menu" aria-label="Menu do usuário" className="absolute right-4 top-14 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
            <li><button role="menuitem" className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)]">Perfil</button></li>
            <li><button role="menuitem" className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)]">Preferências</button></li>
            <li><button role="menuitem" className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">Sair</button></li>
          </motion.ul>
        )}
      </div>
    </header>
  );
}
