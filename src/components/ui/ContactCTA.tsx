"use client";

import classNames from "classnames";
import { Copy, Phone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import track from "@/lib/track";

type TrackingMeta = {
  location?: string;
  ctaId?: string;
  deviceMode?: "mobile" | "desktop" | "modal";
  extra?: Record<string, unknown>;
};

type ContactCTAProps = {
  variant?: "inline" | "panel" | "outline";
  href?: string;
  label?: string;
  icon?: ReactNode;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  phone?: string;
  whatsappLink?: string;
  tracking?: TrackingMeta;
  includeWhatsAppOnDesktop?: boolean;
  stickyMobile?: boolean;
};

const sanitizePhone = (value?: string) => (value ? value.replace(/\D+/g, "") : "");

const emitTracking = (id: string, meta?: TrackingMeta) => {
  track.event?.("cta_click", {
    cta_id: meta?.ctaId ?? id,
    location: meta?.location ?? "contact",
    device_mode: meta?.deviceMode,
    ...meta?.extra,
  });
};

export function ContactCTA({
  variant = "inline",
  href = "#",
  label = "Contato",
  icon,
  target = "_blank",
  rel = "noreferrer noopener",
  ariaLabel,
  className,
  onClick,
  phone,
  whatsappLink,
  tracking,
  includeWhatsAppOnDesktop = true,
  stickyMobile,
}: ContactCTAProps) {
  const [copied, setCopied] = useState(false);
  const cleanPhone = sanitizePhone(phone);
  const callHref = cleanPhone ? `tel:${cleanPhone}` : undefined;
  const mobileWhatsApp = useMemo(() => whatsappLink ?? "#", [whatsappLink]);

  if (variant === "inline" || variant === "outline" || !phone || !whatsappLink) {
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      emitTracking("contact_inline", { ...(tracking ?? { location: "inline" }), ctaId: "contact_inline" });
      onClick?.(event);
    };

    return (
      <Link
        href={href}
        className={classNames(
          "inline-flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold tracking-[0.25em] transition duration-200 ease-[var(--ease-standard)]",
          className,
        )}
        target={target}
        rel={rel}
        aria-label={ariaLabel ?? label}
        onClick={handleClick}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  }

  const baseTracking = tracking ?? { location: "contact_panel" };
  const mobileTracking = { ...baseTracking, deviceMode: "mobile" } as TrackingMeta;
  const desktopTracking = { ...baseTracking, deviceMode: "desktop" } as TrackingMeta;
  const panelClass = classNames(
    "space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm",
    className,
  );
  const mobileWrapperClass = classNames("flex flex-col gap-2 sm:hidden", {
    "sticky bottom-0 left-0 right-0 z-20 rounded-t-3xl border border-t-0 border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg":
      stickyMobile,
  });

  const handleCopy = async () => {
    if (!cleanPhone) return;
    try {
      await navigator.clipboard.writeText(phone ?? "");
      setCopied(true);
      emitTracking("contact_copy", { ...desktopTracking, ctaId: "contact_copy_desktop" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      //
    }
  };

  return (
    <div className={panelClass} aria-label="Opções de contato">
      <div className={mobileWrapperClass}>
        <PrimaryCTA
          href={mobileWhatsApp}
          icon={<WhatsAppIcon className="h-4 w-4" aria-hidden="true" />}
          tracking={{ ...mobileTracking, ctaId: "contact_whatsapp_mobile" }}
          ariaLabel="Conversar no WhatsApp"
        >
          WhatsApp
        </PrimaryCTA>
        {callHref && (
          <PrimaryCTA
            href={callHref}
            variant="ghost"
            icon={<Phone className="h-4 w-4" aria-hidden="true" />}
            tracking={{ ...mobileTracking, ctaId: "contact_call_mobile" }}
            ariaLabel="Ligar agora"
          >
            Ligar
          </PrimaryCTA>
        )}
      </div>

      <div className="hidden sm:flex flex-col gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--text-muted)]">Telefone</p>
          <p className="text-lg font-semibold text-[var(--text)]">{phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {includeWhatsAppOnDesktop && (
            <PrimaryCTA
              href={mobileWhatsApp}
              icon={<WhatsAppIcon className="h-4 w-4" aria-hidden="true" />}
              tracking={{ ...desktopTracking, ctaId: "contact_whatsapp_desktop" }}
              ariaLabel="Abrir WhatsApp no desktop"
            >
              WhatsApp web
            </PrimaryCTA>
          )}
          {callHref && (
            <PrimaryCTA
              href={callHref}
              variant="ghost"
              icon={<Phone className="h-4 w-4" aria-hidden="true" />}
              tracking={{ ...desktopTracking, ctaId: "contact_call_desktop" }}
              ariaLabel="Ligar agora"
            >
              Ligar
            </PrimaryCTA>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
            aria-label={`Copiar telefone ${phone}`}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContactCTA;
