"use client";

import { Camera, Copy, Loader2, MapPin, MessageCircle, PawPrint, Phone, ShieldCheck, Sparkles, Video } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import AccessibleModal from "@/components/ui/AccessibleModal";
import PrimaryCTA from "@/components/ui/PrimaryCTA";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { ContentTOC } from "@/components/ui/ContentTOC";
import { RelatedLinks } from "@/components/ui/RelatedLinks";
import { TrustBlock } from "@/components/ui/TrustBlock";
import type { Puppy } from "@/domain/puppy";
import { BRAND, BUSINESS_RULES } from "@/domain/config";
import { supabasePublic } from "@/lib/supabasePublic";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import track from "@/lib/track";

type Props = {
  id: string;
  onClose: () => void;
  restoreFocusRef?: RefObject<HTMLElement | null>;
};

const copyDelay = 2200;

export default function PuppyDetailsModal({ id, onClose, restoreFocusRef }: Props) {
  const [puppy, setPuppy] = useState<Puppy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setActiveMediaIndex(0);
    setCopied(false);

    (async () => {
      try {
        const { data, error } = await supabasePublic()
          .from("puppies")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (!active) return;
        if (error) throw error;
        if (!data) throw new Error("Filhote não encontrado.");
        setPuppy(normalize(data));
      } catch (e) {
        if (active) setError((e as Error)?.message ?? "Erro ao carregar detalhes.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const phoneDigits = BRAND.contact.phone.replace(/[^\d+]/g, "");
  const phoneLink = useMemo(() => `tel:${phoneDigits}`, [phoneDigits]);

  const mediaItems = useMemo(() => puppy?.images ?? [], [puppy]);
  const locationLabel = useMemo(() => {
    if (!puppy) return "Bragança Paulista, SP";
    const location = [puppy.city, puppy.state].filter(Boolean).join(", ");
    return location || "Bragança Paulista, SP";
  }, [puppy]);

  const whatsappLink = useMemo(() => {
    if (!puppy) return BRAND.urls.whatsappLink;
    return buildWhatsAppLink({
      message: `Olá! Vi o filhote ${puppy.name} (${puppy.color}, ${translateSex(puppy.sex)}) e quero saber sobre disponibilidade e valor.`,
      utmSource: "site",
      utmMedium: "modal",
      utmCampaign: "puppy_detail",
      utmContent: puppy.slug ?? puppy.id,
    });
  }, [puppy]);

  const tocItems = useMemo(() => {
    if (!puppy) return [];
    const items = [
      { title: "Sobre o filhote", href: "#sobre-filhote" },
      { title: "Ficha rápida", href: "#ficha-rapida" },
    ];
    if (puppy.healthNotes) {
      items.push({ title: "Cuidados especiais", href: "#cuidados-especiais" });
    }
    if (puppy.shippingNotes) {
      items.push({ title: "Entrega e logística", href: "#entrega-logistica" });
    }
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
        meta: puppy.shippingNotes ? "Logística guiada" : "Coordenação com concierge",
      },
    ];
  }, [puppy]);

  const handleCopyPhone = useCallback(() => {
    track.event?.("cta_click", {
      action: "copy_phone_modal",
      puppy_id: puppy?.id ?? id,
    });
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(BRAND.contact.phone).catch(() => {});
    }
    setCopied(true);
    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => setCopied(false), copyDelay);
  }, [id, puppy?.id]);

  return (
    <AccessibleModal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={puppy?.name ?? "Detalhes do filhote"}
      description={translateStatus(puppy?.status)}
      size="lg"
      restoreFocusRef={restoreFocusRef}
    >
      <div className="space-y-6">
        {loading && (
          <div
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-sm text-[var(--text-muted)]"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Carregando detalhes...
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        {puppy && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
            <div className="space-y-6">
              <section id="sobre-filhote" className="space-y-4">
                <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border)] bg-zinc-50">
                  {mediaItems[activeMediaIndex] ? (
                    isVideo(mediaItems[activeMediaIndex]) ? (
                      <video
                        className="h-full w-full object-cover"
                        controls
                        aria-label={`Vídeo do filhote ${puppy.name}`}
                        poster={mediaItems.find((m) => !isVideo(m))}
                      >
                        <source src={mediaItems[activeMediaIndex]} />
                      </video>
                    ) : (
                      <Image
                        src={mediaItems[activeMediaIndex]}
                        alt={`Filhote ${puppy.name}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 640px"
                        priority
                      />
                    )
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-zinc-500">Sem imagem</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/0 to-black/50" aria-hidden />
                  <div className="absolute left-4 top-4 rounded-full border border-white/60 bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                    {puppy.status ? translateStatus(puppy.status) : "Disponível"}
                  </div>
                </figure>

                {mediaItems.length > 1 && (
                  <div className="flex gap-3 overflow-auto pb-2" aria-label="Galeria de fotos e vídeos">
                    {mediaItems.map((item, index) => {
                      const active = index === activeMediaIndex;
                      return (
                        <button
                          key={`${item}-${index}`}
                          type="button"
                          onClick={() => setActiveMediaIndex(index)}
                          className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ${
                            active ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/40" : "border-[var(--border)]"
                          }`}
                          aria-label={isVideo(item) ? `Selecionar vídeo ${index + 1}` : `Selecionar imagem ${index + 1}`}
                          aria-pressed={active}
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

                {puppy.description && (
                  <article className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
                    <h3 className="text-sm font-semibold text-[var(--text)]">Sobre esse filhote</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{puppy.description}</p>
                  </article>
                )}
              </section>

              <section
                id="ficha-rapida"
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                aria-label="Ficha rápida do filhote"
              >
                <h3 className="text-base font-semibold text-[var(--text)]">Ficha rápida</h3>
                <div className="mt-3 space-y-3 text-sm text-[var(--text-muted)]">
                  {puppy.priceCents != null && (
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-[var(--text)]">Investimento</p>
                      <span className="font-semibold text-[var(--text)]">{fmtPrice(puppy.priceCents)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[var(--text)]">Cor</p>
                    <span className="text-[var(--text)]">{puppy.color}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[var(--text)]">Sexo</p>
                    <span className="text-[var(--text)]">{translateSex(puppy.sex)}</span>
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
                  {puppy.aggregate_rating != null && (
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 text-amber-500" aria-hidden />
                      <span className="text-[var(--text)]">
                        {puppy.aggregate_rating.toFixed(1)} ({puppy.review_count ?? 0} avaliações)
                      </span>
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

              <section
                id="o-que-voce-recebe"
                className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 text-sm text-[var(--text)] shadow-sm"
              >
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

            <aside className="space-y-6">
              <ContentTOC items={tocItems} label="Sumário do filhote" />

              <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  Contato premium
                </p>
                <div className="space-y-3">
                  <ContactCTA
                    href={whatsappLink}
                    label="Falar no WhatsApp"
                    ariaLabel={`Falar sobre o filhote ${puppy.name}`}
                    icon={<MessageCircle className="h-4 w-4" aria-hidden />}
                    onClick={() =>
                      track.event?.("cta_click", { action: "whatsapp_modal", puppy_id: puppy.id ?? id })
                    }
                  />
                  <PrimaryCTA
                    href={phoneLink}
                    variant="ghost"
                    icon={<Phone className="h-4 w-4" aria-hidden />}
                    onClick={() => track.event?.("cta_click", { action: "call_modal", puppy_id: puppy.id ?? id })}
                  >
                    Ligar agora
                  </PrimaryCTA>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                    Copiar telefone
                  </button>
                  <p className="text-xs text-[var(--text-muted)]" aria-live="polite">
                    {copied ? "Número copiado!" : "Enviar no WhatsApp ou ligar direto."}
                  </p>
                </div>
              </div>

              <TrustBlock
                title="Confiança comprovada"
                description="Processo desenhado para adoção segura"
                items={trustItems}
              />

              <RelatedLinks links={relatedLinks} label="Links úteis" />
            </aside>
          </div>
        )}
      </div>
    </AccessibleModal>
  );
}

function fmtPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

function translateSex(sex?: string | null) {
  if (!sex) return "Sexo não informado";
  if (sex.toLowerCase() === "male") return "Macho";
  if (sex.toLowerCase() === "female") return "Fêmea";
  return sex;
}

function translateStatus(status?: string | null) {
  if (!status) return "Disponível";
  if (status.toLowerCase() === "reservado") return "Reservado";
  if (status.toLowerCase() === "vendido") return "Vendido";
  return status;
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

function normalize(p: any): Puppy {
  const name = p.nome || p.name || "Filhote";
  const rawPrice = p.price_cents ?? p.priceCents ?? p.preco ?? 0;
  const priceCents = Number.isFinite(rawPrice) ? Math.round(rawPrice) : 0;
  const midia = p.midia || p.images || [];
  const images =
    Array.isArray(midia) && midia.length > 0
      ? midia
          .map((item: any) => (typeof item === "string" ? item : item?.url))
          .filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url))
      : [];
  const rawStatus = (p.status ?? "available").toString().toLowerCase();
  const normalizedStatus = rawStatus === "reservado" ? "reserved" : rawStatus === "vendido" ? "sold" : "available";
  const rawBirth = p.nascimento ?? p.birth_date ?? p.birthDate;
  const birthDate = rawBirth ? new Date(rawBirth) : new Date();

  return {
    id: p.id,
    slug: p.slug,
    name,
    description: p.descricao || p.description || "",
    priceCents,
    color: p.cor || p.color || "Creme",
    sex: p.sexo === "female" || p.sex === "female" ? "female" : "male",
    birthDate,
    city: p.city || p.cidade || "Bragança Paulista",
    state: p.state || p.estado || "SP",
    status: normalizedStatus as Puppy["status"],
    aggregate_rating: Number.isFinite(p.aggregate_rating) ? Number(p.aggregate_rating) : undefined,
    review_count: Number.isFinite(p.review_count) ? Number(p.review_count) : undefined,
    images,
    hasPedigree: Boolean(p.hasPedigree ?? p.pedigree),
    availableForShipping: p.available_for_shipping ?? p.availableForShipping ?? true,
    shippingNotes: p.shippingNotes ?? p.shipping_notes ?? "",
    currency: "BRL",
    breed: "Spitz Alemão Anão",
    size: "toy",
    source: "own-breeding",
    createdAt: new Date(),
    updatedAt: new Date(),
    vaccinationStatus: "up-to-date",
    viewCount: p.view_count ?? 0,
    favoriteCount: p.favorite_count ?? 0,
    shareCount: p.share_count ?? 0,
    inquiryCount: p.inquiry_count ?? 0,
  } as Puppy;
}
