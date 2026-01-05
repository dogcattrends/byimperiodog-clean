"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import track from "@/lib/track";

const NAV_LINKS = [
  { label: "Início", href: "/" },
  { label: "Filhotes", href: "/filhotes" },
  { label: "Processo", href: "/sobre" },
  { label: "FAQ", href: "/faq-do-tutor" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
] as const;

const formatPhoneDisplay = (value?: string): string => {
  if (!value) return "";
  const digits = value.replace(/\D+/g, "");
  if (digits.length < 10) return value;
  const target = digits.startsWith("55") ? digits.slice(2) : digits;
  const match = target.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (!match) return value;
  const [, area, part1, part2] = match;
  return `(${area}) ${part1}-${part2}`;
};

type HeaderClientProps = {
  phone: string;
  phoneLink?: string;
  whatsappLink: string;
};

type CTAInteractionLocation = "header" | "drawer" | "mobile";

const trackCTA =
  (ctaId: string, location: CTAInteractionLocation, extra?: Record<string, unknown>) =>
  () => {
    track.event?.("cta_click", {
      cta_id: ctaId,
      location,
      ...extra,
    });
  };

export default function HeaderClient({ phone, phoneLink, whatsappLink }: HeaderClientProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const firstDrawerLinkRef = useRef<HTMLAnchorElement | null>(null);
  const formattedPhone = formatPhoneDisplay(phone);

  const handleCopy = useCallback(async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      //
    }
  }, [phone]);

  useEffect(() => {
    if (open) {
      firstDrawerLinkRef.current?.focus();
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white text-zinc-900 shadow-sm" role="banner">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-2 text-base font-semibold tracking-tight text-zinc-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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

        <div className="hidden items-center gap-4 lg:flex">
          <PrimaryCTA
            href="/filhotes"
            className="whitespace-nowrap px-6"
            tracking={{ ctaId: "navbar_view_puppies", location: "header" }}
            ariaLabel="Ver filhotes premium"
          >
            Ver filhotes
          </PrimaryCTA>

          <div className="flex items-center gap-3 whitespace-nowrap">
            {phoneLink ? (
              <a
                href={phoneLink}
                aria-label={`Ligar para ${formattedPhone || phone}`}
                className="text-sm font-semibold text-zinc-900 hover:text-brand focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                onClick={trackCTA("navbar_phone", "header")}
              >
                {formattedPhone || phone}
              </a>
            ) : (
              <span className="text-sm font-semibold text-zinc-900">{formattedPhone || phone}</span>
            )}

            {phone && (
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                aria-label="Copiar telefone"
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
            )}

            <PrimaryCTA
              href={whatsappLink}
              variant="ghost"
              icon={<WhatsAppIcon className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
              className="h-12 px-3 py-2 text-[0.75rem]"
              tracking={{ ctaId: "navbar_whatsapp", location: "header" }}
              ariaLabel="Conversar com a equipe via WhatsApp"
            >
              WhatsApp
            </PrimaryCTA>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <PrimaryCTA
            href={whatsappLink}
            variant="ghost"
            icon={<WhatsAppIcon className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
            className="px-4 py-2 text-[0.75rem]"
            tracking={{ ctaId: "navbar_whatsapp", location: "mobile" }}
            ariaLabel="Conversar com a equipe via WhatsApp"
          >
            WhatsApp
          </PrimaryCTA>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                aria-haspopup="dialog"
                aria-controls="mobile-menu"
                aria-expanded={open}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-zinc-800 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
              <Dialog.Content
                id="mobile-menu"
                aria-label="Menu de navegação"
                className="fixed inset-x-0 top-0 z-50 max-h-full overflow-y-auto rounded-b-3xl border-b border-emerald-100 bg-white px-6 pb-6 pt-4 shadow-2xl focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-700">Menu</span>
                  <Dialog.Close
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    aria-label="Fechar menu"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <nav className="mt-4 space-y-2" aria-label="Menu mobile">
                  {NAV_LINKS.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex min-h-[48px] items-center rounded-2xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      onClick={() => setOpen(false)}
                      ref={index === 0 ? firstDrawerLinkRef : undefined}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-6 space-y-3">
                  <PrimaryCTA
                    href="/filhotes"
                    className="w-full"
                    tracking={{ ctaId: "navbar_view_puppies", location: "drawer" }}
                    ariaLabel="Ver filhotes premium"
                    onClick={() => setOpen(false)}
                  >
                    Ver filhotes premium
                  </PrimaryCTA>
                  <PrimaryCTA
                    href={whatsappLink}
                    variant="ghost"
                    icon={<WhatsAppIcon className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                    className="w-full"
                    tracking={{ ctaId: "navbar_whatsapp", location: "drawer" }}
                    ariaLabel="Conversar com a equipe via WhatsApp"
                    onClick={() => setOpen(false)}
                  >
                    WhatsApp
                  </PrimaryCTA>
                  {phoneLink && (
                    <a
                      href={phoneLink}
                      className="flex min-h-[48px] items-center justify-center rounded-2xl border border-emerald-200 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      aria-label={`Ligar para ${formattedPhone || phone}`}
                      onClick={() => {
                        setOpen(false);
                        trackCTA("navbar_phone", "drawer")();
                      }}
                    >
                      Ligar
                    </a>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
