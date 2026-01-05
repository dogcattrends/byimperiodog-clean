"use client";

import { ShieldCheck, Truck, Video, Share2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useRef, useState, useEffect } from "react";

import type { Puppy } from "@/domain/puppy";
import { formatPuppyMeta } from "@/domain/puppyMeta";
import type { PuppyStatus } from "@/domain/taxonomies";
import { TaxonomyHelpers } from "@/domain/taxonomies";
import track from "@/lib/track";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "@/lib/whatsapp";

const PuppyDetailsModal = dynamic(() => import("@/components/PuppyDetailsModal"), {
  ssr: false,
  loading: () => null,
});

const STATUS_BADGES: Record<PuppyStatus, { label: string; icon: string; tone: string }> = {
  available: { label: "Disponível", icon: "✔", tone: "text-emerald-600 bg-emerald-100" },
  reserved: { label: "Reservado", icon: "⏳", tone: "text-amber-500 bg-amber-100" },
  sold: { label: "Indisponível", icon: "✕", tone: "text-rose-500 bg-rose-100" },
  pending: { label: "Em preparação", icon: "…", tone: "text-zinc-600 bg-zinc-100" },
  unavailable: { label: "Indisponível", icon: "✕", tone: "text-zinc-600 bg-zinc-100" },
};

const humanize = (value?: string | null) =>
  value
    ? value
        .replace(/[-_]/g, " ")
        .trim()
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    : "";

const formatLocation = (city?: string | null, state?: string | null) => {
  if (!city && !state) return "Localização sob consulta";
  const cityLabel =
    city && TaxonomyHelpers.getCityBySlug(city)?.name
      ? TaxonomyHelpers.getCityBySlug(city)!.name
      : humanize(city);
  const parts = [cityLabel, humanize(state)].filter(Boolean);
  return parts.length ? parts.join(" • ") : "Localização sob consulta";
};

type Props = {
  puppy: Puppy;
};

export default function PuppyCatalogCard({ puppy }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const linkCopyTimerRef = useRef<number | null>(null);
  // cleanup timers
  useEffect(() => {
    return () => {
      if (linkCopyTimerRef.current) window.clearTimeout(linkCopyTimerRef.current);
    };
  }, []);
  const detailsButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusKey = (puppy.status ?? "available") as PuppyStatus;
  const status = STATUS_BADGES[statusKey] ?? STATUS_BADGES.available;
  const meta = useMemo(() => formatPuppyMeta(puppy), [puppy]);
  const chips = useMemo(
    () => [meta.combinedLabel, meta.ageLabel].filter((chip): chip is string => Boolean(chip)),
    [meta.combinedLabel, meta.ageLabel]
  );
  const location = useMemo(() => formatLocation(puppy.city, puppy.state), [puppy.city, puppy.state]);
  const imageUrl = puppy.images?.[0] ?? puppy.thumbnailUrl;
  const isReservable = statusKey !== "sold" && statusKey !== "unavailable";
  const primaryLabel = statusKey === "reserved" ? "Entrar na lista" : "Reservar";

  const whatsappLink = useMemo(
    () =>
      buildWhatsAppLink({
        message: WHATSAPP_MESSAGES.filhotes(puppy.name),
        utmSource: "catalogo",
        utmMedium: "catalog_card",
        utmCampaign: "reservar",
        utmContent: puppy.slug ?? puppy.name,
      }),
    [puppy.name, puppy.slug]
  );

  const openDetails = () => {
    track.event?.("modal_open", { placement: "catalog_card", puppy_id: puppy.id });
    setIsModalOpen(true);
  };

  const handleShare = async (event: any) => {
    event.stopPropagation();
    try {
      const url = new URL(`/filhotes/${puppy.slug ?? puppy.id}`, window.location.origin).toString();
      const color = meta.colorLabel ?? "Cor não informada";
      const sex = meta.sexLabel ?? "Sexo não informado";
      const price = formatPrice(puppy.priceCents);
      const message = `Olha esse filhote: ${puppy.name} (${color} • ${sex}) – ${price}. Link: ${url}`;

      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as any).share({ title: puppy.name, text: message, url });
        return;
      }

      if ((navigator as any).clipboard && (navigator as any).clipboard.writeText) {
        await (navigator as any).clipboard.writeText(url);
        setLinkCopied(true);
        if (linkCopyTimerRef.current) window.clearTimeout(linkCopyTimerRef.current);
        linkCopyTimerRef.current = window.setTimeout(() => setLinkCopied(false), 2200);
        return;
      }

      const wa = `https://wa.me/?text=${encodeURIComponent(message + " " + url)}`;
      window.open(wa, "_blank", "noopener,noreferrer");
    } catch (err) {
      const url = new URL(`/filhotes/${puppy.slug ?? puppy.id}`, window.location.origin).toString();
      const wa = `https://wa.me/?text=${encodeURIComponent((puppy?.name ?? "") + " " + url)}`;
      window.open(wa, "_blank", "noopener,noreferrer");
    }
  };

  const handleReserve = () => {
    if (!isReservable) return;
    track.event?.("cta_click_whatsapp", { puppy_id: puppy.id });
    if (typeof window !== "undefined") {
      window.open(whatsappLink, "_blank");
    }
  };

  return (
    <>
      <article
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg transition hover:-translate-y-[1px] hover:shadow-2xl focus-within:ring-2 focus-within:ring-emerald-500/70"
        aria-label={`Filhote ${puppy.name} — ${status.label}`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={openDetails}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openDetails();
            }
          }}
          aria-label={`Ver fotos e detalhes de ${puppy.name}`}
          className="relative w-full cursor-pointer overflow-hidden rounded-3xl border-b border-transparent text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <div className="relative h-0" style={{ paddingBottom: "125%" }}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${puppy.name} — filhote de Spitz Alemão`}
                fill
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-center transition duration-400 group-hover:scale-105"
                priority={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-black/70 via-black/20 to-black/90 px-6 py-5 text-white">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase text-white/90">
                    Vídeo no WhatsApp
                  </span>
                  <p className="text-lg font-semibold leading-snug">Foto em atualização</p>
                  <p className="text-sm text-white/80">Disponível para videochamada</p>
                </div>
                <div className="w-full">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (typeof window !== "undefined") {
                        window.open(whatsappLink, "_blank", "noopener,noreferrer");
                      }
                    }}
                    aria-label={`Ver vídeo no WhatsApp de ${puppy.name}`}
                    className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Video className="h-4 w-4 text-zinc-900" aria-hidden />
                      Ver vídeo
                    </span>
                  </button>
                  <p className="mt-2 text-[11px] text-center text-white/70">Chame no WhatsApp e veja o filhote agora</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40" aria-hidden />
            <div
              className={`absolute left-3 top-3 flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}
            >
              <span aria-hidden="true">{status.icon}</span>
              <span>{status.label}</span>
            </div>
            <div className="absolute right-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
              {formatPrice(puppy.priceCents)}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 px-5 pb-4 pt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-2xl font-semibold text-zinc-900 leading-tight">{puppy.name}</h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 leading-snug">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-zinc-400">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" />
                </svg>
                <span className="whitespace-normal break-words">{location}</span>
              </div>
            </div>
            <span className="sr-only">Preço: {formatPrice(puppy.priceCents)}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {chips.length ? (
              chips.map((chip) => (
                <span key={chip} className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600">
                  {chip}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500">—</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-zinc-700">
              <Video className="h-3.5 w-3.5 text-zinc-600" aria-hidden />
              Vídeo
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-zinc-700">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" aria-hidden />
              Pedigree
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-zinc-700">
              <Truck className="h-3.5 w-3.5 text-zinc-600" aria-hidden />
              Entrega segura
            </span>
          </div>

          <div className="mt-3 flex gap-3">
            <button
              ref={detailsButtonRef}
              type="button"
              onClick={handleReserve}
              disabled={!isReservable}
              aria-label={`Reservar: ${puppy.name}`}
              className={`min-h-[44px] flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                isReservable ? "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98]" : "cursor-not-allowed bg-zinc-200 text-zinc-500"
              }`}
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              onClick={openDetails}
              aria-label={`Ver detalhes: ${puppy.name}`}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <span>Ver detalhes</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-emerald-600">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label={`Compartilhar ${puppy.name}`}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Compartilhar
            </button>
          </div>
          {linkCopied && <div className="mt-2 text-xs font-semibold text-emerald-600">Link copiado</div>}
        </div>
      </article>

      {isModalOpen && (
        <PuppyDetailsModal id={puppy.id} onClose={() => setIsModalOpen(false)} restoreFocusRef={detailsButtonRef} />
      )}
    </>
  );
}

function formatPrice(cents?: number) {
  if (!cents) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}
