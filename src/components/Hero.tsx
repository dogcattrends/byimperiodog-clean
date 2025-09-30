"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle, Star, Heart, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { buttonVariants } from "@/components/ui/button"; // reutiliza design system
import { cn } from "@/lib/cn";

// Partículas: carregamento realmente adiado (intersection + idle + import dinâmico manual)
let ParticlesCmp: any = null; // cache em escopo de módulo
async function ensureParticles(){
  if(!ParticlesCmp){
    const mod = await import('react-tsparticles');
    ParticlesCmp = mod.default || mod;
  }
  return ParticlesCmp;
}
async function loadSlimEngine(engine:any){
  const { loadSlim } = await import('tsparticles-slim');
  await loadSlim(engine);
}

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const [showFx, setShowFx] = useState(false); // sinal para render
  const [ready, setReady] = useState(false); // módulo carregado
  const hostRef = useRef<HTMLElement|null>(null);

  useEffect(()=>{
    if(prefersReducedMotion) return; // não carregar se usuário prefere menos movimento
    const el = hostRef.current;
    if(!el) return;
    const io = new IntersectionObserver((entries)=>{
      const e = entries[0];
      if(e && e.isIntersecting){
        // usar idle para postergar CPU se disponível
        const schedule = (cb:()=>void)=> (window as any).requestIdleCallback? (window as any).requestIdleCallback(cb,{ timeout:1500 }): setTimeout(cb,90);
        schedule(async ()=>{
          try {
            await ensureParticles();
            setReady(true);
            setShowFx(true);
          } catch {/* silencioso */}
        });
        io.disconnect();
      }
    }, { rootMargin: '0px 0px 200px 0px', threshold: 0.15 });
    io.observe(el);
    return ()=> io.disconnect();
  }, [prefersReducedMotion]);

  // Remove effect antigo de exibição imediata; showFx agora controlado por intersection.

  const greeting = useMemo(() => {
    const h = new Date().getHours();
  if (h < 12) return "Bom dia! ☀️ Seu Spitz te esperando.";
  if (h < 18) return "Boa tarde! 🐾 Ainda dá tempo de garantir o seu.";
  return "Boa noite! 🌙 Um Spitz te espera para dormir juntinho.";
  }, []);

  const particlesInit = useCallback(async (engine: any) => {
    await loadSlimEngine(engine);
  }, []);

  // Variantes de animação com fallback para usuários que reduzem motion
  // Helper para retornar variants consistentes sem conflito de tipos do framer-motion
  const fadeSlide = (delay = 0) => ({
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 28 },
    whileInView: { opacity: 1, y: 0 },
    delay,
  });

  const FEATURES = [
    "Pedigree reconhecido com garantia 🧬",
    "Entrega segura em todo Brasil 🚚",
    "Acompanhamento e suporte vitalício ❤️",
  ];

  return (
    <section
  ref={hostRef as any}
      aria-labelledby="hero-heading"
      className="relative isolate w-full overflow-hidden bg-[#0f3d37] text-white dark:text-white"
      role="banner"
    >
      {/* Background base: gradiente + textura sutil para profundidade sem peso de rede */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_65%)]" aria-hidden />
      {/* Scrim para contraste do texto (lado esquerdo) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/60 via-black/40 to-transparent" aria-hidden />
      {/* Partículas (adiadas e reduzidas) */}
      {showFx && ready && !prefersReducedMotion && ParticlesCmp && (
        <ParticlesCmp
          init={particlesInit}
          className="absolute inset-0 -z-10"
          options={{
            fullScreen: false,
            background: { color: 'transparent' },
            fpsLimit: 60,
            particles: {
              color: { value: '#ffffff' },
              number: { value: 14 },
              opacity: { value: 0.13 },
              size: { value: { min: 1, max: 3 } },
              move: { enable: true, speed: 0.35, direction: 'top', outModes: { default: 'out' } },
            },
            detectRetina: true,
          }}
        />
      )}

      <div className="mx-auto max-w-7xl px-5 pt-20 pb-24 sm:pt-28 md:px-8 lg:flex lg:items-center lg:gap-x-16">
        {/* Coluna de texto */}
        <motion.div
          initial={fadeSlide(0).initial}
          whileInView={fadeSlide(0).whileInView}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: fadeSlide(0).delay }}
          className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto"
        >
          <p className="mb-3 text-xs font-medium tracking-wide text-white/80">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm ring-1 ring-inset ring-white/15">
              {greeting}
            </span>
          </p>
          <h1
            id="hero-heading"
            className="text-balance break-words text-3xl font-bold leading-tight tracking-tight drop-shadow-sm sm:text-5xl"
          >
            <span className="pr-2">Spitz Alemão Anão</span>
            <span aria-hidden className="inline-block align-middle">🦊</span>
            <span className="sr-only"> - </span>
            <span className="whitespace-nowrap">(Lulu da Pomerânia)</span>
          </h1>
          <motion.p
            initial={fadeSlide(0.05).initial}
            whileInView={fadeSlide(0.05).whileInView}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.55, delay: fadeSlide(0.05).delay }}
            className="mt-5 text-base leading-relaxed text-white/95 sm:text-lg sm:leading-8"
          >
            Compra segura, pedigree garantido e suporte pós-venda. Seu filhote dos sonhos começa aqui.
          </motion.p>

          <ul className="mt-7 space-y-3 text-white/90" aria-label="Diferenciais principais">
            {FEATURES.map((txt, i) => (
              <motion.li
                key={txt}
                initial={fadeSlide(0.1 + i * 0.08).initial}
                whileInView={fadeSlide(0.1 + i * 0.08).whileInView}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: fadeSlide(0.1 + i * 0.08).delay }}
                className="flex items-start gap-2 text-sm sm:text-base"
              >
                <CheckCircle className="mt-0.5 h-5 w-5 flex-none text-accent" aria-hidden="true" />
                <span>{txt}</span>
              </motion.li>
            ))}
          </ul>

          {/* Trust indicators acessíveis */}
          <div className="mt-7 grid grid-cols-1 gap-3 text-sm text-white/85 sm:grid-cols-3" role="list" aria-label="Indicadores de confiança">
            <div role="listitem" className="flex items-center gap-2">
              <Star className="h-4 w-4" aria-hidden="true" /> Criador há 10+ anos
            </div>
            <div role="listitem" className="flex items-center gap-2">
              <Heart className="h-4 w-4" aria-hidden="true" /> Pedigree garantido
            </div>
            <div role="listitem" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Pós-venda vitalício
            </div>
          </div>

          {/* CTA Buttons usando design system */}
          <div className="mt-10 flex flex-wrap gap-4">
            <motion.a
              initial={fadeSlide(0.15).initial}
              whileInView={fadeSlide(0.15).whileInView}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.55, delay: fadeSlide(0.15).delay }}
              href="#filhotes"
              className={cn(
                buttonVariants({ variant: "solid", size: "lg" }),
                "w-full sm:w-auto min-w-[220px] shadow-sm hover:shadow focus-visible:ring-offset-0"
              )}
            >
              Ver filhotes disponíveis
            </motion.a>
            <motion.a
              initial={fadeSlide(0.2).initial}
              whileInView={fadeSlide(0.2).whileInView}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.55, delay: fadeSlide(0.2).delay }}
              href={`${process.env.NEXT_PUBLIC_WA_LINK ?? "#"}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto min-w-[220px] border-white/30 bg-white/10 text-white hover:bg-white/15 hover:border-white/40"
              )}
            >
              Falar com um especialista
            </motion.a>
          </div>
        </motion.div>

        {/* Coluna da imagem / Hero visual */}
        <motion.div
          initial={fadeSlide(0.1).initial}
          whileInView={fadeSlide(0.1).whileInView}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: fadeSlide(0.1).delay }}
          className="relative mt-16 w-full lg:mt-0 lg:w-[50%] lg:flex-shrink-0"
        >
          {/* Mobile image */}
          <div className="mx-auto w-full max-w-md lg:hidden">
            <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-inset ring-black/25 shadow-xl">
              <Image
                src="/spitz-hero-mobile.png"
                alt="Família com filhotes de Spitz Alemão Anão"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 600px"
                className="object-cover"
                style={{ objectPosition: "50% 26%" }}
                draggable={false}
              />
              <figcaption className="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-emerald-800 shadow ring-1 ring-black/10 backdrop-blur-[1px]">
                Entrega garantida
              </figcaption>
            </figure>
          </div>
          {/* Desktop image */}
          <div className="hidden lg:block">
            <figure className="relative mx-auto aspect-[16/10] w-full max-w-xl overflow-hidden rounded-2xl ring-1 ring-inset ring-black/25 shadow-xl">
              <Image
                src="/spitz-hero-desktop.webp"
                alt="Filhotes de Spitz Alemão Anão em destaque"
                fill
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 38%" }}
                draggable={false}
              />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-emerald-800 shadow ring-1 ring-black/10 backdrop-blur-[1px]">
                Entrega garantida
              </figcaption>
            </figure>
            <div
              className="mt-2 inline-block text-sm text-white/85 drop-shadow"
              title="Criador certificado há mais de 10 anos com reconhecimento nacional"
              aria-label="Criador certificado há mais de 10 anos com reconhecimento nacional"
            >
              Criador certificado <span aria-hidden>✅</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Selo flutuante (aria-live para senso de urgência sem poluição) */}
      <div
        className="fixed bottom-5 left-5 z-40 hidden rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-emerald-800 shadow-lg ring-1 ring-black/10 backdrop-blur supports-[backdrop-filter]:bg-white/85 transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 motion-reduce:transform-none md:flex"
        aria-live="polite"
      >
  Últimos filhotes disponíveis! <span aria-hidden>🔥</span>
      </div>
    </section>
  );
}

