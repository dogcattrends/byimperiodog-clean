"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Copy, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import { useToast } from "@/components/ui/toast";
import track from "@/lib/track";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "@/lib/whatsapp";

const NAV_LINKS = [
  { label: "Início", href: "/" },
  { label: "Filhotes", href: "/filhotes" },
  { label: "Processo", href: "/sobre" },
  { label: "FAQ", href: "/faq-do-tutor" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
] as const;

type HeaderClientProps = {
  phone: string;
  phoneLink?: string;
  whatsappLink?: string;
};

type CTAInteractionLocation = "header" | "drawer" | "mobile";

const formatPhoneDisplay = (value?: string) => {
  if (!value) return "";
  const digits = value.replace(/\D+/g, "");
  const target = digits.startsWith("55") ? digits.slice(2) : digits;
  const match = target.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (!match) return value;
  const [, area, part1, part2] = match;
  return `(${area}) ${part1}-${part2}`;
};

const formatPhoneLink = (value?: string) => {
  if (!value) return undefined;
  const digits = value.replace(/\D+/g, "");
  return digits ? `tel:${digits.startsWith("55") ? digits : `55${digits}`}` : undefined;
};

const emitCTA = (payload: { ctaId: string; location: CTAInteractionLocation; extra?: Record<string, unknown> }) => {
  track.event?.("cta_click", {
    cta_id: payload.ctaId,
    location: payload.location,
    ...payload.extra,
  });
};

export default function HeaderClient({ phone, phoneLink, whatsappLink }: HeaderClientProps) {
  const [open, setOpen] = useState(false);
  const firstDrawerLinkRef = useRef<HTMLAnchorElement | null>(null);
  const { push } = useToast();

  const formattedPhone = formatPhoneDisplay(phone);
  const callHref = phoneLink ?? formatPhoneLink(phone);
  const resolvedWhatsAppLink = useMemo(() => {
    if (whatsappLink) return whatsappLink;
    return buildWhatsAppLink({
      message: WHATSAPP_MESSAGES.default,
      utmSource: "site",
      utmMedium: "header",
      utmCampaign: "catalogo",
      utmContent: "navbar",
    });
  }, [whatsappLink]);

  const handleCopy = useCallback(
    async (location: CTAInteractionLocation = "header") => {
      if (!phone) return;
      try {
        await navigator.clipboard.writeText(phone);
        push({ message: "Número copiado ✅", type: "success" });
        emitCTA({ ctaId: "navbar_copy", location });
      } catch (err) {
        push({ message: "Não foi possível copiar o telefone", type: "error" });
      }
    },
    [phone, push]
  );
  const handleDrawerClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) {
      firstDrawerLinkRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    try {
      document.querySelectorAll('[bis_skin_checked]').forEach((el) => el.removeAttribute("bis_skin_checked"));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white shadow-sm overflow-x-clip" role="banner">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full px-2 text-base font-semibold tracking-tight text-zinc-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label="By Império Dog — voltar para o início"
          >
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand whitespace-nowrap">By Império Dog</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-[44px] items-center rounded-full px-3 py-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <PrimaryCTA
              href={resolvedWhatsAppLink}
              icon={<WhatsAppIcon className="h-4 w-4 text-emerald-600" aria-hidden />}
              ariaLabel="Falar no WhatsApp"
              className="px-4 py-2 min-w-[160px] tracking-[0.2em]"
              tracking={{ ctaId: "navbar_whatsapp", location: "header", deviceMode: "desktop" }}
            >
              Falar no WhatsApp
            </PrimaryCTA>

            <PrimaryCTA
              href="/filhotes"
              variant="ghost"
              ariaLabel="Ver filhotes premium"
              className="inline-flex min-w-0 whitespace-nowrap rounded-full border border-emerald-200 px-4 py-2 font-semibold text-sm uppercase tracking-[0.2em]"
              tracking={{ ctaId: "navbar_view_puppies", location: "header", deviceMode: "desktop" }}
            >
              Ver filhotes
            </PrimaryCTA>

            <div className="flex items-center gap-2">
              {callHref && (
                <a
                  href={callHref}
                  aria-label={`Ligar para ${formattedPhone || phone}`}
                  onClick={() => {
                    push({ message: "Iniciando ligação...", type: "info" });
                    emitCTA({ ctaId: "navbar_call", location: "header" });
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-zinc-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  title="Ligar agora"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Ligar agora</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => handleCopy("header")}
                aria-label="Copiar telefone"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                title="Copiar número"
              >
                <Copy className="h-4 w-4" aria-hidden />
                <span className="sr-only">Copiar número</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
          <a
            href={resolvedWhatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Conversar com a equipe via WhatsApp"
            title="Conversar via WhatsApp"
            onClick={() =>
              emitCTA({ ctaId: "navbar_whatsapp", location: "mobile", extra: { deviceMode: "mobile" } })
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <WhatsAppIcon className="h-5 w-5" aria-hidden />
            <span className="sr-only">Conversar no WhatsApp</span>
          </a>

            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu"
                  aria-haspopup="dialog"
                  aria-controls="mobile-menu"
                  aria-expanded={open}
                  className="inline-flex h-11 w-11 mr-2 items-center justify-center rounded-full border border-emerald-200 bg-white text-zinc-800 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
                <Dialog.Content
                  id="mobile-menu"
                  aria-label="Menu de navegação"
                  className="fixed right-0 top-0 z-50 h-[100dvh] w-[min(88vw,360px)] max-w-full overflow-y-auto overflow-x-hidden border-l border-emerald-100 bg-white px-6 pb-6 pt-4 shadow-2xl focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-700">Menu</span>
                    <Dialog.Close
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      aria-label="Fechar menu"
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </Dialog.Close>
                  </div>
                  <nav className="mt-4 space-y-2" aria-label="Menu mobile">
                    {NAV_LINKS.map((link, index) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex min-h-[48px] items-center rounded-2xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                        onClick={handleDrawerClose}
                        ref={index === 0 ? firstDrawerLinkRef : undefined}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="mt-6 space-y-3">
                    <PrimaryCTA
                      href="/filhotes"
                      className="w-full whitespace-nowrap"
                      tracking={{ ctaId: "navbar_view_puppies", location: "drawer", deviceMode: "mobile" }}
                      ariaLabel="Ver filhotes premium"
                      onClick={handleDrawerClose}
                    >
                      Ver filhotes
                    </PrimaryCTA>
                    <PrimaryCTA
                      href={resolvedWhatsAppLink}
                      variant="ghost"
                      icon={<WhatsAppIcon className="h-4 w-4 text-emerald-600" aria-hidden />}
                      className="w-full"
                      tracking={{ ctaId: "navbar_whatsapp", location: "drawer", deviceMode: "mobile" }}
                      ariaLabel="Conversar com a equipe via WhatsApp"
                      onClick={handleDrawerClose}
                    >
                      WhatsApp
                    </PrimaryCTA>
                    {callHref && (
                      <a
                        href={callHref}
                        aria-label={`Ligar para ${formattedPhone || phone}`}
                        onClick={() => {
                          handleDrawerClose();
                          emitCTA({ ctaId: "navbar_call", location: "drawer" });
                        }}
                        className="flex min-h-[48px] items-center justify-center rounded-2xl border border-emerald-200 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      >
                        <Phone className="h-4 w-4" aria-hidden />
                        Ligar
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        handleDrawerClose();
                        handleCopy("drawer");
                      }}
                      aria-label="Copiar telefone"
                      className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                      Copiar
                    </button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </header>

      <div className="lg:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-100 bg-white shadow-lg">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3">
            <PrimaryCTA
              href={resolvedWhatsAppLink}
              className="flex-1 min-w-0 px-4 py-2 normal-case tracking-normal"
              tracking={{ ctaId: "navbar_whatsapp", location: "mobile", deviceMode: "mobile" }}
              ariaLabel="Falar no WhatsApp"
              icon={<WhatsAppIcon className="h-4 w-4 text-emerald-600" aria-hidden />}
            >
              <span className="hidden sm:inline">Falar no WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </PrimaryCTA>
            <PrimaryCTA
              href="/filhotes"
              variant="ghost"
              className="flex-1 min-w-0 px-4 py-2 normal-case tracking-normal md:hidden"
              tracking={{ ctaId: "navbar_view_puppies", location: "mobile", deviceMode: "mobile" }}
              ariaLabel="Ver filhotes premium"
            >
              Ver filhotes
            </PrimaryCTA>
          </div>
        </div>
      </div>
    </>
  );
}
