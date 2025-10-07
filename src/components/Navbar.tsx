"use client";

import * as Dialog from "@radix-ui/react-dialog";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { routes, type AppRoutes } from "@/lib/route";

const navLinks: { label: string; href: AppRoutes }[] = [
  { label: "Inicio", href: routes.home },
  { label: "Filhotes", href: routes.filhotes },
  { label: "Sobre", href: routes.sobre },
  { label: "Blog", href: routes.blog },
  { label: "Contato", href: routes.contato },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";

  const [hash, setHash] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setHash(new URL(window.location.href).searchParams.get("h"));
  }, [pathname]);

  const close = () => setOpen(false);

  const isActive = (href: string, current: string, h: string | null) => {
    if (href === "/") return current === "/";
    if (href === "/filhotes" && current.startsWith("/filhote/")) return true;
    if (href === "/blog" && current.startsWith("/blog/")) return true;
    return current === href || current.startsWith(`${href}/`) || h === href.replace("/", "");
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (open) setTimeout(() => firstLinkRef.current?.focus(), 10);
  }, [open]);

  return (
    <header
      data-site-shell="navbar"
      className="fixed inset-x-0 top-0 z-50 w-full border-b border-transparent bg-[var(--surface)]/90 text-[var(--text)] backdrop-blur-md shadow-[0_12px_30px_-20px_rgba(32,26,21,0.35)]"
      role="banner"
    >
      <nav
        className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Navegacao principal"
      >
        <Link
          href={routes.home}
          className="flex min-w-0 max-w-[70%] items-center gap-2 text-base font-semibold tracking-tight text-inherit transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30 rounded sm:max-w-none"
          aria-label="By Imperio Dog - Pagina inicial"
        >
          <Image src="/byimperiologo.svg" alt="Logotipo By Imperio Dog" width={32} height={32} className="h-8 w-8" />
          <div className="flex flex-col leading-tight">
            <span className="truncate">By Imperio Dog</span>
            <span className="hidden text-xs font-normal text-[var(--text-muted)] sm:block">Criação especializada em Spitz Alemão Anão Lulu da Pomerânia</span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex" role="menubar">
          {navLinks.map((link) => {
            const active = isActive(link.href, pathname, hash);
            const cls = classNames(
              "relative py-1 text-[15px] tracking-wide transition-all duration-200 ease-in-out hover:-translate-y-0.5",
              active
                ? "font-semibold text-[var(--brand)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[var(--accent)] underline-offset-4"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:underline decoration-[var(--accent)] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 rounded"
            );
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={cls} role="menuitem">
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            );
          })}

          {(() => {
            const trimmed = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
            const waHref = trimmed
              ? `https://wa.me/${trimmed}`
              : process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/";
            return (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                title="Atendimento humano com carinho"
                aria-label="Falar com equipe via WhatsApp"
              >
                <WAIcon size={16} className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
            );
          })()}
        </div>

        <div className="lg:hidden">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" aria-hidden />
              </button>
            </Dialog.Trigger>
            <AnimatePresence>
              {open && (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild>
                    <motion.div
                      className="fixed inset-0 z-[60] bg-black/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                    />
                  </Dialog.Overlay>
                  <Dialog.Content asChild onEscapeKeyDown={close}>
                    <motion.aside
                      className="fixed inset-y-0 right-0 z-[61] w-full max-w-[86%] bg-[var(--surface)] text-[var(--text)] shadow-2xl outline-none"
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "tween", duration: prefersReducedMotion ? 0 : 0.22 }}
                      role="dialog"
                      aria-label="Menu"
                      id="menu-mobile"
                    >
                      <div className="flex items-center justify-between px-4 py-4">
                        <span className="text-sm font-medium text-[var(--text-muted)]">Menu</span>
                        <Dialog.Close asChild>
                          <button
                            className="rounded p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                            aria-label="Fechar menu"
                          >
                            <X className="h-6 w-6" aria-hidden />
                          </button>
                        </Dialog.Close>
                      </div>
                      <nav className="px-2 pb-6" aria-label="Menu mobile">
                        <ul className="flex flex-col gap-1" role="menu">
                          {navLinks.map((link) => {
                            const active = isActive(link.href, pathname, hash);
                            const cls = classNames(
                              "relative rounded-md px-4 py-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40",
                              active ? "font-semibold bg-[var(--surface-2)] text-[var(--brand)]" : "hover:bg-[var(--surface-2)]"
                            );
                            return (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  onClick={close}
                                  aria-current={active ? "page" : undefined}
                                  className={cls}
                                  role="menuitem"
                                  ref={firstLinkRef}
                                >
                                  {link.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="px-4 pt-4">
                          {(() => {
                            const trimmed = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
                            const waHref = trimmed
                              ? `https://wa.me/${trimmed}`
                              : process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/";
                            return (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={close}
                                className="mt-2 inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] shadow-sm transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
                                title="Atendimento humano com carinho"
                                aria-label="Abrir conversa no WhatsApp"
                              >
                                <WAIcon size={16} className="h-4 w-4" aria-hidden />
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
      <div className="sr-only" aria-live="polite">{open ? "Menu aberto" : "Menu fechado"}</div>
    </header>
  );
}

