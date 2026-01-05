// app/(admin)/admin/_components/AdminNav.tsx

'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import clsx from 'clsx';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavEntry = {
  href?: Route;
  label: string;
  children?: { href: Route; label: string }[];
  badge?: string;
};

const NAV: NavEntry[] = [
  { href: '/admin/dashboard' as Route, label: 'Dashboard' },
  // Filhotes deve ficar em destaque e com rotas claras: Listar, Novo, Editar, Mídias
  {
    label: 'Filhotes / Estoque',
    children: [
      { href: '/admin/filhotes' as Route, label: 'Listar' },
      { href: '/admin/filhotes/novo' as Route, label: 'Novo' },
      // Editar é contextual — apontamos para a listagem onde se escolhe um item para editar
      { href: '/admin/filhotes' as Route, label: 'Editar (selecione item)' },
      { href: '/admin/filhotes/media' as Route, label: 'Mídias' },
    ],
    badge: 'estoque',
  },
  { href: '/admin/blog' as Route, label: 'Gerenciar Blog' },
  { href: '/admin/blog/analytics' as Route, label: 'Blog Analytics' },
  { href: '/admin/config' as Route, label: 'Config' },
];

export default function AdminNav() {
  const [pathname, setPathname] = useState<string | undefined>(typeof window !== 'undefined' ? window.location.pathname : undefined);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPop = () => setPathname(window.location.pathname);
    setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const ctrl: AbortController | null = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const t: ReturnType<typeof setTimeout> | null = ctrl ? setTimeout(() => ctrl.abort(), 1500) : null;
      await fetch('/api/admin/logout', {
        method: 'GET',
        cache: 'no-store',
        keepalive: true,
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (t) clearTimeout(t);
    } catch (e) { /* ignored */ }
    // navega direto para o login e força revalidação do layout
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <>
      {/* Container centralizado e responsivo */}
      <div className="w-full border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="flex flex-wrap items-center justify-center gap-2 py-2 overflow-x-auto" aria-label="Navegação administrativa">
          {NAV.map((n) => {
            if (n.children && n.children.length > 0) {
              const open = pathname?.startsWith(n.children[0].href) || pathname?.startsWith('/admin/filhotes');
              const submenuId = `submenu-${n.label.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <details key={n.label} className="relative" open={!!open}>
                  <summary
                    className={clsx(
                      'list-none rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer',
                      // destacar o grupo Filhotes com visual mais forte
                      n.label.includes('Filhotes')
                        ? (open ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200')
                        : (open ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-zinc-700 hover:bg-zinc-100')
                    )}
                    aria-haspopup="true"
                    aria-expanded={open}
                    role="button"
                    aria-controls={submenuId}
                    tabIndex={0}
                    aria-label={n.label}
                  >
                    {n.label}
                  </summary>
                  <div id={submenuId} className="mt-2 flex flex-col gap-1 rounded-md p-2" role="menu">
                    {n.children.map((c) => {
                      const active = pathname?.startsWith(c.href);
                      return (
                        <Link
                          key={c.href}
                          href={c.href}
                          role="menuitem"
                          className={clsx(
                            'rounded-md px-3 py-2 text-sm transition text-left',
                            active ? 'bg-emerald-100 text-emerald-800' : 'text-zinc-700 hover:bg-zinc-100'
                          )}
                          aria-label={c.label}
                        >
                          {c.label}
                        </Link>
                      );
                    })}
                    <div className="mt-2 flex gap-2 items-center">
                      <Link
                        href="/admin/filhotes/novo"
                        role="menuitem"
                        aria-label="Criar novo filhote"
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm"
                      >
                        Novo
                      </Link>
                      <Link href="/admin/filhotes/import" role="menuitem" className="rounded-full border px-3 py-1 text-xs font-semibold">
                        Importar
                      </Link>
                      <span className="ml-2 inline-block rounded px-2 py-0.5 text-xs font-medium text-zinc-600">Estoque</span>
                    </div>
                  </div>
                </details>
              );
            }
            const href = n.href as Route | undefined;
            const active = href ? pathname?.startsWith(href) : false;
            return (
              <Link
                key={n.label}
                href={href ?? '/'}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-zinc-700 hover:bg-zinc-100'
                )}
              >
                {n.label}
              </Link>
            );
          })}

          {/* sair com confirmação */}
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button
                  type="button"
                  className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
                >
                  Sair
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
                <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl focus:outline-none">
                  <AlertDialog.Title className="text-lg font-semibold text-zinc-900">
                    Confirmar saída
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm text-zinc-600">
                    Tem certeza que deseja sair do painel administrativo? Você precisará fazer login novamente para acessar.
                  </AlertDialog.Description>
                  <div className="mt-6 flex gap-3 justify-end">
                    <AlertDialog.Cancel asChild>
                      <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                      >
                        Cancelar
                      </button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-70"
                      >
                        {isLoggingOut ? 'Saindo...' : 'Sim, sair'}
                      </button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </nav>
        </div>
      </div>

      {isLoggingOut && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/80 backdrop-blur-sm" aria-live="polite" aria-busy>
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-200/60"></div>
              <Image src="/spitz-hero-mobile.png" alt="" className="relative rounded-full object-cover ring-2 ring-emerald-500/30" width={96} height={96} />
            </div>
            <div className="flex items-center gap-2 text-2xl" aria-hidden>
              <span className="paw">{"\uD83D\uDC3E"}</span>
              <span className="paw">{"\uD83D\uDC3E"}</span>
              <span className="paw">{"\uD83D\uDC3E"}</span>
            </div>
          </div>
          <style jsx>{`
            @keyframes paw-walk {
              0% { opacity: 0.2; transform: translateY(6px) scale(0.9) rotate(-10deg); }
              50% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
              100% { opacity: 0.2; transform: translateY(-6px) scale(0.9) rotate(10deg); }
            }
            .paw { animation: paw-walk 900ms infinite ease-in-out; }
            .paw:nth-child(2) { animation-delay: 150ms; }
            .paw:nth-child(3) { animation-delay: 300ms; }
          `}</style>
        </div>
      )}
    </>
  );
}
