"use client";
/* eslint-disable import/order */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";

import AccessibleModal from "@/components/ui/AccessibleModal";
import ContactCTA from "@/components/ui/ContactCTA";
import { PuppyDetails } from "@/components/puppy/PuppyDetails";
import { PuppyGallery } from "@/components/puppy/PuppyGallery";
import ShareButton from "@/components/ui/ShareButton";
import { Button, Spinner, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import type { Puppy } from "@/domain/puppy";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { saveLead } from "@/lib/data/supabase";
import { titleCasePt } from "@/lib/formatters";
import { formatCentsToBRL } from "@/lib/price";
import type { ShareablePuppy } from "@/lib/sharePuppy";
import track from "@/lib/track";
import { buildQualifiedWhatsAppMessage, buildWhatsAppLink, WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { normalizeMedia } from "@/lib/puppyMedia";
// `PuppyStatus` type was previously imported but is no longer required here.

type Props = {
 id: string;
 onClose: () => void;
 restoreFocusRef?: RefObject<HTMLElement | null>;
};

export default function PuppyDetailsModal({ id, onClose, restoreFocusRef }: Props) {
 const [puppy, setPuppy] = useState<Puppy | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [reserveSubmitting, setReserveSubmitting] = useState(false);
 const { push } = useToast();
 const [open, setOpen] = useState(true);

 const handleClose = useCallback(() => {
 setOpen(false);
 onClose();
 if (restoreFocusRef?.current) {
 restoreFocusRef.current.focus({ preventScroll: true });
 }
 }, [onClose, restoreFocusRef]);

 const getTrackingContext = useCallback(
 (extra?: Record<string, unknown>) => {
 const loc = typeof window !== "undefined" ? window.location : null;
 const search = loc ? new URLSearchParams(loc.search) : null;
 const deviceType =
 typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
 ? "mobile"
 : "desktop";

 const context = {
 slug: puppy?.slug ?? undefined,
 puppy_id: puppy?.id ?? id,
 page_path: loc?.pathname ?? undefined,
 referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
 device_type: deviceType,
 utm_source: search?.get("utm_source") ?? undefined,
 utm_medium: search?.get("utm_medium") ?? undefined,
 utm_campaign: search?.get("utm_campaign") ?? undefined,
 utm_content: search?.get("utm_content") ?? undefined,
 utm_term: search?.get("utm_term") ?? undefined,
 ...extra,
 };

 return context;
 },
 [id, puppy]
 );

 // Body scroll lock handled by AccessibleModal

 useEffect(() => {
 const controller = new AbortController();
 let isActive = true;
 setIsLoading(true);
 setErrorMessage(null);
 setPuppy(null);

 (async () => {
 try {
 const response = await fetch(`/api/puppies/${encodeURIComponent(id)}`, {
 signal: controller.signal,
 cache: "no-store",
 });

 if (!response.ok) {
 const text = await response.text();
 throw new Error(text || "Falha ao carregar detalhes do filhote.");
 }

 const payload = await response.json();
 const raw = payload?.data;
 if (!isActive) return;
 if (!raw) {
 setErrorMessage("Filhote nao encontrado.");
 return;
 }

 const normalized = normalizePuppyFromDB(raw);
 setPuppy(normalized);
 } catch (error) {
 if (!isActive) return;
 if ((error as { name?: string }).name === "AbortError") return;
 setErrorMessage((error as Error)?.message || "Nao foi possivel carregar o filhote.");
 } finally {
 if (isActive) setIsLoading(false);
 }
 })();

 return () => {
 isActive = false;
 controller.abort();
 };
 }, [id]);

 // ESC fechando é suportado por AccessibleModal (Radix Dialog)

 // Focus trap e retorno de foco são geridos por AccessibleModal

 useEffect(() => {
 if (!puppy) return;
 track.event?.("modal_open", getTrackingContext({ placement: "catalog_modal" }));
 }, [getTrackingContext, puppy]);

 // share payload removido do modal para evitar ações paralelas às CTAs principais

 const whatsappLink = useMemo(() => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://byimperio.dog";

  if (!puppy) {
   return buildWhatsAppLink({
    message: buildQualifiedWhatsAppMessage({
     origin: "catalog_modal",
     canonicalUrl: baseUrl,
    }),
    utmSource: "site",
    utmMedium: "modal",
    utmCampaign: "filhotes",
    utmContent: "cta_whatsapp",
   });
  }

  const sexLabel = translateSexLabel(puppy.sex);
  const colorLabel = puppy.color ? titleCasePt(puppy.color) : "";
  const location = [puppy.city, puppy.state].filter(Boolean).join(" / ");
  const canonical = `${baseUrl}/filhotes/${puppy.slug ?? puppy.id}`;

  return buildWhatsAppLink({
   message: buildQualifiedWhatsAppMessage({
    origin: "catalog_modal",
    canonicalUrl: canonical,
    puppyName: puppy.name,
    puppyColor: colorLabel,
    puppySex: sexLabel,
    puppyLocation: location,
   }),
   utmSource: "site",
   utmMedium: "modal",
   utmCampaign: "filhotes",
   utmContent: puppy.slug ?? puppy.id,
  });
 }, [puppy]);

 const openLink = useCallback((url: string) => {
 const popup = window.open(url, "_blank", "noopener,noreferrer");
 if (!popup) window.location.assign(url);
 }, []);

 const normalizedStatus = useMemo(() => normalizeStatusForCtas(puppy?.status), [puppy?.status]);
 const isReservable = normalizedStatus === "available";
 const reserveAction = isReservable ? "reserve" : "waitlist";
 const reserveLabel = isReservable ? "Reservar" : "Entrar na lista";
 const shareablePuppy = useMemo<ShareablePuppy | null>(() => {
 if (!puppy) return null;
 return {
 id: puppy.id,
 slug: puppy.slug ?? undefined,
 name: puppy.name ?? "Filhote",
 color: puppy.color ?? undefined,
 sex: puppy.sex ?? undefined,
 city: puppy.city ?? undefined,
 state: puppy.state ?? undefined,
 priceCents: puppy.priceCents ?? undefined,
 status: puppy.status ?? undefined,
 };
 }, [puppy]);
 const contactContext = useMemo(() => {
 if (!puppy) return undefined;
 return getTrackingContext({ placement: "modal", status: normalizedStatus, type: "contact" });
 }, [getTrackingContext, normalizedStatus, puppy]);

 const handleReserve = useCallback(async () => {
 if (!puppy) return;
 if (reserveSubmitting) return;

 const location = [puppy.city, puppy.state].filter(Boolean).join(" / ");
 const message =
 reserveAction === "reserve"
 ? `Ola! Quero reservar o filhote ${puppy.name}${location ? ` (${location})` : ""}. Pode me enviar os proximos passos?`
 : `Ola! Quero entrar na lista para o filhote ${puppy.name}${location ? ` (${location})` : ""}. Pode me avisar quando houver disponibilidade?`;

 const url = buildWhatsAppLink({
 message,
 utmSource: "site",
 utmMedium: "modal",
 utmCampaign: reserveAction,
 utmContent: puppy.slug ?? puppy.id,
 });

 setReserveSubmitting(true);
 const payload = getTrackingContext({ placement: "modal", status: normalizedStatus, action: reserveAction });
 track.event?.("cta_click", { ...payload, type: "reserve" });
 track.event?.("lead_submit", payload);

 try {
 await saveLead({
 puppy_id: puppy.slug ?? puppy.id,
 action: reserveAction,
 status: normalizedStatus,
 source: "modal",
 });
 push({ type: "success", message: "Perfeito — abrindo WhatsApp agora." });
 track.event?.("lead_saved", { placement: "modal", puppy_id: puppy.id, action: reserveAction });
 } catch {
 push({ type: "error", message: "Nao foi possivel registrar seu pedido. Abrindo WhatsApp mesmo assim." });
 track.event?.("lead_error", { placement: "modal", puppy_id: puppy.id, action: reserveAction });
 } finally {
 setReserveSubmitting(false);
 openLink(url);
 }
 }, [getTrackingContext, normalizedStatus, openLink, puppy, push, reserveAction, reserveSubmitting]);

 const priceLabel = puppy?.priceCents && puppy.priceCents > 0 ? formatCentsToBRL(puppy.priceCents) : "Consultar valor";
 const locationLabel = puppy ? [puppy.city, puppy.state].filter(Boolean).join(" / ") : "";
 const galleryMedia = useMemo(() => {
 if (!puppy) return [];
 const normalized = normalizeMedia(puppy);
 if (normalized.length) {
 return normalized
 .map((item) => item.url)
 .filter((url): url is string => typeof url === "string" && url.trim().length > 0 && url !== "undefined" && url !== "null");
 }
 return (puppy.images ?? []).filter((url): url is string => typeof url === "string" && url.trim().length > 0 && url !== "undefined" && url !== "null");
 }, [puppy]);

 const postersByUrl = useMemo<Record<string, string | undefined>>(() => {
 if (!puppy) return {};
 const normalized = normalizeMedia(puppy);
 const out: Record<string, string | undefined> = {};
 for (const item of normalized) {
 if (!item?.url) continue;
 if (item.poster) out[item.url] = item.poster;
 }
 return out;
 }, [puppy]);

 const chipLabel = useMemo(() => {
 if (!puppy) return "";
 const parts = [puppy.color ? titleCasePt(puppy.color) : null, puppy.sex ? translateSexLabel(puppy.sex) : null].filter(Boolean);
 return parts.join(" • ");
 }, [puppy]);

 const modalTitle = useMemo(() => {
 const base = "Spitz Alemão Anão Lulu da Pomerânia";
 if (!puppy) return base;
 const sex = puppy.sex ? translateSexLabel(puppy.sex) : "";
 const color = puppy.color ? titleCasePt(puppy.color) : "";
 const suffix = [sex, color].filter(Boolean).join(" ").trim();
 return suffix ? `${base} – ${suffix}` : base;
 }, [puppy]);

 const forWhoText = useMemo(() => {
 if (!puppy) return null;
 const sex = puppy.sex ? translateSex(puppy.sex) : "";
 const color = puppy.color ? titleCasePt(puppy.color) : "";
 const subject = [sex, color].filter(Boolean).join(" ").trim();
 const label = subject ? `${subject}` : "";
 return `Ideal para quem quer um Spitz Alemão Anão Lulu da Pomerânia${label ? ` ${label}` : ""} com orientação antes de reservar.`;
 }, [puppy]);

 return (
 <AccessibleModal
 open={open}
 onOpenChange={(o) => {
 if (!o) handleClose();
 }}
 title={modalTitle}
 description={locationLabel || undefined}
 restoreFocusRef={restoreFocusRef}
 size="xl"
 className="sm:max-w-[960px] xl:max-w-[1160px]"
 >
 <div className="relative z-0 flex flex-col">
 {isLoading ? (
 <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
 <Spinner size="xl" variant="brand" />
 <p className="text-sm font-semibold text-zinc-700">Carregando informacoes do filhote...</p>
 </div>
 ) : errorMessage ? (
 <div
 role="alert"
 className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-400 bg-rose-50 p-6 text-center text-sm text-rose-700"
 >
 <p>{errorMessage}</p>
 <button
 type="button"
 onClick={handleClose}
 className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
 >
 Fechar modal
 </button>
 </div>
 ) : puppy ? (
 <div className="space-y-10 lg:space-y-8">
 <div className="grid gap-8 lg:gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
 <div className="min-w-0 space-y-4 xl:sticky xl:top-6 xl:self-start">
 <div className="-mx-4 sm:mx-0">
 <PuppyGallery images={galleryMedia} postersByUrl={postersByUrl} name={puppy.name} />
 </div>
 </div>
 <div className="min-w-0 flex flex-col gap-5 lg:gap-4">
 {/* Bloco acima da dobra: Nome + Status + Preço + chip */}
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0">
 {chipLabel && (
 <div className="mt-2 inline-flex max-w-full items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
 <span className="truncate">{chipLabel}</span>
 </div>
 )}
 {locationLabel && <p className="mt-2 text-sm text-zinc-600">{locationLabel}</p>}
 </div>
 <div className="flex items-center gap-2">
 <StatusBadge status={resolveBadgeStatus(puppy.status)} />
 {shareablePuppy ? <ShareButton puppy={shareablePuppy} location="modal" className="h-10 w-10" /> : null}
 </div>
 </div>

 {forWhoText && (
 <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
 <h3 className="text-sm font-semibold text-zinc-900">Para quem é</h3>
 <p className="mt-2 text-sm text-zinc-700">{forWhoText}</p>
 </div>
 )}

 <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
 <h3 className="text-sm font-semibold text-zinc-900">Próximo passo</h3>
 <p className="mt-2 text-sm text-zinc-700">
 Converse primeiro; se fizer sentido, a reserva vem depois — sem pressão.
 </p>
 </div>

 <div className="space-y-2">
 <p className="text-sm font-medium text-zinc-600">Valor do filhote + o que inclui</p>
 <p className="text-3xl font-bold text-emerald-700">{priceLabel}</p>
 <ul className="mt-1 space-y-1 text-sm text-zinc-700">
 <li>Pedigree, contrato claro e garantia de saúde.</li>
 <li>Exames e orientação de socialização personalizada.</li>
 <li>Entrega segura e acompanhamento vitalício.</li>
 </ul>
 </div>

 <div className="space-y-4">
 <ContactCTA phone={WHATSAPP_NUMBER} waLink={whatsappLink} context={contactContext} />
 <Button
 type="button"
 variant="ghost"
 size="lg"
 className="w-full rounded-full"
 onClick={handleReserve}
 disabled={reserveSubmitting}
 aria-label={`${reserveLabel} (opcional) ${puppy.name}`}
 >
 {reserveSubmitting ? "Enviando..." : reserveLabel}
 </Button>
 <p className="text-xs text-zinc-500">WhatsApp é o caminho mais rápido. Reserva só depois.</p>
 </div>

 {/* Confiança (desktop) */}
 <div className="hidden lg:block rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
 <h3 className="text-sm font-semibold text-zinc-900">Confianca</h3>
 <ul className="mt-2 space-y-2 text-sm text-zinc-700">
 <li>Garantia de saude e orientacao completa.</li>
 <li>Reserva com acompanhamento e transparência.</li>
 <li>Entrega/retirada combinada com seguranca.</li>
 </ul>
 </div>

 {puppy.description && (
 <p className="text-sm leading-relaxed text-zinc-600">{puppy.description}</p>
 )}
 <PuppyDetails puppy={puppy} />
 </div>
 </div>

 </div>
 ) : (
 <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-sm text-zinc-500">
 <p>Filhote nao encontrado.</p>
 <button
 type="button"
 onClick={handleClose}
 className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
 >
 Voltar ao catalogo
 </button>
 </div>
 )}
 </div>
 </AccessibleModal>
 );
}

function translateSex(sex?: string | null): string {
 if (!sex) return "filhote";
 const normalized = sex.toLowerCase();
 if (normalized === "male" || normalized === "macho") return "macho";
 if (normalized === "female" || normalized === "femea") return "femea";
 return sex;
}

function translateSexLabel(sex?: string | null): string {
 const s = translateSex(sex);
 if (s === "macho") return "Macho";
 if (s === "femea") return "Femea";
 return titleCasePt(s);
}

function normalizeStatusForCtas(status?: string | null): "available" | "reserved" | "sold" | "pending" | "unavailable" {
 const normalized = (status ?? "available").toLowerCase();
 if (["pending", "em-breve", "coming-soon"].includes(normalized)) return "pending";
 if (["sold", "vendido"].includes(normalized)) return "sold";
 if (["reserved", "reservado"].includes(normalized)) return "reserved";
 if (["unavailable", "indisponivel"].includes(normalized)) return "unavailable";
 return "available";
}

function resolveBadgeStatus(
 status?: string | null
): 'disponivel' | 'available' | 'reservado' | 'reserved' | 'vendido' | 'sold' | 'em-breve' | 'coming-soon' {
 const normalized = (status ?? 'available').toLowerCase();
 if (['pending', 'em-breve', 'coming-soon'].includes(normalized)) return 'em-breve';
 if (['sold', 'vendido'].includes(normalized)) return 'sold';
 if (['reserved', 'reservado'].includes(normalized)) return 'reserved';
 if (['available', 'disponivel'].includes(normalized)) return 'available';
 if (['unavailable', 'indisponivel'].includes(normalized)) return 'em-breve';

 return 'available';
}
