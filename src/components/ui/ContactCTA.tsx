"use client";

import { Copy, Phone } from "lucide-react";
import { useMemo, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import track from "@/lib/track";

type ContactCTAProps = {
  phone: string;
  whatsappLink: string;
  context?: Record<string, unknown>;
  className?: string;
};

const sanitizePhone = (value?: string) => (value ? value.replace(/\D+/g, "") : "");

export function ContactCTA({ phone, whatsappLink, context, className }: ContactCTAProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [announce, setAnnounce] = useState('');
  const cleanPhone = sanitizePhone(phone);
  const phoneHref = cleanPhone ? `tel:${cleanPhone}` : undefined;
  const sanitizedWhatsApp = useMemo(() => whatsappLink, [whatsappLink]);
  const panelClassName =
    "space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm " + (className ?? "");

  const handleCopy = async () => {
    if (!navigator?.clipboard || !phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      setAnnounce('Telefone copiado para a área de transferência');
      track.event?.("phone_click", { ...(context || {}), action: "copy" });
      track.event?.("cta_click", { ...(context || {}), type: "phone", action: "copy" });
      setTimeout(() => setCopiedPhone(false), 2500);
      setTimeout(() => setAnnounce(''), 2500);
    } catch {
      //
    }
  };

  return (
    <div className={panelClassName} aria-label="Opções de contato premium">
      <div className="sm:hidden space-y-2">
        <PrimaryCTA
          href={sanitizedWhatsApp}
          icon={<WhatsAppIcon className="h-4 w-4" aria-hidden="true" />}
          ariaLabel="Conversar no WhatsApp"
          onClick={() => {
            track.event?.("cta_click", { ...(context || {}), type: "whatsapp" });
            track.event?.("whatsapp_click", { ...(context || {}), type: "whatsapp" });
            track.event?.("lead_submit", { ...(context || {}), action: "whatsapp" });
          }}
        >
          WhatsApp
        </PrimaryCTA>
        <p className="text-xs text-zinc-500">
          Ligamos pelo telefone assim que você desbloquear o chat no desktop.
        </p>
      </div>

      <div className="hidden sm:flex flex-col gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--text-muted)]">Telefone</p>
          <p className="text-lg font-semibold text-[var(--text)]">{phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {phoneHref && (
            <PrimaryCTA
              href={phoneHref}
              variant="ghost"
              icon={<Phone className="h-4 w-4" aria-hidden="true" />}
              ariaLabel="Discar telefone"
              onClick={() => {
                track.event?.("cta_click", { ...(context || {}), type: "phone", action: "call" });
                track.event?.("phone_click", { ...(context || {}), action: "call" });
              }}
            >
              Ligar agora
            </PrimaryCTA>
          )}
          <button
            type="button"
            onClick={() => {
              handleCopy();
              track.event?.("cta_click", { ...(context || {}), type: "phone", action: "copy" });
              track.event?.("phone_click", { ...(context || {}), action: "copy" });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
            aria-label={`Copiar telefone ${phone}`}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copiedPhone ? "Copiado" : "Copiar"}
          </button>
          <div className="sr-only" role="status" aria-live="polite">
            {announce}
          </div>
          <PrimaryCTA
            href={sanitizedWhatsApp}
            variant="ghost"
            icon={<WhatsAppIcon className="h-4 w-4" aria-hidden="true" />}
            ariaLabel="Conversar no WhatsApp"
            onClick={() => {
              track.event?.("cta_click", { ...(context || {}), type: "whatsapp", action: "secondary" });
              track.event?.("whatsapp_click", { ...(context || {}), action: "secondary" });
              track.event?.("lead_submit", { ...(context || {}), action: "whatsapp" });
            }}
          >
            WhatsApp
          </PrimaryCTA>
        </div>
      </div>
    </div>
  );
}

export default ContactCTA;
