"use client";

import { Phone, PhoneCall } from "lucide-react";
import type { MouseEvent } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import track from "@/lib/track";

export type ContactCTAProps = {
 phone: string;
 waLink: string;
 context?: Record<string, unknown>;
 variant?: "panel" | "inline";
 className?: string;
};

const sanitizePhone = (value?: string) => (value ? value.replace(/\D+/g, "") : "");

const formatDisplayPhone = (digits?: string) => {
 if (!digits) return "";
 const normalized = digits.replace(/^0+/, "");

 // Brasil: +55 (DD) 9 XXXX-XXXX (celular) | +55 (DD) XXXX-XXXX (fixo)
 if (normalized.startsWith("55")) {
 const rest = normalized.slice(2);
 if (rest.length === 10 || rest.length === 11) {
 const ddd = rest.slice(0, 2);
 const local = rest.slice(2);
 if (local.length === 9) {
 const ninth = local.slice(0, 1);
 const prefix = local.slice(1, 5);
 const suffix = local.slice(5);
 return `+55 (${ddd}) ${ninth} ${prefix}-${suffix}`;
 }
 if (local.length === 8) {
 const prefix = local.slice(0, 4);
 const suffix = local.slice(4);
 return `+55 (${ddd}) ${prefix}-${suffix}`;
 }
 }
 }

 // Fallback BR sem DDI
 if (normalized.length === 11) {
 const ddd = normalized.slice(0, 2);
 const local = normalized.slice(2);
 const ninth = local.slice(0, 1);
 const prefix = local.slice(1, 5);
 const suffix = local.slice(5);
 return `(${ddd}) ${ninth} ${prefix}-${suffix}`;
 }
 if (normalized.length === 10) {
 const ddd = normalized.slice(0, 2);
 const local = normalized.slice(2);
 const prefix = local.slice(0, 4);
 const suffix = local.slice(4);
 return `(${ddd}) ${prefix}-${suffix}`;
 }

 // Fallback genérico: tentar separar código do país e 10 dígitos finais
 const country = normalized.length > 10 ? `+${normalized.slice(0, normalized.length - 10)}` : "";
 const core = normalized.slice(-10);
 const match = core.match(/^(\d{2})(\d{4,5})(\d{4})$/);
 if (!match) return `${country ? `${country} ` : ""}${core}`;
 const [, ddd, prefix, suffix] = match;
 return `${country ? `${country} ` : ""}(${ddd}) ${prefix}-${suffix}`;
};

const buildTelHref = (digits?: string) => {
 const clean = sanitizePhone(digits);
 if (!clean) return undefined;
 if (clean.startsWith("55")) return `tel:+${clean}`;
 if (clean.length === 10 || clean.length === 11) return `tel:+55${clean}`;
 return `tel:+${clean}`;
};

const openExternal = (url: string) => {
 const popup = window.open(url, "_blank", "noopener,noreferrer");
 if (!popup) {
 window.location.assign(url);
 }
};

const trackCTA = (context: Record<string, unknown> | undefined, destination: "whatsapp" | "phone") => {
 const payload = { destination, ...context };
 track.event?.("cta_click", payload);
 if (destination === "whatsapp") {
 track.event?.("whatsapp_click", payload);
 track.event?.("lead_submit", { ...payload, action: "whatsapp" });
 } else {
 track.event?.("phone_click", payload);
 }
};

const buttonBase =
 "inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition hover:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]";

export default function ContactCTA({ phone, waLink, context, variant = "panel", className }: ContactCTAProps) {
 const cleanDigits = sanitizePhone(phone);
 const phoneHref = buildTelHref(cleanDigits);
 const displayPhone = cleanDigits ? formatDisplayPhone(cleanDigits) : phone;
 const wrapperVariant =
 variant === "panel"
 ? "rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
 : "rounded-2xl";
 const containerClass = ["space-y-2", wrapperVariant, className].filter(Boolean).join(" ");

 const handlePhone = (event: MouseEvent<HTMLButtonElement>) => {
 event.preventDefault();
 trackCTA(context, "phone");
 if (phoneHref) {
 window.location.href = phoneHref;
 }
 };

 const handleWhatsApp = (event: MouseEvent<HTMLButtonElement>) => {
 event.preventDefault();
 trackCTA(context, "whatsapp");
 openExternal(waLink);
 };

 return (
 <div className={containerClass} aria-label="Opções de contato premium">
 <div className="flex flex-col gap-1">
 <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--text-muted)]">
 Fale com o concierge
 </p>
 {displayPhone ? (
 <p className="text-base font-semibold text-[var(--text)]">{displayPhone}</p>
 ) : null}
 </div>

 <div className="space-y-3 sm:hidden">
 <button
 type="button"
 onClick={handleWhatsApp}
 className={`${buttonBase} bg-[var(--brand)] text-[var(--brand-foreground)]`}
 aria-label="Abrir WhatsApp"
 >
 <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
 WhatsApp
 </button>
 {phoneHref ? (
 <button
 type="button"
 onClick={handlePhone}
 className={`${buttonBase} border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]`}
 aria-label="Ligar agora"
 >
 <PhoneCall className="h-4 w-4" aria-hidden="true" />
 Ligar
 </button>
 ) : null}
 </div>

 <div className="hidden items-center justify-between gap-3 sm:flex">
 <div className="flex-1">
 <p className="text-xs uppercase tracking-[0.4em] text-[var(--text-muted)]">Telefone disponível</p>
 {phoneHref ? (
 <a
 href={phoneHref}
 className="text-sm font-semibold text-[var(--brand)] underline underline-offset-2"
 onClick={(event) => {
 event.stopPropagation();
 trackCTA(context, "phone");
 }}
 >
 {displayPhone}
 </a>
 ) : null}
 </div>
 <div className="flex flex-wrap gap-2">
 {phoneHref ? (
 <button
 type="button"
 onClick={handlePhone}
 className={`${buttonBase} border-[var(--border)] bg-white text-[var(--text)]`}
 aria-label="Ligar agora"
 >
 <Phone className="h-4 w-4" aria-hidden="true" />
 Ligar
 </button>
 ) : null}
 <button
 type="button"
 onClick={handleWhatsApp}
 className={`${buttonBase} bg-[var(--brand)] text-[var(--brand-foreground)]`}
 aria-label="Abrir WhatsApp"
 >
 <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
 WhatsApp
 </button>
 </div>
 </div>
 </div>
 );
}
