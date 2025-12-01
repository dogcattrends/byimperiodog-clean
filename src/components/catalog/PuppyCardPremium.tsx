"use client";

/**
 * PuppyCardPremium v4
 * - Texto em PT-BR corrigido
 * - Layout estável (aspect ratio, clamp, CTA legível)
 * - Acessibilidade e JSON-LD mantidos
 * - CTA único em <a> (evita foco duplo)
 */

import { Calendar, ChevronRight, Heart, MapPin, Play, Video, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, CardHeader, StatusBadge } from "@/components/ui";
import { optimizePuppyCardImage } from "@/lib/optimize-image";
import { getNextImageProps } from "@/lib/images";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import track from "@/lib/track";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type PuppyCardData = {
  id: string;
  slug?: string | null;
  nome?: string | null;
  name?: string | null;
  cor?: string | null;
  color?: string | null;
  gender?: "male" | "female" | string | null;
  sexo?: string | null;
  sex?: "male" | "female" | string | null;
  status?: "disponivel" | "reservado" | "vendido" | "available" | "reserved" | "sold" | string | null;
  price_cents?: number | null;
  priceCents?: number | null;
  nascimento?: string | null;
  birthDate?: string | Date | null;
  city?: string | null;
  state?: string | null;
};

type PuppyCardProps = {
  puppy: PuppyCardData;
  coverImage?: string;
  onOpenDetails?: () => void;
  priority?: boolean;
};

const formatPrice = (cents?: number | null) =>
  typeof cents === "number" && cents > 0
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100)
    : "Sob consulta";

function calculateAge(birthDate?: string | Date | null): string {
  if (!birthDate) return "Idade a confirmar";
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return "Idade a confirmar";
  const diffDays = Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Nasce ${birth.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
  if (diffDays < 30) return `${diffDays} dias`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? "ano" : "anos"}`;
}

function formatBirthDate(birthDate?: string | Date | null): string {
  if (!birthDate) return "Data a confirmar";
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return "Data a confirmar";
  return birth.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const normalizeGender = (gender?: string | null): "Macho" | "Fêmea" | "A definir" => {
  const v = (gender || "").toLowerCase();
  if (v === "male" || v === "macho") return "Macho";
  if (v === "female" || v === "femea" || v === "fêmea") return "Fêmea";
  return "A definir";
};

const colorHex = (name?: string | null) => {
  const v = (name || "").toLowerCase().trim();
  const map: Record<string, string> = {
    branco: "#FFFFFF",
    white: "#FFFFFF",
    preto: "#1A1A1A",
    black: "#1A1A1A",
    creme: "#F5E6D3",
    cream: "#F5E6D3",
    laranja: "#FF8C42",
    orange: "#FF8C42",
    cinza: "#9CA3AF",
    gray: "#9CA3AF",
    grey: "#9CA3AF",
    marrom: "#8B4513",
    brown: "#8B4513",
    chocolate: "#7B3F00",
    caramelo: "#D2691E",
  };
  return map[v] || "#F59E0B";
};

const colorBorder = (name?: string | null) => (["branco", "white", "creme", "cream"].includes((name || "").toLowerCase()) ? "#94A3B8" : "#D4D4D8");

const normalizeStatus = (status?: string | null) => {
  const v = (status || "disponivel").toLowerCase();
  if (v === "vendido" || v === "sold") return { label: "Vendido", color: "text-rose-800", bgColor: "bg-rose-100" };
  if (v === "reservado" || v === "reserved") return { label: "Reservado", color: "text-amber-800", bgColor: "bg-amber-100" };
  return { label: "Disponível", color: "text-emerald-800", bgColor: "bg-emerald-100" };
};

export default function PuppyCardPremium({ puppy, coverImage, onOpenDetails, priority = false }: PuppyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [ctaState, setCtaState] = useState<"idle" | "loading">("idle");

  const name = puppy.nome || puppy.name || "Filhote Spitz Alemão Anão";
  const color = puppy.cor || puppy.color || "Cor em avaliação";
  const gender = normalizeGender(puppy.sexo || puppy.sex || puppy.gender);
  const price = formatPrice(puppy.priceCents ?? puppy.price_cents);
  const priceCents = puppy.priceCents ?? puppy.price_cents ?? 0;
  const birthRaw = puppy.nascimento || puppy.birthDate;
  const age = calculateAge(birthRaw);
  const birthDateFormatted = formatBirthDate(birthRaw);
  const status = normalizeStatus(puppy.status);
  const location = [puppy.city, puppy.state].filter(Boolean).join(", ") || "Bragança Paulista, SP";
  const chipColor = colorHex(color);
  const chipBorder = colorBorder(color);

  const optimizedImage = useMemo(() => (coverImage ? optimizePuppyCardImage(coverImage) : null), [coverImage]);
  const processedImageProps = useMemo(() => {
    // Usa pipeline quando não há coverImage manual
    if (!coverImage && (puppy as any).slug) {
      try {
        return getNextImageProps((puppy as any).slug as string, "card", { priority });
      } catch {
        return null;
      }
    }
    return null;
  }, [coverImage, (puppy as any).slug, priority]);

  const whatsappLinks = useMemo(
    () => ({
      main: buildWhatsAppLink({
        message: `Olá! Vi o filhote ${name} (${color}, ${gender}) e quero mais informações sobre disponibilidade e condições.`,
        utmSource: "site",
        utmMedium: "catalog_card",
        utmCampaign: "puppies_premium",
        utmContent: "cta_main",
      }),
    }),
    [name, color, gender]
  );

  const handleCTA = useCallback(() => {
    setCtaState("loading");
    track.event("puppy_cta_click", { id: puppy.id, name, price_cents: priceCents, status: status.label });
    setTimeout(() => setCtaState("idle"), 400);
  }, [puppy.id, name, priceCents, status.label]);

  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description: `Filhote de Spitz Alemão Anão ${color} ${gender} disponível para adoção responsável`,
      image: optimizedImage || coverImage,
      brand: { "@type": "Brand", name: "By Império Dog" },
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: priceCents / 100,
        availability:
          status.label === "Disponível"
            ? "https://schema.org/InStock"
            : status.label === "Reservado"
              ? "https://schema.org/PreOrder"
              : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    }),
    [name, color, gender, optimizedImage, coverImage, priceCents, status.label]
  );

  return (
    <Card variant="elevated" interactive className="group h-full overflow-hidden rounded-3xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <CardHeader noPadding>
        <div className="relative w-full overflow-hidden">
          <div className="aspect-[4/3] w-full">
            {processedImageProps ? (
              <Image
                {...processedImageProps}
                alt={`Filhote ${name}`}
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover w-full h-full"
              />
            ) : optimizedImage || coverImage ? (
              <Image
                src={optimizedImage || coverImage!}
                alt={`Filhote ${name}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[var(--surface-2)] text-sm text-[var(--text-muted)]">Sem imagem</div>
            )}
          </div>

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <StatusBadge status={puppy.status as any} />
            <Badge variant="neutral" size="sm" className="bg-white/90 shadow-sm">
              {price}
            </Badge>
          </div>

          <button
            type="button"
            onClick={() => setIsLiked((v) => !v)}
            aria-pressed={isLiked}
            aria-label={isLiked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-rose-500 shadow-sm ring-1 ring-[var(--border)] transition hover:bg-white"
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-rose-500" : ""}`} aria-hidden />
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">By Império Dog</p>
          <h3 className="text-xl font-semibold leading-snug text-[var(--text)] line-clamp-3">{name}</h3>
          <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span
              className="inline-flex h-3 w-3 items-center justify-center rounded-full border"
              style={{ backgroundColor: chipColor, borderColor: chipBorder }}
              aria-hidden
            />
            <span className="capitalize">{color}</span>
            <span aria-hidden>•</span>
            <span>{gender}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text)]">
          <div className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 shadow-xs">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Calendar className="h-4 w-4" aria-hidden />
              <span>Nascimento</span>
            </div>
            <p className="mt-1 font-semibold">{birthDateFormatted}</p>
            <p className="text-[var(--text-muted)]">{age}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 shadow-xs">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <MapPin className="h-4 w-4" aria-hidden />
              <span>Local</span>
            </div>
            <p className="mt-1 font-semibold capitalize">{location}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Entrega combinada</p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[var(--border)]">
              <Play className="h-4 w-4" aria-hidden /> Vídeo ao vivo
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[var(--border)]">
              <Video className="h-4 w-4" aria-hidden /> Mentoria vitalícia
            </span>
          </div>

          <a
            href={whatsappLinks.main}
            target="_blank"
            rel="noreferrer"
            onClick={handleCTA}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 px-5 py-3 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label={`Quero falar no WhatsApp sobre o filhote ${name}`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            <span>{ctaState === "loading" ? "Abrindo WhatsApp..." : "Falar no WhatsApp"}</span>
          </a>

          <Button
            type="button"
            onClick={onOpenDetails}
            variant="subtle"
            className="justify-between text-sm"
            aria-label={`Ver detalhes completos do filhote ${name}`}
          >
            <span className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" aria-hidden /> Ver detalhes e condições
            </span>
            <span className="text-[var(--text-muted)]">{price}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
