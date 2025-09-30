"use client";

import Link from "next/link";
import { Instagram, Youtube, MessageCircle, Rocket, Phone, Facebook, Linkedin, Twitter } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { routes, AppRoutes } from "@/lib/route";

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

const WA = process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/5511999999999";
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

  return (
    <footer className="bg-white text-zinc-700 text-sm border-t border-zinc-200/60">
      {/* CTA Section */}
      <motion.section
        role="region"
        aria-labelledby="cta-filhotes"
        className="relative isolate overflow-hidden bg-gradient-to-br from-brand via-brand/95 to-brand/90 px-6 py-14 sm:py-16 text-center shadow-inner"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="cta-filhotes" className="text-2xl sm:text-3xl font-bold text-white/95 leading-snug tracking-tight">
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
            <MessageCircle size={18} aria-hidden="true" className="text-brand" />
          </motion.a>
        </div>
        {/* sutil overlay pattern */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.15),transparent_60%),radial-gradient(circle_at_70%_65%,rgba(255,255,255,0.12),transparent_65%)] mix-blend-overlay opacity-60" />
      </motion.section>

      <nav
        aria-label="Links do rodapé"
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 px-6 py-14 sm:py-16"
      >
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-zinc-900 tracking-tight">Menu</h3>
          <ul className="space-y-1.5">
            {menuLinks.map(({ label, path }) => (
              <li key={path}>
                <Link
                  href={path}
                  className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-zinc-600 hover:text-zinc-900 hover:underline underline-offset-4 decoration-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-zinc-900 tracking-tight">Redes Sociais</h3>
          <ul className="space-y-2">
            {[
              { label: "Instagram", Icon: Instagram, href: "https://instagram.com/byimperiodog" },
              { label: "YouTube", Icon: Youtube, href: "https://youtube.com/@byimperiodog" },
              { label: "Facebook", Icon: Facebook, href: "https://facebook.com/byimperiodog" },
              { label: "TikTok", Icon: TikTokIcon as any, href: "https://www.tiktok.com/@byimperiodog" },
              { label: "LinkedIn", Icon: Linkedin, href: "https://www.linkedin.com/company/byimperiodog" },
              { label: "Twitter", Icon: Twitter, href: "https://twitter.com/byimperiodog" },
              { label: "Fale Conosco", Icon: MessageCircle, href: routes.contato },
            ].map(({ label, Icon, href }) => {
              const isInternal = href.startsWith('/');
              const classes = "flex items-center gap-2 rounded-md px-1 py-1 text-zinc-600 hover:text-zinc-900 hover:underline underline-offset-4 decoration-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition";
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
          <div className="h-full rounded-xl border border-zinc-200/70 bg-zinc-50/60 backdrop-blur-sm p-5 flex flex-col">
            <h3 className="text-base font-semibold text-zinc-900 tracking-tight">Assine nossa newsletter</h3>
            <p className="mt-1 text-xs text-zinc-600 leading-relaxed">Receba novidades, dicas de cuidados e novos filhotes antes de todo mundo.</p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </nav>

      <div className="text-center border-t border-zinc-200/70 py-8 px-4 text-zinc-600 text-xs sm:text-[13px]">
        <p className="leading-relaxed">
          &copy; {year} By Imperio Dog — Todos os direitos reservados. <span className="mx-1 text-zinc-400" aria-hidden>|</span>
          <Link href={routes.politica} className="underline decoration-brand/60 underline-offset-4 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded px-1">Política de Privacidade</Link>
        </p>
        <p className="mt-1 tracking-tight text-zinc-500">Bragança Paulista - SP</p>
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
        aria-label="Fale conosco no WhatsApp"
      >
        <Phone size={22} aria-hidden="true" />
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
        <span
          className={
            "sm:ml-2 text-xs sm:text-sm self-center sm:self-auto font-medium " +
            (msg.type === "success" ? "text-emerald-600" : msg.type === "error" ? "text-rose-600" : "text-zinc-500")
          }
          role={msg.type === "error" ? "alert" : undefined}
        >
          {msg.text}
        </span>
      )}
    </form>
  );
}

