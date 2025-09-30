"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, MessageCircle } from "lucide-react";
import classNames from "classnames";
import { routes, AppRoutes } from "@/lib/route";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

const navLinks: { label: string; href: AppRoutes }[] = [
  { label: "Início", href: routes.home },
  { label: "Filhotes", href: routes.filhotes },
  { label: "Sobre", href: routes.sobre },
  { label: "Blog", href: routes.blog },
  { label: "Contato", href: routes.contato },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || '/';

  // slug ancorado (parâmetro h) apenas para casos antigos; lido uma vez
  const [hash, setHash] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHash(new URL(window.location.href).searchParams.get('h'));
  }, [pathname]);

  const toggle = () => setOpen((p) => !p);
  const close = () => setOpen(false);

  const isActive = (href: string, current: string, h: string | null) => {
    if (href === '/') return current === '/';
    // Detalhe de filhote (/filhote/[id]) deve marcar Filhotes
    if (href === '/filhotes' && current.startsWith('/filhote/')) return true;
    // Blog post individual
    if (href === '/blog' && current.startsWith('/blog/')) return true;
    // Política de privacidade (fora do menu) ignorar
    return current === href || current.startsWith(href + '/') || h === href.replace('/', '');
  };

  // prevent body scroll only when sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const firstLinkRef = useRef<HTMLAnchorElement|null>(null);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(()=>{
    if(open){
      // foco inicial
      setTimeout(()=> firstLinkRef.current?.focus(), 10);
    }
  },[open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-zinc-200 bg-white/85 text-zinc-800 backdrop-blur-md" role="banner">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Navegação principal">
        <Link
          href={routes.home}
          className="flex min-w-0 max-w-[65%] items-center gap-2 text-base font-bold tracking-tight text-inherit transition-transform duration-200 hover:rotate-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded sm:max-w-none"
          aria-label="By Imperio Dog — Página inicial"
        >
          <Image src="/byimperiologo.svg" alt="Logotipo By Imperio Dog" width={28} height={28} className="h-7 w-7" />
          <span className="truncate">By Imperio Dog</span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex" role="menubar">
          {navLinks.map((l) => {
            const active = isActive(l.href, pathname, hash);
            const cls = classNames(
              'relative py-1 text-[15px] tracking-wide transition-all duration-200 ease-in-out hover:-translate-y-0.5',
              active
                ? 'font-semibold after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-brand underline-offset-4'
                : 'text-inherit hover:underline decoration-brand underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded'
            );
            return (
              <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={cls} role="menuitem">
                <span className="whitespace-nowrap">{l.label}</span>
              </Link>
            );
          })}

          {(() => {
            const waPhone = process.env.NEXT_PUBLIC_WA_PHONE || (process.env.NEXT_PUBLIC_WA_LINK ? process.env.NEXT_PUBLIC_WA_LINK.replace(/\D/g,'') : '');
            const waHref = waPhone ? `https://wa.me/${waPhone}` : (process.env.NEXT_PUBLIC_WA_LINK || 'https://wa.me/');
            return (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:transform-none"
            title="Atendimento humano com carinho"
          >
            <MessageCircle className="h-4 w-4 animate-pulse" />
            WhatsApp
          </a> ); })()}
        </div>

        <div className="lg:hidden">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-transform duration-200 hover:scale-105 motion-reduce:transform-none"
                aria-label={open ? "Fechar menu" : "Abrir menu"}
                aria-expanded={open}
                aria-controls="menu-mobile"
              >
                {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
              </button>
            </Dialog.Trigger>
            <AnimatePresence>
              {open && (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild>
                    <motion.div
                      className="fixed inset-0 z-[60] bg-black/50 data-[theme=dark]:bg-black/60"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: prefersReducedMotion? 0 : 0.18 }}
                    />
                  </Dialog.Overlay>
                  <Dialog.Content asChild onEscapeKeyDown={close}>
                    <motion.aside
                      className="fixed inset-y-0 right-0 z-[61] w-full max-w-[88%] bg-[var(--surface)] text-[var(--text)] shadow-2xl outline-none data-[theme=dark]:bg-[var(--surface)] focus:outline-none"
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'tween', duration: prefersReducedMotion? 0 : 0.22 }}
                      role="dialog"
                      aria-label="Menu"
                      id="menu-mobile"
                    >
                      <div className="flex items-center justify-between px-4 py-4">
                        <span className="text-sm font-medium">Menu</span>
                        <Dialog.Close asChild>
                          <button
                            className="rounded p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                            aria-label="Fechar menu"
                          >
                            <X className="h-6 w-6" aria-hidden />
                          </button>
                        </Dialog.Close>
                      </div>
                      <nav className="px-2 pb-6" aria-label="Menu mobile">
                        <ul className="flex flex-col gap-1" role="menu">
                          {navLinks.map((l) => {
                            const active = isActive(l.href, pathname, hash);
                            const cls = classNames(
                              'relative rounded-md px-4 py-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                              active
                                ? 'font-semibold bg-[var(--surface-2)]'
                                : 'hover:bg-[var(--surface-2)]'
                            );
                            return (
                              <li key={l.href}>
                                <Link
                                  href={l.href}
                                  onClick={close}
                                  aria-current={active ? 'page' : undefined}
                                  className={cls}
                                  role="menuitem"
                                  ref={firstLinkRef}
                                >
                                  {l.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="px-4 pt-4">
                          {(() => {
                            const waPhone = process.env.NEXT_PUBLIC_WA_PHONE || (process.env.NEXT_PUBLIC_WA_LINK ? process.env.NEXT_PUBLIC_WA_LINK.replace(/\D/g,'') : '');
                            const waHref = waPhone ? `https://wa.me/${waPhone}` : (process.env.NEXT_PUBLIC_WA_LINK || 'https://wa.me/');
                            return (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={close}
                                className="mt-2 inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:transform-none"
                                title="Atendimento humano com carinho"
                                aria-label="Abrir conversa no WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" aria-hidden />
                                WhatsApp
                              </a>
                            );
                          })()}
                        </div>
                      </nav>
                    </motion.aside>
                  </Dialog.Content>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
        </div>
      </nav>
      <div className="sr-only" aria-live="polite">{open? 'Menu aberto':'Menu fechado'}</div>
    </header>
  );
}




