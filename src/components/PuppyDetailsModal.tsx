"use client";

import { Camera, Copy, Loader2, MapPin, MessageCircle, PawPrint, Phone, ShieldCheck, Sparkles, Video } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import AccessibleModal from "@/components/ui/AccessibleModal";
import { ContentTOC } from "@/components/ui/ContentTOC";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import { RelatedLinks } from "@/components/ui/RelatedLinks";
import ShareButton from "@/components/ui/ShareButton";
import ShareCTA from "@/components/ui/ShareCTA";
import { TrustBlock } from "@/components/ui/TrustBlock";
import { BRAND, BUSINESS_RULES } from "@/domain/config";
import type { Puppy } from "@/domain/puppy";
import { formatPuppyMeta } from "@/domain/puppyMeta";
import { TaxonomyHelpers } from "@/domain/taxonomies";
import { saveLead } from "@/lib/data/supabase";
import type { ShareablePuppy } from "@/lib/sharePuppy";
import track from "@/lib/track";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Props = {
  id: string;
  onClose: () => void;
  restoreFocusRef?: RefObject<HTMLElement | null>;
};

type HeroStatus = { key: "available" | "reserved" | "sold"; label: string };
type PrimaryAction = { type: "video" | "list" | "reserve" | "sold"; label: string; disabled: boolean };

const COPY_DELAY = 2200;
const STATUS_MAP: Record<string, HeroStatus> = {
  available: { key: "available", label: "Disponível" },
  disponivel: { key: "available", label: "Disponível" },
  disponível: { key: "available", label: "Disponível" },
  reserved: { key: "reserved", label: "Reservado" },
  reservado: { key: "reserved", label: "Reservado" },
  sold: { key: "sold", label: "Vendido" },
  vendido: { key: "sold", label: "Vendido" },
};

const normalizeStatus = (value?: string | null): HeroStatus =>
  STATUS_MAP[String(value ?? "").trim().normalize("NFC").toLowerCase()] ?? STATUS_MAP.available;

const normalizeText = (input: string) =>
  input
    .normalize("NFC")
    .replace(/ç/g, "c")
    .replace(/ã/g, "a")
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i");

export default function PuppyDetailsModal({ id, onClose, restoreFocusRef }: Props) {
  const [puppy, setPuppy] = useState<Puppy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [reserveProcessing, setReserveProcessing] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [announceReserve, setAnnounceReserve] = useState("");
  const copyTimerRef = useRef<number | null>(null);
  const linkCopyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setActiveMediaIndex(0);
    setCopied(false);

    fetch(`/api/puppies/${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal })
      .then((res) => res.json().then((payload) => ({ status: res.status, body: payload })))
      .then(({ status, body }) => {
        if (!active) return;
        if (status >= 400) throw new Error(body?.error || `Erro ${status} ao carregar o filhote`);
        if (!body?.data) throw new Error("Filhote não encontrado");
        setPuppy(normalize(body.data) as Puppy);
      })
      .catch((err: Error) => {
        if (active) setError(err.message || "Erro ao carregar detalhes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    const copyTimer = copyTimerRef.current;
    const linkCopyTimer = linkCopyTimerRef.current;

    return () => {
      if (copyTimer) window.clearTimeout(copyTimer);
      if (linkCopyTimer) window.clearTimeout(linkCopyTimer);
    };
  }, []);

  // Fallback: if the puppy record has no images, try to fetch files from storage via API
  useEffect(() => {
    let active = true;
    if (!puppy || (puppy.images && puppy.images.length > 0)) return;

    fetch(`/api/puppies/${encodeURIComponent(id)}/media`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ status: res.status, body })))
      .then(({ status, body }) => {
        if (!active) return;
        if (status >= 400) return;
        const items: string[] = Array.isArray(body?.items) ? body.items : [];
        if (items.length > 0) {
          setPuppy((prev) => (prev ? { ...prev, images: items } : prev));
        }
      })
      .catch(() => {})
      .finally(() => {});

    return () => {
      active = false;
    };
  }, [puppy, id]);

  const mediaItems = useMemo(() => (puppy?.images ?? []) as string[], [puppy]);
  const heroHasImage = useMemo(() => mediaItems.some((item) => !isVideo(item)), [mediaItems]);
  const currentMediaItem = mediaItems[activeMediaIndex];
  const heroStatus = useMemo(() => normalizeStatus(puppy?.status), [puppy?.status]);
  const heroHighlights = useMemo(() => {
    if (!puppy) return [];
    return [
      {
        title: "Pedigree",
        detail: puppy.hasPedigree ? "Registro oficial incluso" : "Em processo de validação",
      },
      {
        title: "Socialização",
        detail: puppy.healthNotes ? "Cuidados guiados" : "Programa completo",
      },
      {
        title: "Suporte",
        detail: "Mentoria vitalícia e consultoria de chegada",
      },
    ];
  }, [puppy]);
  const locationLabel = useMemo(() => {
    if (!puppy) return "Bragança Paulista, SP";
    const cityLabel = puppy.city ? TaxonomyHelpers.getCityBySlug(String(puppy.city))?.name ?? String(puppy.city) : undefined;
    const location = [cityLabel, puppy.state].filter(Boolean).join(", ");
    return location || "Bragança Paulista, SP";
  }, [puppy]);

  const puppyMeta = useMemo(() => (puppy ? formatPuppyMeta(puppy) : null), [puppy]);
  const colorSexDescriptor = puppyMeta?.combinedLabel ?? "Cor e sexo sob consulta";

  const whatsappLink = useMemo(() => {
    if (!puppy) return BRAND.urls.whatsappLink;
    return buildWhatsAppLink({
      message: `Olá! Vi o filhote ${puppy.name} (${colorSexDescriptor}) e quero saber sobre disponibilidade e valor.`,
      utmSource: "site",
      utmMedium: "modal",
      utmCampaign: "puppy_detail",
      utmContent: puppy.slug ?? puppy.id,
    });
  }, [puppy, colorSexDescriptor]);

  const openWhatsApp = useCallback(() => {
    if (!whatsappLink) return;
    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  }, [whatsappLink]);

  const handleReserve = useCallback(async () => {
    if (reserveProcessing || reserved || !puppy?.id) return;
    setReserveProcessing(true);
    try {
      await saveLead({ puppy_id: puppy.id, channel: "modal-cta", note: "Reserva via modal" });
      setReserved(true);
      setAnnounceReserve("Reserva registrada com sucesso. Entraremos em contato em breve.");
    } catch {
      setAnnounceReserve("Não foi possível registrar a reserva agora. Tente novamente.");
    } finally {
      setReserveProcessing(false);
      setTimeout(() => setAnnounceReserve(""), 3500);
    }
  }, [puppy?.id, reserveProcessing, reserved]);

  const primaryAction = useMemo<PrimaryAction>(() => {
    if (!heroHasImage) return { type: "video", label: "Ver vídeo no WhatsApp", disabled: false };
    if (heroStatus.key === "reserved") return { type: "list", label: "Entrar na lista", disabled: false };
    if (heroStatus.key === "sold") return { type: "sold", label: "Indisponível", disabled: true };
    return {
      type: "reserve",
      label: reserveProcessing ? "Registrando..." : reserved ? "Reserva registrada" : "Quero reservar",
      disabled: reserveProcessing || reserved,
    };
  }, [heroHasImage, heroStatus.key, reserveProcessing, reserved]);

  const handlePrimaryAction = useCallback(() => {
    if (primaryAction.disabled) return;
    if (primaryAction.type === "reserve") {
      handleReserve();
      return;
    }
    openWhatsApp();
  }, [handleReserve, openWhatsApp, primaryAction]);

  const copyPhone = useCallback(() => {
    track.event?.("cta_click", { action: "copy_phone_modal", puppy_id: puppy?.id ?? id });
    if (navigator.clipboard) navigator.clipboard.writeText(BRAND.contact.phone).catch(() => {});
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), COPY_DELAY);
  }, [id, puppy?.id]);

  const tocItems = useMemo(() => {
    if (!puppy) return [];
    const items = [
      { title: "Sobre o filhote", href: "#sobre-filhote" },
      { title: "Ficha rápida", href: "#ficha-rapida" },
    ];
    if (puppy.healthNotes) items.push({ title: "Cuidados especiais", href: "#cuidados-especiais" });
    if (puppy.shippingNotes) items.push({ title: "Entrega & logística", href: "#entrega-logistica" });
    items.push({ title: "O que você recebe", href: "#o-que-voce-recebe" });
    return items;
  }, [puppy]);

  const relatedLinks = useMemo(() => {
    if (!puppy) return [];
    const baseDescription = `Conteúdo para acompanhar ${puppy.name}`;
    return [
      {
        label: "Guia completo para receber seu filhote",
        href: "/guia?source=modal",
        description: "Checklist seguro com consentimentos e token de download.",
      },
      {
        label: "Blog: Preparando o novo lar",
        href: "/blog?tag=preparacao",
        description: "Artigos reais sobre adaptação e cuidados.",
      },
      {
        label: "Catálogo completo",
        href: "/filhotes",
        description: baseDescription,
      },
    ];
  }, [puppy]);

const trustItems = useMemo(() => {
  if (!puppy) return [];
  const reservation = BUSINESS_RULES.reservation;
  const warranties = BUSINESS_RULES.warranties;
  const availableForShipping = Boolean(puppy.availableForShipping ?? true);
  return [
    {
        label: "Reserva segura",
        value: `${reservation.durationDays} dias`,
        meta: `Sinal de ${reservation.depositPercentage}%`,
      },
      {
        label: "Garantia de saúde",
        value: `${warranties.healthGuaranteeDays} dias`,
        meta: warranties.lifetimeSupport ? "Suporte vitalício" : "Suporte especializado",
      },
      {
        label: "Entrega assistida",
        value: availableForShipping ? "Envio nacional" : "Retirada em SP",
        meta: puppy.shippingNotes ? "Logística guiada" : "Coordenação concierge",
    },
  ];
}, [puppy]);

const shareablePuppy = useMemo<ShareablePuppy | null>(() => {
  if (!puppy) return null;
  return {
    id: puppy.id,
    slug: puppy.slug ?? undefined,
    name: puppy.name,
    color: puppy.color,
    sex: puppy.sex,
    city: puppy.city,
    state: puppy.state,
    priceCents: puppy.priceCents,
    status: puppy.status,
  };
}, [puppy]);

  return (
    <AccessibleModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={puppy?.name ?? "Detalhes do filhote"}
      description={heroStatus.label}
      size="lg"
      restoreFocusRef={restoreFocusRef}
    >
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-sm text-[var(--text-muted)]" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Carregando detalhes...
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert" aria-live="assertive">
            {process.env.NODE_ENV === "development" ? (
              <div>{error}</div>
            ) : (
              <div>
                Não foi possível carregar os detalhes. Tente novamente ou fale conosco pelo WhatsApp.
                <div className="mt-2">
                  <a href={BRAND.urls.whatsappLink} className="text-sm font-semibold text-[var(--brand)]">
                    Falar no WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
        {puppy && (
          <>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
            <div className="space-y-6">
              <section id="sobre-filhote" className="space-y-4">
                <figure className="relative aspect-[4/3] lg:aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--border)] bg-zinc-900 text-white shadow-xl">
                {heroHasImage && currentMediaItem ? (
                    isVideo(currentMediaItem) ? (
                      <video className="h-full w-full object-cover" controls aria-label={`Vídeo do filhote ${puppy.name}`} poster={mediaItems.find((m) => !isVideo(m))}>
                        <source src={currentMediaItem} />
                        <track kind="captions" srcLang="pt-BR" src={puppy.captionUrl ?? ""} />
                      </video>
                    ) : (
                      <Image src={currentMediaItem} alt={`Filhote ${puppy.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" priority />
                    )
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/60 to-black/95" />
                        <div className="relative z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
                          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Vídeo disponível</p>
                          <button
                            type="button"
                            onClick={openWhatsApp}
                            aria-label={`Abrir WhatsApp para ver vídeo do filhote ${puppy.name ?? ""}`}
                            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                          >
                            <Video className="h-4 w-4" aria-hidden />
                            Ver vídeo
                          </button>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/60" aria-hidden />
                <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">{heroStatus.label}</div>
                {heroHasImage && mediaItems.length > 0 && (
                  <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white">{`${activeMediaIndex + 1} / ${mediaItems.length}`}</div>
                )}
              </figure>


              {heroHighlights.length > 0 && (
                <section className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 text-sm text-[var(--text)] shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--text-muted)]">Resumo do filhote</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {heroHighlights.map((item) => (
                      <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-white/90 p-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
                        <p className="text-[10px] font-bold text-[var(--text)]">{item.title}</p>
                        <p className="mt-1 text-[12px] leading-snug text-[var(--text)]">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

                {mediaItems.length > 1 && (
                  <div className="flex gap-3 overflow-auto pb-2" aria-label="Galeria de fotos e vídeos">
                    {mediaItems.map((item, index) => {
                      const active = index === activeMediaIndex;
                      return (
                        <button
                          key={`${item}-${index}`}
                          type="button"
                          onClick={() => setActiveMediaIndex(index)}
                          className={`relative h-16 w-20 rounded-lg border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ${
                            active ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/40" : "border-[var(--border)]"
                          }`}
                          aria-label={isVideo(item) ? `Selecionar vídeo ${index + 1}` : `Selecionar imagem ${index + 1}`}
                        >
                          {isVideo(item) ? (
                            <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-[var(--brand-foreground)]">
                              <Video className="h-5 w-5" aria-hidden />
                            </div>
                          ) : (
                            <Image src={item} alt="" fill className="object-cover" sizes="96px" />
                          )}
                          <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                            {isVideo(item) ? "Vídeo" : "Foto"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {mediaItems.length > 0 && (
                  <section
                    aria-label="Lista completa de fotos e vídeos"
                    className="rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--text-muted)]">
                      Galeria completa
                    </h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {mediaItems.map((item, index) => {
                        const isActive = index === activeMediaIndex;
                        const label = isVideo(item) ? `Vídeo ${index + 1}` : `Foto ${index + 1}`;
                        return (
                          <button
                            key={`gallery-${index}`}
                            type="button"
                            onClick={() => setActiveMediaIndex(index)}
                            aria-pressed={isActive}
                            className={`group flex flex-col gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                              isActive
                                ? "border-[var(--brand)] bg-[var(--brand)]/5 ring-2 ring-[var(--brand)]/40"
                                : "border-[var(--border)] bg-white shadow-sm hover:border-[var(--brand)]"
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2`}
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100">
                              {isVideo(item) ? (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-black/40 to-black/70 text-white">
                                  <Video className="h-6 w-6" aria-hidden />
                                  <span className="ml-2 text-sm font-semibold">{label}</span>
                                </div>
                              ) : (
                                <Image src={item} alt={`Galeria ${label} de ${puppy.name}`} fill className="object-cover" />
                              )}
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
                              {label}
                            </span>
                            <span className="text-sm text-[var(--text)]">
                              {isActive ? "Selecionado" : "Clique para visualizar"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {puppy.description && (
                  <article className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                    <h3 className="text-sm font-semibold text-[var(--text)]">Sobre esse filhote</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{sanitizeDescription(puppy.description)}</p>
                  </article>
                )}
              </section>

              <section id="ficha-rapida" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm" aria-label="Ficha rápida do filhote">
                <h3 className="text-base font-semibold text-[var(--text)]">Ficha rápida</h3>
                <div className="mt-3 space-y-3 text-sm text-[var(--text-muted)]">
                  {puppy.priceCents != null && (
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-[var(--text)]">Investimento</p>
                      <span className="font-semibold text-[var(--text)]">{fmtPrice(puppy.priceCents)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[var(--text)]">Cor e sexo</p>
                    <span className="text-[var(--text)]">{colorSexDescriptor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[var(--text)]">Nascimento</p>
                    <span className="text-[var(--text)]">
                      {puppy.birthDate
                        ? new Date(puppy.birthDate).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "A confirmar"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text)]">
                    <MapPin className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                    <span>{locationLabel}</span>
                  </div>
                  {puppy.averageRating != null && (
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 text-amber-500" aria-hidden />
                      <span className="text-[var(--text)]">{Number(puppy.averageRating).toFixed(1)} ({puppy.reviewCount ?? 0} avaliações)</span>
                    </div>
                  )}
                </div>
              </section>

              {puppy.healthNotes && (
                <section id="cuidados-especiais" className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                  <h3 className="text-base font-semibold text-[var(--text)]">Cuidados especiais</h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{puppy.healthNotes}</p>
                </section>
              )}

              {puppy.shippingNotes && (
                <section id="entrega-logistica" className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                  <h3 className="text-base font-semibold text-[var(--text)]">Entrega & logística</h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{puppy.shippingNotes}</p>
                </section>
              )}

              <section id="o-que-voce-recebe" className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 text-sm text-[var(--text)] shadow-sm">
                <h3 className="text-base font-semibold text-[var(--text)]">O que você recebe</h3>
                <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--brand)]" aria-hidden />
                    Certificado digital, carteira de vacinação e orientação pós-venda.
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-[var(--brand)]" aria-hidden />
                    Socialização guiada e acompanhamento na adaptação.
                  </li>
                  <li className="flex items-start gap-2">
                    <Camera className="mt-0.5 h-4 w-4 text-[var(--brand)]" aria-hidden />
                    Chamadas de vídeo para ver o filhote antes de decidir.
                  </li>
                </ul>
              </section>
            </div>

            <aside className="hidden lg:block space-y-6 lg:sticky lg:top-6">
              <ContentTOC items={tocItems} label="Sumário do filhote" />

              <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Investimento</p>
                <div className="flex items-center justify-between text-sm text-[var(--text)]">
                  <span>Valor</span>
                  <strong className="text-base font-semibold text-[var(--text)]">{puppy.priceCents != null ? fmtPrice(puppy.priceCents) : "Sob consulta"}</strong>
                </div>
                <p className="text-sm text-zinc-600">Reserve com Pedigree e suporte completo.</p>
                {shareablePuppy && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <ShareCTA puppy={shareablePuppy} />
                      <div className="ml-2">
                        <ShareButton puppy={shareablePuppy} location="modal" />
                      </div>
                    </div>
                  </div>
                )}
                <PrimaryCTA
                  href={whatsappLink}
                  ariaLabel={`Falar sobre o filhote ${puppy.name}`}
                  icon={<MessageCircle className="h-4 w-4" aria-hidden />}
                  tracking={{ location: "modal", deviceMode: "modal", extra: { action: "whatsapp_modal", puppy_id: puppy.id ?? id } }}
                >
                  Falar no WhatsApp
                </PrimaryCTA>
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={primaryAction.disabled}
                  className={`w-full rounded-full px-5 py-3 text-sm font-semibold transition ${primaryAction.disabled ? "border border-zinc-200 bg-white text-zinc-400" : "border border-transparent bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--accent-hover)]"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]`}
                >
                  {primaryAction.label}
                </button>
                <button
                  type="button"
                  onClick={() => track.event?.("cta_click", { action: "call_modal", puppy_id: puppy.id ?? id })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  Ligar agora
                </button>
                <button
                  type="button"
                  onClick={copyPhone}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  Copiar telefone
                </button>
                <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
                  {copied ? "Número copiado" : "Enviar no WhatsApp ou ligar direto."}
                </p>
                <div className="sr-only" role="status" aria-live="polite">
                  {announceReserve}
                </div>
              </div>

            <TrustBlock
              title="Confiança comprovada"
              description="Processo desenhado para aquisição segura"
              items={trustItems}
            />

            <RelatedLinks links={relatedLinks} label="Links úteis" className="hidden lg:block" />
            </aside>
          </div>
            <div className="lg:hidden sticky bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)]">Investimento</p>
                <p className="text-base font-semibold text-[var(--text)]">{puppy.priceCents ? fmtPrice(puppy.priceCents) : "Sob consulta"}</p>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{locationLabel}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={primaryAction.disabled}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold ${
                  primaryAction.disabled
                    ? "border border-zinc-200 bg-white text-zinc-400"
                    : "border border-transparent bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--accent-hover)]"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]`}
                aria-label={`${primaryAction.type === "reserve" ? "Quero reservar" : "Abrir WhatsApp"} ${puppy.name}`}
              >
                {primaryAction.label}
              </button>
              <a
                href={whatsappLink}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text)] bg-white hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                aria-label={`WhatsApp ${puppy.name}`}
                onClick={() => track.event?.("cta_click", { action: "whatsapp_modal", puppy_id: puppy.id })}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </AccessibleModal>
  );
}

function fmtPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100);
}

function normalizeSex(value?: string | null) {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes("female") || normalized.includes("fêmea") || normalized.includes("femea")) return "female";
  if (normalized.includes("male") || normalized.includes("macho")) return "male";
  return undefined;
}

function sanitizeDescription(description?: string | null) {
  if (!description) return "";
  return description.replace(/\s{2,}/g, " ").trim();
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

function normalize(p: unknown): Partial<Puppy> {
  const obj = p as Record<string, unknown>;
  const name = (obj.nome as string) || (obj.name as string) || "Filhote";
  const rawPrice = (obj.price_cents as number) ?? (obj.priceCents as number) ?? Number(obj.preco as unknown) ?? 0;
  const priceCents = Number.isFinite(rawPrice) ? Math.round(rawPrice) : 0;
  const midia = (obj.midia as unknown) || (obj.images as unknown) || [];
  const images =
    Array.isArray(midia) && midia.length > 0
      ? (midia as unknown[])
          .map((item) => (typeof item === "string" ? item : ((item as Record<string, unknown>)?.url as string | undefined)))
          .filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url))
      : [];
  const rawStatus = normalizeText(String((obj.status as string) ?? "available")).toLowerCase();
  const normalizedStatus = rawStatus === "reservado" ? "reserved" : rawStatus === "vendido" ? "sold" : "available";
  const rawBirth = obj.nascimento ?? obj.birth_date ?? obj.birthDate;
  const birthDate = rawBirth ? new Date(String(rawBirth)) : new Date();

  const averageRating = Number.isFinite(Number(obj.aggregate_rating as unknown))
    ? Number(obj.aggregate_rating as unknown)
    : Number.isFinite(Number(obj.averageRating as unknown))
    ? Number(obj.averageRating as unknown)
    : undefined;

  const reviewCount = Number.isFinite(Number(obj.review_count as unknown))
    ? Number(obj.review_count as unknown)
    : Number.isFinite(Number(obj.reviewCount as unknown))
    ? Number(obj.reviewCount as unknown)
    : undefined;

  const captionUrl = (obj.caption_url as string) || (obj.captionUrl as string) || undefined;
  const colorCandidate = String((obj.cor as string) || (obj.color as string) || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  const color = TaxonomyHelpers.getColorBySlug(colorCandidate) ? (colorCandidate as any) : "creme";
  const cityCandidate = String((obj.city as string) || (obj.cidade as string) || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  const city = TaxonomyHelpers.getCityBySlug(cityCandidate) ? (cityCandidate as any) : "braganca-paulista";

  return {
    id: (obj.id as string) || (obj._id as string) || undefined,
    slug: (obj.slug as string) || undefined,
    name,
    description: (obj.descricao as string) || (obj.description as string) || "",
    priceCents,
    color,
    // Accept explicit 'female' or 'male', otherwise leave undefined
    sex: normalizeSex(obj.sexo as string) ?? normalizeSex(obj.sex as string),
    birthDate,
    city,
    state: ((obj.state as string) || (obj.estado as string) || "SP").toUpperCase(),
    status: normalizedStatus as Puppy["status"],
    averageRating,
    reviewCount,
    images,
    captionUrl,
    hasPedigree: Boolean(obj.hasPedigree ?? (obj.pedigree as unknown)),
    availableForShipping: (obj.available_for_shipping as boolean) ?? (obj.availableForShipping as boolean) ?? true,
    shippingNotes: (obj.shippingNotes as string) || (obj.shipping_notes as string) || "",
    currency: "BRL",
    breed: "Spitz Alemão Anão",
    size: "toy",
    source: "own-breeding",
    createdAt: new Date(),
    updatedAt: new Date(),
    vaccinationStatus: "up-to-date",
    viewCount: (obj.view_count as number) ?? 0,
    favoriteCount: (obj.favorite_count as number) ?? 0,
    shareCount: (obj.share_count as number) ?? 0,
    inquiryCount: (obj.inquiry_count as number) ?? 0,
  };
}
