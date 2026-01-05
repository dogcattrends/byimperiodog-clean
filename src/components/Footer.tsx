"use client";
import { Rocket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { trackWhatsAppClick, trackNewsletterSubscribe } from "@/lib/events";
import { routes, type AppRoutes } from "@/lib/route";
import { WHATSAPP_LINK } from "@/lib/whatsapp";

// TikTokIcon removed (not used)

// Número oficial atualizado via helper centralizado
const WA = WHATSAPP_LINK;

const year = new Date().getFullYear();

const menuLinks: { label: string; path: AppRoutes }[] = [
  { label: "Home", path: routes.home },
  { label: "Sobre", path: routes.sobre },
  { label: "Filhotes", path: routes.filhotes },
  { label: "Blog", path: routes.blog },
  { label: "Contato", path: routes.contato },
];

const supportLinks: { label: string; href: string }[] = [
  { label: "FAQ do tutor", href: "/faq-do-tutor" },
  { label: "Política de privacidade", href: routes.politica },
  { label: "Termos de uso", href: "/termos-de-uso" },
  { label: "Política editorial", href: "/politica-editorial" },
];

const footerContact = {
  description:
    "Atendimento sob consulta a partir de São Paulo — conversas individuais para alinhar rotina, investimento e socialização antes da reserva.",
  email: "contato@byimperiodog.com.br",
  phone: "(11) 96863-3239",
};

type FooterLink = { label: string; href: string };

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="inline-flex items-center gap-1 rounded px-1 py-1 text-zinc-300 hover:text-white transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  // Respeita prefers-reduced-motion sem depender de libs
  const scrollTop = useCallback(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, []);

  const rootClasses = "relative text-sm border-t bg-zinc-900 text-zinc-200 border-zinc-700";

  return (
    <footer className={rootClasses} data-site-shell="footer">
      {/* Divisor topo simples */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

      {/* CTA Section */}
      <section
        aria-labelledby="cta-filhotes"
        className="relative isolate px-6 py-12 sm:py-14 text-center text-white"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="cta-filhotes" className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
            Pronto para garantir seu Spitz Alemão?
          </h2>
          <p className="mt-3 text-zinc-300 text-sm sm:text-base leading-relaxed">
            Atendimento humano, suporte pós-venda e acompanhamento responsável.
          </p>
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale conosco no WhatsApp"
            onClick={() => trackWhatsAppClick('footer-cta', 'CTA Principal Footer')}
            className="inline-flex mt-6 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 shadow-lg hover:shadow-xl transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <span>Falar no WhatsApp</span>
            <WAIcon size={18} aria-hidden="true" />
          </a>
        </div>
      </section>

      <nav aria-label="Links do rodapé" className="relative max-w-7xl mx-auto px-6 py-12">
        <div className="hidden lg:grid grid-cols-[1.4fr,1fr,1fr,1.1fr] gap-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-[0.4em] text-emerald-300">
              BY IMPÉRIO DOG
            </span>
            <p className="text-sm leading-relaxed text-zinc-200">
              Spitz Alemão Anão até 22 cm, criado com responsabilidade, saúde validada e mentoria vitalícia. Atendimento premium sob consulta para famílias que valorizam transparência.
            </p>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com a criadora no WhatsApp"
              onClick={() => trackWhatsAppClick("footer-nav", "WhatsApp rodapé")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 min-h-[44px]"
            >
              <WAIcon size={18} aria-hidden="true" />
              Falar com a criadora
            </a>
          </div>

          <FooterColumn title="Navegação" links={menuLinks.map((item) => ({ label: item.label, href: item.path }))} />
          <FooterColumn title="Suporte" links={supportLinks} />

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white tracking-tight">Contato</h3>
            <p className="text-sm text-zinc-300">{footerContact.description}</p>
            <div className="text-sm text-zinc-200 space-y-1">
              <p>Email: <a href={`mailto:${footerContact.email}`} className="text-emerald-300 hover:text-white">{footerContact.email}</a></p>
              <p>
                WhatsApp:&nbsp;
                <a
                  href={WA}
                  className="text-emerald-300 hover:text-white"
                  onClick={() => trackWhatsAppClick("footer-contact", "WhatsApp contato")}
                >
                  {footerContact.phone}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:hidden">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-[0.4em] text-emerald-300">
              BY IMPÉRIO DOG
            </span>
            <p className="text-sm leading-relaxed text-zinc-200">
              Spitz Alemão Anão até 22 cm, criado com responsabilidade, saúde validada e mentoria vitalícia.
            </p>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com a criadora no WhatsApp"
              onClick={() => trackWhatsAppClick("footer-nav", "WhatsApp rodapé móvel")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 min-h-[44px]"
            >
              <WAIcon size={18} aria-hidden="true" />
              Falar com a criadora
            </a>
          </div>

          {[{ title: "Navegação", links: menuLinks.map((item) => ({ label: item.label, href: item.path })) }, { title: "Suporte", links: supportLinks }].map((section) => (
            <details key={section.title} className="group rounded-2xl border border-white/10 bg-white/5" open>
              <summary className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-100 cursor-pointer list-none">
                {section.title}
                <span className="text-xs text-zinc-400 transition group-open:rotate-45">+</span>
              </summary>
              <ul className="space-y-2 px-6 pb-3 text-sm text-zinc-300">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-white transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}

          <details className="group rounded-2xl border border-white/10 bg-white/5" open>
            <summary className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-100 cursor-pointer list-none">
              Contato
              <span className="text-xs text-zinc-400 transition group-open:rotate-45">+</span>
            </summary>
            <div className="space-y-2 px-6 pb-3 text-sm text-zinc-300">
              <p>{footerContact.description}</p>
              <p>Email: <Link href={`mailto:${footerContact.email}`} className="text-emerald-300 hover:text-white">{footerContact.email}</Link></p>
              <p>
                WhatsApp:&nbsp;
                <a
                  href={WA}
                  className="text-emerald-300 hover:text-white"
                  onClick={() => trackWhatsAppClick("footer-contact", "WhatsApp rodapé móvel")}
                >
                  {footerContact.phone}
                </a>
              </p>
            </div>
          </details>
        </div>

        <div className="mt-10 lg:mt-6">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-white tracking-tight">Assine nossa newsletter</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">Receba novidades, dicas de cuidados e novos filhotes.</p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative mt-4 border-t border-zinc-700 py-6 text-xs text-zinc-400">
        <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <p className="font-medium text-zinc-300">&copy; {year} By Imperio Dog</p>
          <nav aria-label="Links institucionais" className="flex flex-wrap items-center gap-4 text-xs">
            <Link href={routes.sobre} className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded px-1">Sobre</Link>
            <Link href={routes.contato} className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded px-1">Contato</Link>
            <Link href={routes.politica} className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded px-1">Privacidade</Link>
          </nav>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollTop}
        aria-label="Voltar ao topo"
        className={`fixed right-4 bottom-32 min-h-[48px] min-w-[48px] bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-emerald-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 motion-reduce:transform-none ${showTop ? 'opacity-100' : 'opacity-0 pointer-events-none'} mb-[env(safe-area-inset-bottom)] z-50 flex items-center justify-center`}
      >
        <Rocket size={20} aria-hidden="true" />
      </button>

      <a
        href={WA}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('footer-floating', 'Botão Flutuante WhatsApp')}
        className="fixed right-4 bottom-6 min-h-[56px] min-w-[56px] bg-whatsapp text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 motion-reduce:transform-none mb-[env(safe-area-inset-bottom)] z-50"
        aria-label="Conversar no WhatsApp"
      >
        <WAIcon size={24} />
      </a>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

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
        trackNewsletterSubscribe('footer-newsletter');
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
      {msg && (
        <p
          id="newsletter-msg"
          aria-live="polite"
          role={msg.type === 'error' ? 'alert' : 'status'}
          className={
            "sm:col-span-2 text-xs mt-1 " +
            (msg.type === 'success' ? 'text-emerald-200' : msg.type === 'error' ? 'text-red-200' : 'text-white/80')
          }
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}

