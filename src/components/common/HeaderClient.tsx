"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Copy, Phone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import { useToast } from "@/components/ui/toast";
import track from "@/lib/track";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "@/lib/whatsapp";

const FILHOTES_SUBLINKS = [
 { label: "Comprar", href: "/comprar-spitz-anao" },
 { label: "Preço", href: "/preco-spitz-anao" },
 { label: "Criador", href: "/criador-spitz-confiavel" },
] as const;

const DESKTOP_LINKS = [
 { label: "Início", href: "/" },
 { label: "Processo", href: "/sobre" },
 { label: "FAQ", href: "/faq-do-tutor" },
 { label: "Blog", href: "/blog" },
 { label: "Contato", href: "/contato" },
] as const;

const NAV_LINKS = [
 { label: "Início", href: "/" },
 { label: "Filhotes", href: "/filhotes" },
 { label: "Comprar", href: "/comprar-spitz-anao" },
 { label: "Preço", href: "/preco-spitz-anao" },
 { label: "Criador", href: "/criador-spitz-confiavel" },
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
 const [filhotesOpen, setFilhotesOpen] = useState(false);
 const filhotesCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
 push({ message: "Numero copiado.", type: "success" });
 emitCTA({ ctaId: "navbar_copy", location });
 } catch (err) {
 push({ message: "Nao foi possivel copiar o telefone", type: "error" });
 }
 },
 [phone, push]
 );
 const handleDrawerClose = useCallback(() => setOpen(false), []);

 const cancelFilhotesClose = useCallback(() => {
  if (filhotesCloseTimeoutRef.current) {
   clearTimeout(filhotesCloseTimeoutRef.current);
   filhotesCloseTimeoutRef.current = null;
  }
 }, []);

 const openFilhotes = useCallback(() => {
  cancelFilhotesClose();
  setFilhotesOpen(true);
 }, [cancelFilhotesClose]);

 const scheduleCloseFilhotes = useCallback(() => {
  cancelFilhotesClose();
  filhotesCloseTimeoutRef.current = setTimeout(() => {
   setFilhotesOpen(false);
  }, 180);
 }, [cancelFilhotesClose]);

 useEffect(() => {
 if (open) {
 firstDrawerLinkRef.current?.focus();
 }
 }, [open]);

 useEffect(() => {
  return () => cancelFilhotesClose();
 }, [cancelFilhotesClose]);

 useEffect(() => {
 try {
 document.querySelectorAll('[bis_skin_checked]').forEach((el) => el.removeAttribute("bis_skin_checked"));
 } catch {
 /* ignore */
 }
 }, []);

 return (
 <>
 <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white shadow-sm overflow-visible" role="banner">
 <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
 <Link
 href="/"
 className="flex items-center gap-2 rounded-full px-2 text-base font-semibold tracking-tight text-zinc-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
 aria-label="By Império Dog - voltar para o inicio"
 >
 <Image
 src="/byimperiologo.svg"
 alt=""
 width={28}
 height={28}
 className="h-7 w-7"
 aria-hidden="true"
 />
 <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand whitespace-nowrap">By Império Dog</span>
 </Link>

 <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
 {DESKTOP_LINKS.slice(0, 1).map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className="flex min-h-[44px] items-center rounded-full px-3 py-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
 >
 {link.label}
 </Link>
 ))}
 <div className="relative">
 <Link
 href="/filhotes"
 className="flex min-h-[44px] items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
 aria-haspopup="menu"
 aria-label="Filhotes - abrir sublinks"
  onMouseEnter={openFilhotes}
  onMouseLeave={scheduleCloseFilhotes}
  onFocus={openFilhotes}
  onBlur={scheduleCloseFilhotes}
 >
 Filhotes
    <ChevronDown className={`h-3.5 w-3.5 transition ${filhotesOpen ? "text-zinc-700" : "text-zinc-400"}`} aria-hidden />
 </Link>
 <div
  className={`absolute left-0 top-full z-20 mt-2 min-w-[220px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg transition ${
   filhotesOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
   }`}
  onMouseEnter={openFilhotes}
  onMouseLeave={scheduleCloseFilhotes}
 >
  <div aria-hidden className="absolute -top-2 left-0 h-2 w-full bg-transparent" />
 {FILHOTES_SUBLINKS.map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className="flex min-h-[40px] items-center rounded-xl px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
 >
 {link.label}
 </Link>
 ))}
 </div>
 </div>
 {DESKTOP_LINKS.slice(1).map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className="flex min-h-[44px] items-center rounded-full px-3 py-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
 >
 {link.label}
 </Link>
 ))}
 </nav>

 <div className="hidden items-center gap-5 lg:flex">
 <PrimaryCTA
 href={resolvedWhatsAppLink}
 icon={<WhatsAppIcon className="h-4 w-4 text-emerald-600" aria-hidden />}
 ariaLabel="Atendimento via WhatsApp"
 className="px-3 py-2 min-w-[140px] text-[11px] leading-4 tracking-[0.08em]"
 tracking={{ ctaId: "navbar_whatsapp", location: "header", deviceMode: "desktop" }}
 >
 Atendimento via WhatsApp
 </PrimaryCTA>

 <PrimaryCTA
  href="/filhotes"
  variant="ghost"
  ariaLabel="Ver filhotes premium"
  className="inline-flex min-w-0 whitespace-nowrap rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 tracking-normal"
  title="Ver filhotes"
  tracking={{ ctaId: "navbar_view_puppies", location: "header", deviceMode: "desktop" }}
 >
 Ver filhotes
 </PrimaryCTA>

 <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-1.5 py-1">
 {callHref && (
 <a
 href={callHref}
 aria-label={`Ligar para ${formattedPhone || phone}`}
 onClick={() => {
 push({ message: "Iniciando ligacao...", type: "info" });
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
 title="Copiar numero"
 >
 <Copy className="h-4 w-4" aria-hidden />
 <span className="sr-only">Copiar numero</span>
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
 <span aria-hidden="true" className="flex w-5 flex-col items-start justify-center gap-1">
 <span className="block h-0.5 w-5 rounded-full bg-current" />
 <span className="block h-0.5 w-3 rounded-full bg-current" />
 </span>
 </button>
 </Dialog.Trigger>

 <Dialog.Portal>
 <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
 <Dialog.Content
 id="mobile-menu"
 aria-label="Menu de navegacao"
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
 ariaLabel="Atendimento via WhatsApp"
 icon={<WhatsAppIcon className="h-4 w-4 text-emerald-600" aria-hidden />}
 >
 <span className="hidden sm:inline">Atendimento via WhatsApp</span>
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











