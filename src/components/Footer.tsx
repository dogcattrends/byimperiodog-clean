"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Instagram, Youtube, MessageCircle, Rocket, Facebook, Twitter } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { routes, type AppRoutes } from "@/lib/route";

// Ícone TikTok custom leve (monocromático neutro para herdar cor)
function TikTokIcon({ size = 18, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M30.9 7.2c1.2 2.2 3.3 3.9 5.8 4.3v5.2c-2.2-.05-4.3-.65-6.2-1.7v11.3c0 6.6-4.5 11.2-11.3 11.2A11.2 11.2 0 0 1 8 26.4c0-6.4 4.8-10.9 11.7-11.1v5.6c-3.7.3-5.7 2-5.7 5.3 0 3.2 2 5.2 5 5.2 3.3 0 5.2-2 5.2-5.6V7h6.7l.1.2Z" />
    </svg>
  );
}

// Ícone Pinterest (SVG simplificado, monocromático)
function PinterestIcon({ size = 18, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 2.04C6.5 2.04 2 6.42 2 11.86c0 4.06 2.87 7.52 6.84 8.6-.09-.73-.17-1.85.04-2.65.18-.76 1.17-5.07 1.17-5.07s-.3-.6-.3-1.49c0-1.39.81-2.43 1.82-2.43.86 0 1.28.64 1.28 1.4 0 .85-.54 2.13-.82 3.31-.23.97.49 1.76 1.45 1.76 1.74 0 3.07-1.84 3.07-4.49 0-2.35-1.69-4-4.11-4-2.8 0-4.44 2.1-4.44 4.27 0 .85.33 1.76.74 2.25.08.1.09.19.07.29-.08.32-.26 1.02-.29 1.16-.05.21-.17.26-.39.16-1.45-.68-2.36-2.82-2.36-4.54 0-3.7 2.69-7.1 7.76-7.1 4.07 0 7.23 2.89 7.23 6.76 0 4.04-2.55 7.29-6.08 7.29-1.19 0-2.31-.62-2.7-1.34l-.73 2.79c-.26.98-.96 2.21-1.43 2.96.93.29 1.91.44 2.93.44 5.5 0 10-4.38 10-9.82C22 6.24 17.5 2.04 12 2.04Z" />
    </svg>
  );
}

// Número oficial atualizado
const WA = process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/551196863239";

const year = new Date().getFullYear();

const menuLinks: { label: string; path: AppRoutes }[] = [
  { label: "Home", path: routes.home },
  { label: "Sobre", path: routes.sobre },
  { label: "Filhotes", path: routes.filhotes },
  { label: "Blog", path: routes.blog },
  { label: "Contato", path: routes.contato },
];

export default function FooterFixed() {
  const [showTop, setShowTop] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  // Throttle via rAF (INP friendly)
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setShowTop(window.scrollY > 400);
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const reduceMotion = useReducedMotion();
  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [reduceMotion]);

  // Carrega preferência de alto contraste
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('footer_high_contrast_v1');
      if (stored === '1') setHighContrast(true);
    } catch { /* ignore */ }
  }, []);

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      try { localStorage.setItem('footer_high_contrast_v1', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  const rootClasses = [
    "relative text-sm border-t bg-[#0f3d37]",
    highContrast ? "text-white" : "text-white/80",
    "border-white/10"
  ].join(' ');

  return (
    <footer className={rootClasses} data-high-contrast={highContrast ? '1' : '0'} data-site-shell="footer">
      {/* Textura leve (noise) responsiva: oculta em telas pequenas */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.7)_0,rgba(0,0,0,0)_1px)] [background-size:14px_14px] hidden sm:block" />
      {/* Overlays consolidados (removidos de seções inferiores) */}
      {!highContrast && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.10),transparent_70%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/30 to-transparent mix-blend-overlay" />
        </>
      )}
      {/* Divisor luminoso topo */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {/* CTA Section */}
      <motion.section
        role="region"
        aria-labelledby="cta-filhotes"
        className="relative isolate overflow-hidden px-6 py-14 sm:py-16 text-center shadow-inner text-white"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="cta-filhotes" className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
            Pronto para garantir seu Spitz Alemão?
          </h2>
          <p className="mt-3 text-white/85 text-sm sm:text-base leading-relaxed">
            Atendimento humano, suporte pós-venda e acompanhamento responsável.
          </p>
          <motion.a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale conosco no WhatsApp"
            className="inline-flex mt-6 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 shadow-lg ring-1 ring-white/40 hover:shadow-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70 motion-reduce:transform-none"
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 0.25 }}
          >
            <span className="underline decoration-brand/50 underline-offset-4">Falar no WhatsApp</span>
            <WAIcon size={18} aria-hidden="true" className="text-brand" />
          </motion.a>
        </div>
        {/* Overlays específicos da CTA só se não for alto contraste */}
        {!highContrast && (
          <>
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.10),transparent_62%)] opacity-70" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-black/28 to-transparent mix-blend-overlay" />
          </>
        )}
      </motion.section>

      <nav
  aria-label="Links do rodapé"
        className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 px-6 py-14 sm:py-16"
      >
        {/* Overlays removidos (consolidados no root) */}
        <div className="space-y-3">
          <motion.h3
            className="text-base font-semibold text-white tracking-tight relative inline-flex items-center group"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
          >
            Menu
            <motion.span
              aria-hidden
              className="absolute -bottom-1 left-0 h-[2px] bg-brand/70 group-hover:bg-brand rounded-full"
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            />
          </motion.h3>
          <ul className="space-y-1.5">
            {menuLinks.map(({ label, path }) => (
              <li key={path}>
                <Link
                  href={path}
                  className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-white/70 hover:text-white hover:underline underline-offset-4 decoration-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f3d37] transition"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <motion.h3
            className="text-base font-semibold text-white tracking-tight relative inline-flex items-center group"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Redes Sociais
            <motion.span
              aria-hidden
              className="absolute -bottom-1 left-0 h-[2px] bg-brand/70 group-hover:bg-brand rounded-full"
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            />
          </motion.h3>
          <ul className="space-y-2">
            {[ 
              { label: "Instagram", Icon: Instagram, href: "https://instagram.com/byimperiodog" },
              { label: "YouTube", Icon: Youtube, href: "https://youtube.com/@byimperiodog" },
              { label: "Facebook", Icon: Facebook, href: "https://facebook.com/byimperiodog" },
              { label: "TikTok", Icon: TikTokIcon, href: "https://www.tiktok.com/@byimperiodogs" },
              { label: "Pinterest", Icon: PinterestIcon, href: "https://pinterest.com/byimperiodog/" },
              { label: "Twitter", Icon: Twitter, href: "https://twitter.com/byimperiodog" },
              { label: "Fale Conosco", Icon: MessageCircle, href: routes.contato },
            ].map(({ label, Icon, href }) => {
              const isInternal = href.startsWith('/');
              const classes = "flex items-center gap-2 rounded-md px-1 py-1 text-white/70 hover:text-white hover:underline underline-offset-4 decoration-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f3d37] transition";
              const content = <>
                {Icon ? <Icon size={18} aria-hidden="true" /> : null}
                {label}
              </>;
              return (
                <li key={label}>
                  {isInternal ? (
                    <Link href={href as AppRoutes} className={classes} aria-label={label}>{content}</Link>
                  ) : (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={classes} aria-label={label}>{content}</a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="h-full rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-5 flex flex-col">
            <motion.h3
              className="text-base font-semibold text-white tracking-tight relative inline-flex items-center group"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Assine nossa newsletter
              <motion.span
                aria-hidden
                className="absolute -bottom-1 left-0 h-[2px] bg-brand/70 group-hover:bg-brand rounded-full"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              />
            </motion.h3>
            <p className="mt-1 text-xs text-white/70 leading-relaxed">Receba novidades, dicas de cuidados e novos filhotes antes de todo mundo.</p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative mt-4 border-t border-white/10 py-8 text-xs text-white/70">
        {/* Overlays da barra final consolidados no root; somente noise + root radial */}
        <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <p className="font-medium tracking-tight text-white/80">&copy; {year} By Imperio Dog</p>
          <nav aria-label="Links institucionais" className="flex flex-wrap items-center gap-4 text-[13px] sm:text-xs">
            <Link href={routes.sobre} className="hover:underline hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f3d37]">Sobre</Link>
            <Link href={routes.contato} className="hover:underline hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f3d37]">Contato</Link>
            <Link href={routes.politica} className="hover:underline hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f3d37]">Privacidade</Link>
          </nav>
          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className="ml-auto rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase text-white/80 hover:text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f3d37] transition"
          >
            {highContrast ? 'Modo padrão' : 'Alto contraste'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollTop}
        aria-label="Voltar ao topo"
        className={`fixed right-4 bottom-32 h-12 w-12 min-h-[44px] min-w-[44px] bg-brand text-white rounded-full shadow-lg ring-1 ring-white/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 hover:shadow-xl hover:brightness-[1.04] motion-reduce:transform-none ${showTop ? 'opacity-100' : 'opacity-0 pointer-events-none'} mb-[env(safe-area-inset-bottom)] z-50 flex items-center justify-center`}
      >
        <Rocket size={20} aria-hidden="true" />
      </button>

      <a
        href={WA}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 bottom-6 h-14 w-14 min-h-[44px] min-w-[44px] bg-whatsapp text-white rounded-full shadow-xl ring-1 ring-white/10 flex items-center justify-center hover:shadow-2xl hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transform-none mb-[env(safe-area-inset-bottom)] z-50"
        aria-label="Conversar no WhatsApp"
      >
  <WAIcon size={22} />
      </a>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const liveRef = useRef<HTMLSpanElement | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
  setMsg({ type: "error", text: "E-mail inválido" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
  setMsg({ type: "success", text: data?.message || "Inscrição realizada com sucesso!" });
        setEmail("");
      } else {
  setMsg({ type: "error", text: data?.message || "Não foi possível inscrever agora." });
      }
    } catch {
      setMsg({ type: "error", text: "Erro de rede. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
  <form className="flex flex-col sm:flex-row gap-3" aria-label="Formulário de inscrição" onSubmit={onSubmit} noValidate>
      <div className="relative flex-1">
        <label className="sr-only" htmlFor="newsletter-email">E-mail</label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="Seu melhor e-mail"
          aria-describedby="newsletter-msg"
          className="peer w-full px-4 py-2 rounded-md bg-white text-zinc-900 placeholder:text-zinc-400 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand shadow-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          autoComplete="email"
          inputMode="email"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="relative inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500/90 active:scale-[.98] motion-reduce:transform-none transition px-5 py-2 rounded-md font-semibold text-white shadow disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50"
      >
        {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/50 border-t-white" aria-hidden="true" />}
        {loading ? "Enviando..." : "Inscrever"}
      </button>
      <span ref={liveRef} id="newsletter-msg" aria-live="polite" className="sr-only">{msg?.text}</span>
      {msg && (
        <a
          href={WA}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-4 bottom-6 h-14 w-14 min-h-[44px] min-w-[44px] bg-whatsapp text-white rounded-full shadow-xl ring-1 ring-white/10 flex items-center justify-center hover:shadow-2xl hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transform-none mb-[env(safe-area-inset-bottom)] z-50"
          aria-label="Conversar no WhatsApp"
        >
          <WAIcon size={22} />
        </a>
      )}
    </form>
  );
}

