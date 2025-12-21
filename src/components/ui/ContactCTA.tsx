"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { trackWhatsAppClick, trackCTAClick } from "@/lib/events";

type ContactCTAProps = {
  phone: string; // in international format or raw
  label?: string;
  className?: string;
  ctaName?: string;
  location?: string;
};

export default function ContactCTA({ phone, label = "Contato", className, ctaName = "contact", location = "detail" }: ContactCTAProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia && window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleWhatsApp = () => {
    try {
      trackWhatsAppClick(location, label);
      trackCTAClick(ctaName, location);
    } catch {}
    const text = encodeURIComponent("Olá, tenho interesse.");
    const cleaned = phone.replace(/[^0-9+]/g, "");
    const wa = cleaned.startsWith("+") ? cleaned.replace(/^\+/, "") : cleaned;
    const url = `https://wa.me/${wa}?text=${text}`;
    window.open(url, "_blank");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      trackCTAClick(ctaName + ":copy", location);
    } catch {}
  };

  if (isMobile) {
    return (
      <button
        type="button"
        onClick={handleWhatsApp}
        aria-label={`Abrir WhatsApp para ${label}`}
        className={clsx("inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2", className)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={clsx("inline-flex items-center gap-2", className)}>
      <a
        href={`tel:${phone.replace(/\s+/g, "")}`}
        onClick={() => trackCTAClick(ctaName, location)}
        className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-emerald-800 border border-emerald-200 hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        aria-label={`Ligar para ${label} ${phone}`}
      >
        <span className="sr-only">Telefone</span>
        {phone}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copiar telefone ${phone}`}
        className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
"use client";

import classNames from "classnames";
import { ReactNode, MouseEventHandler } from "react";

type ContactCTAProps = {
  href: string;
  label: string;
  icon?: ReactNode;
  variant?: "solid" | "outline";
  target?: string;
  rel?: string;
  ariaLabel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function ContactCTA({
  href,
  label,
  icon,
  variant = "solid",
  target = "_blank",
  rel = "noreferrer noopener",
  ariaLabel,
}: ContactCTAProps) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className={classNames(
        "inline-flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold tracking-[0.25em] transition duration-200 ease-[var(--ease-standard)]",
        variant === "solid"
          ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--elevation-2)] hover:bg-[var(--accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
      )}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
