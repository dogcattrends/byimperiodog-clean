"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ContactCTA } from "@/components/ui/ContactCTA";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import { routes, type AppRoutes } from "@/lib/route";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const NAV_LINKS: { label: string; href: AppRoutes | string }[] = [
  { label: "Início", href: routes.home },
  { label: "Filhotes", href: routes.filhotes },
  { label: "Processo", href: routes.sobre },
  { label: "FAQ", href: "/faq-do-tutor" },
  { label: "Blog", href: routes.blog },
  { label: "Contato", href: routes.contato },
];

export default function Header() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const whatsappLink = useMemo(
    () =>
      buildWhatsAppLink({
        message:
          "Olá! Quero conversar sobre a disponibilidade dos Spitz Alemão Anão até 22 cm da By Império Dog.",
        utmSource: "site",
        utmMedium: "header",
        utmCampaign: "header_whatsapp",
        utmContent: "hero_nav",
      }),
    []
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white text-zinc-900 shadow-sm" role="banner">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:px-10">
        <Link
          href={routes.home}
          className="flex min-h-[48px] items-center gap-2 rounded-full px-2 text-base font-semibold tracking-tight text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label="By Império Dog - ir para a página inicial"
        >
          <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">By Império Dog</span>
          <span className="hidden text-xs font-medium text-zinc-500 sm:block">Spitz Alemão Anão com suporte premium</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex min-h-[44px] items-center rounded-full px-3 text-sm font-semibold transition ${
                isActive(link.href)
                  ? "text-brand"
                  : "text-zinc-500 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              }`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <PrimaryCTA href={routes.filhotes} ariaLabel="Ver filhotes premium">
            Ver filhotes
          </PrimaryCTA>
          <ContactCTA
            href={whatsappLink}
            label="Conversar agora"
            icon={<WhatsAppIcon className="h-4 w-4" aria-hidden="true" />}
            ariaLabel="Conversar agora no WhatsApp"
          />
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-zinc-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 lg:hidden"
              aria-label="Abrir menu de navegação"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
            <Dialog.Content
              className="fixed inset-x-0 top-0 z-50 rounded-b-3xl border-b border-emerald-100 bg-white px-6 pb-6 pt-4 shadow-2xl"
              aria-label="Menu de navegação"
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
              <nav className="mt-4 space-y-2" aria-label="Navegação mobile">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex min-h-[48px] items-center rounded-2xl border px-4 text-sm font-semibold transition ${
                      isActive(link.href)
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-transparent text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50"
                    }`}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-5 space-y-2">
                <PrimaryCTA
                  href={routes.filhotes}
                  className="w-full"
                  ariaLabel="Ver filhotes premium"
                  onClick={() => setOpen(false)}
                >
                  Ver filhotes premium
                </PrimaryCTA>
                <ContactCTA
                  href={whatsappLink}
                  label="Conversar no WhatsApp"
                  icon={<WhatsAppIcon className="h-4 w-4" aria-hidden="true" />}
                  variant="outline"
                  ariaLabel="Conversar no WhatsApp"
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
