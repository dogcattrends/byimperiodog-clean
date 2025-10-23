"use client";

import { CheckCircle, Heart, Shield, Stethoscope } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import type { ComponentType, SVGProps } from "react";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { trackWhatsAppClick } from "@/lib/events";
import { HERO_IMAGE_SIZES } from "@/lib/image-sizes";
import { WHATSAPP_LINK } from "@/lib/whatsapp";

type SvgIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

type SellingPoint = {
  icon: SvgIcon;
  title: string;
  description: string;
};

const SELLING_POINTS: SellingPoint[] = [
  {
    icon: Stethoscope,
    title: "Saúde validada",
    description: "Check-up veterinário completo, pedigree CBKC e histórico de exames disponíveis para cada Spitz Alemão Anão Lulu da Pomerânia.",
  },
  {
    icon: Heart,
    title: "Cuidado familiar",
    description: "Filhotes criados dentro de casa, socializados com crianças e rotina de enriquecimento ambiental."
  },
  {
    icon: Shield,
    title: "Transparência total",
    description: "Contrato digital, orientação financeira clara e acompanhamento direto da criadora em todas as etapas.",
  },
];

const TRUST_BADGES = [
  "Entrega humanizada em todo o Brasil",
  "Mentoria vitalícia pelo WhatsApp",
  "Planejamento de rotina e enxoval sob medida",
];

const METRICS = [
  { value: "10+", label: "anos com Spitz Alemão Anão Lulu da Pomerânia" },
  { value: "180+", label: "famílias acompanhadas" },
  { value: "24h", label: "suporte humano dedicado" },
];

export default function Hero() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia! Vamos escolher juntos o Spitz Alemão Anão Lulu da Pomerânia ideal para sua rotina.";
    if (hour < 18) return "Boa tarde! Temos filhotes socializados de Spitz Alemão Anão Lulu da Pomerânia aguardando por você.";
    return "Boa noite! Ainda dá tempo de receber orientação personalizada hoje.";
  }, []);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#faede0] via-[#f8f1ea] to-[#fffaf4] text-[var(--text)]"
      role="banner"
    >
      {/* Gradientes decorativos (CSS puro, sem JS) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(31,77,58,0.18),transparent_60%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-white/70 via-transparent to-transparent" aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:flex-row lg:items-stretch lg:gap-16 lg:pt-20 lg:pb-24">
        
        {/* ================================================================ */}
        {/* TEXTO PRIMEIRO (Critical render path - LCP optimization) */}
        {/* ================================================================ */}
        <div className="w-full max-w-3xl space-y-6 lg:flex-1 lg:space-y-8">
          <span className="inline-flex items-center gap-3 rounded-full border border-[var(--brand)]/30 bg-white/85 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--brand)]">
            Criação de Spitz Alemão Anão Lulu da Pomerânia
          </span>
          
          <div className="space-y-4">
            <h1 id="hero-heading" className="text-4xl font-bold leading-tight tracking-tight text-[var(--text)] sm:text-5xl lg:text-5xl">
              Receba seu Spitz Alemão Anão Lulu da Pomerânia com suporte estratégico da By Império Dog
            </h1>
            <p className="text-base leading-relaxed text-[var(--text-muted)] sm:text-lg" aria-live="polite">
              {greeting}
            </p>
            <p className="text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              Do primeiro contato à chegada em casa, guiamos cada passo com laudos atualizados, socialização carinhosa e mentoria direta pelo WhatsApp.
            </p>
          </div>

          {/* Selling Points */}
          <div className="grid gap-4 sm:grid-cols-2">
            {SELLING_POINTS.map((item) => (
              <article
                key={item.title}
                className="flex h-full items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm backdrop-blur transition-shadow duration-200 hover:shadow-md"
              >
                <item.icon className="mt-1 h-5 w-5 flex-none text-[var(--brand)]" aria-hidden="true" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{item.description}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Trust Badges */}
          <ul
            className="flex flex-col gap-3 text-sm text-[var(--text)] sm:flex-row sm:flex-wrap"
            aria-label="Compromissos"
          >
            {TRUST_BADGES.map((badge) => (
              <li
                key={badge}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <CheckCircle className="h-4 w-4 flex-none text-[var(--brand)]" aria-hidden="true" />
                <span>{badge}</span>
              </li>
            ))}
          </ul>

          {/* CTAs - Tap targets ≥48px */}
          <div className="flex w-full max-w-md flex-col gap-4 xs:flex-row">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('hero-cta', 'Falar com a criadora')}
              className={cn(
                buttonVariants({ variant: "solid", size: "lg" }),
                "min-h-[48px] w-full justify-center xs:flex-1 bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              )}
            >
              Falar com a criadora
            </a>
            <a
              href="#filhotes"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-[48px] w-full justify-center xs:flex-1 border-[var(--brand)] bg-white/70 text-[var(--brand)] transition-all duration-200 hover:bg-white/90 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              )}
            >
              Ver filhotes disponíveis
            </a>
          </div>

          {/* Metrics */}
          <dl
            className="mt-8 grid gap-4 text-left sm:grid-cols-3"
            aria-label="Resultados"
          >
            {METRICS.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">{metric.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-[var(--text)]">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ================================================================ */}
        {/* IMAGEM DEPOIS (Optimized LCP) */}
        {/* ================================================================ */}
        <div className="w-full max-w-xl flex-1 space-y-6">
          <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl lg:aspect-[16/10]">
            <Image
              src="/spitz-hero-desktop.webp"
              alt="Filhotes de Spitz Alemão Anão Lulu da Pomerânia saudáveis alinhados"
              fill
              priority
              fetchPriority="high"
              sizes={HERO_IMAGE_SIZES}
              className="object-cover"
              style={{ objectPosition: "50% 38%" }}
              draggable={false}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmMWVhIi8+PC9zdmc+"
            />
            <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-[var(--brand)] shadow-md backdrop-blur">
              Entrega segura em todo o Brasil
            </figcaption>
          </figure>

          {/* WhatsApp CTA Card - Mobile */}
          <div className="rounded-2xl border border-[var(--border)] bg-white/95 p-6 shadow-xl transition-shadow duration-200 hover:shadow-2xl lg:hidden">
            <p className="text-sm font-semibold text-[var(--text)]">Atendimento humano em tempo real</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Compartilhe vídeos do seu lar e receba orientação sobre rotina, enxoval e comportamento em minutos.
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('hero-secondary', 'Falar agora mobile')}
              className="mt-3 inline-flex min-h-[48px] items-center gap-2 text-sm font-semibold text-[var(--brand)] transition-colors hover:text-[var(--brand)]/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
            >
              <WAIcon size={16} className="h-4 w-4 flex-none" aria-hidden="true" />
              Falar agora
            </a>
          </div>

          {/* WhatsApp CTA Card - Desktop */}
          <div className="hidden rounded-2xl border border-[var(--border)] bg-white/95 p-6 shadow-xl transition-shadow duration-200 hover:shadow-2xl lg:block">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xs">
                <p className="text-sm font-semibold text-[var(--text)]">Atendimento humano em tempo real</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                  Compartilhe vídeos do seu lar e receba orientação sobre rotina, enxoval e comportamento em minutos.
                </p>
              </div>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick('hero-secondary', 'Falar agora desktop')}
                className="inline-flex min-h-[48px] items-center gap-2 text-sm font-semibold text-[var(--brand)] transition-colors hover:text-[var(--brand)]/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              >
                <WAIcon size={16} className="h-4 w-4 flex-none" aria-hidden="true" />
                Falar agora
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

