/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-element-to-interactive-role */

"use client";

import { ShieldCheck, Truck, Video } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import ErrorBoundary from "@/components/ErrorBoundary";
import type { Puppy } from "@/domain/puppy";
import { TaxonomyHelpers } from "@/domain/taxonomies";
import type { PuppyStatus } from "@/domain/taxonomies";
import { titleCasePt } from "@/lib/formatters";
import { getCoverMedia } from "@/lib/puppyMedia";
import type { CoverMedia } from "@/lib/puppyMedia";
import track from "@/lib/track";

const PuppyDetailsModal = dynamic(() => import("../PuppyDetailsModal"), {
 ssr: false,
 loading: () => null,
});

/**
 * Aceita status em inglês e também compat pt-BR caso o backend ainda envie assim.
 */
const STATUS_BADGES: Record<string, { label: string; tone: string }> = {
 available: { label: "Disponível", tone: "text-emerald-600 bg-emerald-100" },
 reserved: { label: "Reservado", tone: "text-amber-600 bg-amber-100" },
 sold: { label: "Indisponível", tone: "text-rose-600 bg-rose-100" },
 pending: { label: "Em preparação", tone: "text-zinc-700 bg-zinc-100" },
 unavailable: { label: "Indisponível", tone: "text-zinc-700 bg-zinc-100" },

 // compat pt-BR
 disponivel: { label: "Disponível", tone: "text-emerald-600 bg-emerald-100" },
 reservado: { label: "Reservado", tone: "text-amber-600 bg-amber-100" },
 vendido: { label: "Indisponível", tone: "text-rose-600 bg-rose-100" },
};

// use centralized `formatCentsToBRL` from `src/lib/price`

// ✅ Slugify pt-BR: remove acentos, normaliza espaços
function slugifyPt(input?: string | null) {
 const s = String(input ?? "").trim();
 if (!s) return "";
 return s
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "") // remove diacríticos
 .toLowerCase()
 .replace(/[^a-z0-9\s-]/g, "")
 .replace(/\s+/g, "-")
 .replace(/-+/g, "-")
 .replace(/^-|-$/g, "");
}

function getSexLabel(puppy: Puppy): string | null {
 const anyPuppy = puppy as any;

 const raw =
 (anyPuppy.gender as string | undefined) ??
 (anyPuppy.sexo as string | undefined) ??
 (anyPuppy.sex as string | undefined);

 if (!raw) return null;

 const v = String(raw).toLowerCase().trim();

 if (v === "male" || v === "m" || v === "macho") return "Macho";
 if (v === "female" || v === "f" || v === "femea" || v === "fêmea") return "Fêmea";

 // fallback: humaniza
 return v.charAt(0).toUpperCase() + v.slice(1);
}

/**
 * ✅ Regra: cor sempre com primeira letra maiúscula na cápsula.
 * - Tenta TaxonomyHelpers (quando o slug existir no catálogo)
 * - Fallback para TitleCase do próprio valor
 */
function getColorLabel(puppy: Puppy): string | null {
 const anyPuppy = puppy as any;
 const raw =
 (anyPuppy.color as string | undefined) ??
 (anyPuppy.cor as string | undefined) ??
 null;

 if (!raw) return null;

 const slug = slugifyPt(raw);
 const mapped = slug ? TaxonomyHelpers.getColorBySlug(slug as any)?.label : undefined;

 // mapped pode vir “Laranja”, raw pode vir “laranja-claro”
 const best = String(mapped ?? raw).trim();
 if (!best) return null;

 return titleCasePt(best);
}

type Props = {
 puppy?: Puppy | null;
};

export default function PuppyCatalogCard({ puppy }: Props) {
 const resolvedPuppy = useMemo(() => (puppy ?? ({} as Puppy)) as Puppy, [puppy]);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [toast] = useState<string | null>(null);
 const detailsButtonRef = useRef<HTMLButtonElement | null>(null);
 const videoRef = useRef<HTMLVideoElement | null>(null);

 const [coverMedia, setCoverMedia] = useState<CoverMedia>(() => getCoverMedia(resolvedPuppy));

 useEffect(() => {
 setCoverMedia(getCoverMedia(resolvedPuppy));
 }, [resolvedPuppy]);

 // Removed unused toast timer cleanup

 // status (aceita string)
 const rawStatus = (resolvedPuppy.status ?? "available") as PuppyStatus | string;
 const status = STATUS_BADGES[String(rawStatus)] ?? STATUS_BADGES.available;

 const anyPuppy = resolvedPuppy as any;

 const colorLabel = useMemo(() => getColorLabel(resolvedPuppy), [resolvedPuppy]);
 const sexLabel = useMemo(() => getSexLabel(resolvedPuppy), [resolvedPuppy]);

 const sizeLabel = useMemo(() => {
 const raw = (anyPuppy.size as string | undefined) ?? (anyPuppy.tamanho as string | undefined) ?? null;
 if (!raw) return null;
 return titleCasePt(String(raw).trim());
 }, [anyPuppy.size, anyPuppy.tamanho]);

 const uf = useMemo(() => {
 const raw = (anyPuppy.state as string | undefined) ?? (anyPuppy.uf as string | undefined) ?? null;
 if (!raw) return null;
 const v = String(raw).trim().toUpperCase();
 return v || null;
 }, [anyPuppy.state, anyPuppy.uf]);

 const microContext = useMemo(() => {
 return `${uf ? `${uf} • ` : ""}Entrega para todo Brasil`;
 }, [uf]);

 const cardTitle = useMemo(() => {
 const pieces = [sexLabel, colorLabel].filter(Boolean) as string[];
 if (pieces.length === 0) return "Spitz Alemão Anão Lulu da Pomerânia";
 return `Spitz Alemão Anão Lulu da Pomerânia – ${pieces.join(" ")}`;
 }, [sexLabel, colorLabel]);

 const primaryLabel = "Quero este filhote";

 // canonical path kept for modal navigation
 // canonical path not used here; modal handles navigation

 const getTrackingContext = useCallback(
 (extra?: Record<string, unknown>) => {
 const loc = typeof window !== "undefined" ? window.location : null;
 const search = loc ? new URLSearchParams(loc.search) : null;
 const deviceType =
 typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
 ? "mobile"
 : "desktop";

 return {
 slug: (anyPuppy.slug as string | undefined) ?? resolvedPuppy.id,
 puppy_id: resolvedPuppy.id,
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
 },
 [anyPuppy.slug, resolvedPuppy.id]
 );

 const openDetails = () => {
 if (!resolvedPuppy?.id) return;
 const payload = getTrackingContext({ placement: "catalog_card", action: "open_modal" });
 track.event?.("cta_click", { ...payload, type: "open_modal" });
 track.event?.("modal_open", payload);
 setIsModalOpen(true);
 };

 const handleCTA = (event?: MouseEvent<HTMLButtonElement>) => {
 event?.stopPropagation();
 const payload = getTrackingContext({ placement: "catalog_card", action: "quero_este_filhote" });
 track.event?.("cta_click", payload);
 openDetails();
 };

 // autoplay/pause somente para cover video
 useEffect(() => {
 if (coverMedia.kind !== "video") return;

 const video = videoRef.current;
 if (!video) return;

 const reduceMotion =
 typeof window !== "undefined" &&
 window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

 const saveData =
 typeof navigator !== "undefined" &&
 "connection" in navigator &&
 !!(navigator as any).connection?.saveData;

 const shouldAutoPlay = !reduceMotion && !saveData;

 const observer = new IntersectionObserver(
 (entries) => {
 const entry = entries[0];
 if (!entry) return;

 if (entry.intersectionRatio >= 0.6 && shouldAutoPlay) {
 video.play().catch(() => {});
 return;
 }

 video.pause();
 video.currentTime = 0;
 },
 { threshold: [0.6] }
 );

 observer.observe(video);

 return () => {
 observer.disconnect();
 video.pause();
 video.currentTime = 0;
 };
 }, [coverMedia]);

 const displayName =
 (anyPuppy.name as string | undefined) ??
 (anyPuppy.nome as string | undefined) ??
 "Filhote";

 return (
 <>
 <article
 className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl transition hover:-translate-y-[0.8px] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
 aria-label={`Filhote ${status?.label ?? "Disponível"}`}
 >
 {/* CAPA */}
 <div className="relative">
 <div className="relative w-full h-[210px] sm:h-[240px] md:h-[280px] overflow-hidden rounded-t-3xl bg-zinc-50">
 {coverMedia.kind === "video" ? (
 <video
 ref={videoRef}
 src={coverMedia.url}
 poster={coverMedia.poster}
 className="h-full w-full object-cover"
 muted
 loop
 playsInline
 preload="none"
 aria-label={`Vídeo do filhote ${displayName}`}
 />
 ) : coverMedia.kind === "image" ? (
 <Image
 src={coverMedia.url}
 alt={`${displayName} — filhote de Spitz Alemão Anão Lulu da Pomerânia`}
 fill
 sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
 className="object-cover object-center transition duration-500 group-hover:scale-105"
 priority={false}
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center px-6 py-5 text-white">
 <p className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold">Foto em atualização</p>
 </div>
 )}

 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60" aria-hidden />

 <div className={`absolute left-3 top-3 flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${status?.tone ?? "text-emerald-600 bg-emerald-100"}`}>
     {status?.label === "Disponível" && (
         <ShieldCheck className="w-4 h-4 text-emerald-600" aria-label="Disponível" />
     )}
     {status?.label === "Reservado" && (
         <Truck className="w-4 h-4 text-amber-600" aria-label="Reservado" />
     )}
     {status?.label === "Indisponível" && (
         <Video className="w-4 h-4 text-rose-600" aria-label="Indisponível" />
     )}
     <span>{status?.label ?? "Disponível"}</span>
 </div>

 {/* Preço removido do card (consultivo premium) */}
 </div>
 </div>

 {/* CONTEÚDO */}
 <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
 <div>
            <h3 className="text-base md:text-lg font-semibold text-zinc-900 truncate max-w-xs md:max-w-full">{cardTitle}</h3>
 <p className="mt-1 text-xs font-semibold text-zinc-500">{microContext}</p>
 </div>

 {/* ✅ CHIPS (sexo/cor/tamanho) */}
 <div className="flex flex-wrap gap-2">
 {sexLabel && (
     <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 inline-flex items-center gap-1">
         {sexLabel === "Macho" ? (
             <span aria-label="Macho" className="text-blue-600">♂</span>
         ) : sexLabel === "Fêmea" ? (
             <span aria-label="Fêmea" className="text-pink-600">♀</span>
         ) : null}
         {sexLabel}
     </span>
 )}
 {colorLabel && (
 <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600">{colorLabel}</span>
 )}
 {sizeLabel && (
 <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600">{sizeLabel}</span>
 )}
 {!sexLabel && !colorLabel && !sizeLabel && (
 <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">—</span>
 )}
 </div>

 {/* SELINHOS (confiança) */}
 <div className="flex flex-wrap gap-3 text-xs font-semibold text-zinc-700">
 <span className="inline-flex items-center gap-1 rounded-2xl bg-zinc-100 px-3 py-1">
 <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
 Pedigree
 </span>
 <span className="inline-flex items-center gap-1 rounded-2xl bg-zinc-100 px-3 py-1">
 <Video className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
 Vídeo
 </span>
 <span className="inline-flex items-center gap-1 rounded-2xl bg-zinc-100 px-3 py-1">
 <Truck className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
 Entrega segura
 </span>
 </div>

 {/* CTA única consultiva */}
 <div className="mt-auto flex flex-wrap gap-3">
 <button
 ref={detailsButtonRef}
 type="button"
 onClick={handleCTA}
 aria-label={`Quero este filhote — ${displayName}`}
 className="flex-1 min-w-[160px] rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
 >
 {primaryLabel}
 </button>
 </div>

 {toast && <p className="mt-2 text-xs font-semibold text-emerald-600">{toast}</p>}
 </div>
 </article>

 {isModalOpen && (
 <>
 {/* Wrap modal in an ErrorBoundary to avoid app crash on render errors */}
 <ErrorBoundary>
 <PuppyDetailsModal id={resolvedPuppy.id} onClose={() => setIsModalOpen(false)} restoreFocusRef={detailsButtonRef} />
 </ErrorBoundary>
 </>
 )}
 </>
 );
}
