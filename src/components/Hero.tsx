"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle, Heart, Shield, Stethoscope } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, SVGProps } from "react";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface ParticlesEngine {}
interface ParticlesProps {
  init: (engine: ParticlesEngine) => Promise<void>;
  className?: string;
  options?: unknown;
}
type ParticlesComponent = React.ComponentType<ParticlesProps>;
let ParticlesCmp: ParticlesComponent | null = null;
async function ensureParticles() {
  if (!ParticlesCmp) {
    const mod = await import("react-tsparticles");
    ParticlesCmp = (mod as any).default || (mod as any);
  }
  return ParticlesCmp;
}
async function loadSlimEngine(engine: ParticlesEngine) {
  const slim: any = await import("tsparticles-slim");
  await slim.loadSlim(engine as any);
}

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
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [showFx, setShowFx] = useState(false);
  const hostRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          const schedule = (cb: () => void) =>
            (window as any).requestIdleCallback
              ? (window as any).requestIdleCallback(cb, { timeout: 1200 })
              : setTimeout(cb, 120);

          schedule(async () => {
            try {
              await ensureParticles();
              setShowFx(true);
            } catch {
              /* ignore */
            }
          });

          io.disconnect();
        }
      },
      { rootMargin: "0px 0px 200px 0px", threshold: 0.1 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [prefersReducedMotion]);

  const particlesInit = useCallback(async (engine: ParticlesEngine) => {
    await loadSlimEngine(engine);
  }, []);

  const waHref = useMemo(() => {
    const trimmed = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
    if (trimmed) return `https://wa.me/${trimmed}`;
    return process.env.NEXT_PUBLIC_WA_LINK ?? "#";
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia! Vamos escolher juntos o Spitz Alemão Anão Lulu da Pomerânia ideal para sua rotina.";
    if (hour < 18) return "Boa tarde! Temos filhotes socializados de Spitz Alemão Anão Lulu da Pomerânia aguardando por você.";
    return "Boa noite! Ainda dá tempo de receber orientação personalizada hoje.";
  }, []);

  const variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
    show: { opacity: 1, y: 0 },
  };

  const metricsVariant = {
    hidden: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.98 },
    show: { opacity: 1, scale: 1 },
  };

  const animateState = mounted ? "show" : "hidden";

  return (
    <section
      ref={hostRef}
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#faede0] via-[#f8f1ea] to-[#fffaf4] text-[var(--text)]"
      role="banner"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(31,77,58,0.18),transparent_60%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-white/70 via-transparent to-transparent" aria-hidden />
      {showFx && !prefersReducedMotion && ParticlesCmp && (
        <ParticlesCmp
          init={particlesInit}
          className="absolute inset-0 -z-10"
          options={{
            fullScreen: false,
            background: { color: "transparent" },
            fpsLimit: 60,
            particles: {
              color: { value: "#f3b562" },
              number: { value: 18 },
              opacity: { value: 0.18 },
              size: { value: { min: 1, max: 2.5 } },
              move: { enable: true, speed: 0.35, direction: "top", outModes: { default: "out" } },
            },
            detectRetina: true,
          }}
        />
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-16 px-5 pt-20 pb-28 sm:px-8 lg:flex-row lg:items-stretch lg:pt-24">
        <motion.div
          initial="hidden"
          animate={animateState}
          variants={variants}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="w-full max-w-3xl space-y-8 lg:flex-1"
        >
          <span className="inline-flex items-center gap-3 rounded-full border border-[var(--brand)]/30 bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--brand)]">
            Criação boutique de Spitz Alemão Anão Lulu da Pomerânia
          </span>
          <div className="space-y-4">
            <h1 id="hero-heading" className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
              Receba seu Spitz Alemão Anão Lulu da Pomerânia com suporte estratégico da By Império Dog
            </h1>
            <p className="text-base text-[var(--text-muted)] sm:text-lg" aria-live="polite">
              {greeting}
            </p>
            <p className="text-base text-[var(--text-muted)] sm:text-lg">
              Do primeiro contato à chegada em casa, guiamos cada passo com laudos atualizados, socialização carinhosa e mentoria direta pelo WhatsApp.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {SELLING_POINTS.map((item) => (
              <motion.article
                key={item.title}
                initial="hidden"
                animate={animateState}
                variants={variants}
                transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
                className="flex h-full items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm backdrop-blur"
              >
                <item.icon className="mt-1 h-5 w-5 flex-none text-[var(--brand)]" aria-hidden size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.ul
            initial="hidden"
            animate={animateState}
            variants={variants}
            transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
            className="mt-6 flex flex-col gap-3 text-sm text-[var(--text)] sm:flex-row sm:flex-wrap"
            role="list"
            aria-label="Compromissos"
          >
            {TRUST_BADGES.map((badge) => (
              <li
                key={badge}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 shadow-sm"
              >
                <CheckCircle className="h-4 w-4 text-[var(--brand)]" aria-hidden />
                <span>{badge}</span>
              </li>
            ))}
          </motion.ul>

          <div className="mt-8 flex w-full max-w-md flex-col gap-4 xs:flex-row">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "solid", size: "lg" }),
                "h-12 w-full xs:flex-1 bg-[var(--brand)] text-[var(--brand-foreground)] shadow-md hover:shadow-lg focus-visible:ring-offset-0"
              )}
            >
              Falar com a criadora
            </a>
            <a
              href="#filhotes"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full xs:flex-1 border-[var(--brand)] bg-white/70 text-[var(--brand)] hover:bg-white/90"
              )}
            >
              Ver filhotes disponíveis
            </a>
          </div>

          <motion.dl
            initial="hidden"
            animate={animateState}
            variants={metricsVariant}
            transition={{ duration: 0.55, delay: 0.24, ease: "easeOut" }}
            className="mt-10 grid gap-4 text-left sm:grid-cols-3"
            aria-label="Resultados"
          >
            {METRICS.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm">
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">{metric.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-[var(--text)]">{metric.value}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={animateState}
          variants={variants}
          transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
          className="w-full max-w-xl flex-1 space-y-6"
        >
          <figure className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl lg:aspect-[16/10]">
            <Image
              src="/spitz-hero-desktop.webp"
              alt="Filhotes de Spitz Alemão Anão Lulu da Pomerânia saudáveis alinhados"
              fill
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
              style={{ objectPosition: "50% 38%" }}
              draggable={false}
            />
            <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/95 px-4 py-1 text-xs font-semibold text-[var(--brand)] shadow">
              Entrega segura em todo o Brasil
            </figcaption>
          </figure>

          <motion.div
            initial="hidden"
            animate={animateState}
            variants={metricsVariant}
            transition={{ duration: 0.55, delay: 0.28, ease: "easeOut" }}
            className="mt-5 rounded-2xl border border-[var(--border)] bg-white/95 p-6 shadow-xl lg:hidden"
          >
            <p className="text-sm font-semibold text-[var(--text)]">Atendimento humano em tempo real</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Compartilhe vídeos do seu lar e receba orientação sobre rotina, enxoval e comportamento em minutos.
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              <WAIcon size={16} className="h-4 w-4" aria-hidden />
              Falar agora
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={animateState}
            variants={metricsVariant}
            transition={{ duration: 0.55, delay: 0.32, ease: "easeOut" }}
            className="hidden rounded-2xl border border-[var(--border)] bg-white/95 p-6 shadow-xl lg:block"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xs">
                <p className="text-sm font-semibold text-[var(--text)]">Atendimento humano em tempo real</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Compartilhe vídeos do seu lar e receba orientação sobre rotina, enxoval e comportamento em minutos.
                </p>
              </div>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] hover:underline"
              >
                <WAIcon size={16} className="h-4 w-4" aria-hidden />
                Falar agora
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

