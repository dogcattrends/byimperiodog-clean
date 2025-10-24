"use client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

import { routes } from "@/lib/route";

type FloatingPuppiesCTAProps = {
  disabled?: boolean;
  /** desabilita repetição após fechar manualmente */
  persistentDismissKey?: string;
  /** força exibição (debug) */
  force?: boolean;
};

// Ícone de fogo leve (evita dependência extra)
function FlameIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12.9 2.3a1 1 0 0 0-1.8 0C9.9 5 8 6.9 6.6 8.7 5.2 10.6 4.5 12.5 4.5 14.3 4.5 18.2 7.7 21 12 21s7.5-2.8 7.5-6.7c0-1.5-.5-2.9-1.3-4.3-.6-1.1-1.4-2.2-2.3-3.4-.8-1-1.6-2-2.2-3.3ZM12 19c-2.9 0-5.5-1.7-5.5-4.7 0-1.2.5-2.5 1.5-3.9.4-.6.9-1.2 1.4-1.9.2-.3.5-.6.7-1 .3.4.6.8.8 1.1.6.8 1.1 1.5 1.5 2.1.6 1 .9 1.7.9 2.5a1 1 0 0 1-2 0c0-.3-.1-.7-.6-1.6-.2-.3-.5-.8-.9-1.3-.3.4-.6.8-.8 1.1-.8 1.3-1 2-.9 2.6.2 1.5 1.8 2.4 3.9 2.4a1 1 0 1 1 0 2Z"
      />
    </svg>
  );
}

export function FloatingPuppiesCTA({ disabled, persistentDismissKey = "cta_puppies_dismissed_v1", force }: FloatingPuppiesCTAProps) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [eligible, setEligible] = useState(false); // gating atingido (scroll OU inatividade)
  const [mounted, setMounted] = useState(false);
  const timers = useRef<number[]>([]);
  const lastActivityRef = useRef<number>(Date.now());
  const scheduledRef = useRef(false);
  const [variant, setVariant] = useState<'A' | 'B'>('A');

  // Rotas prioritárias: menor limiar para aparecer
  const isBlogPost = pathname?.startsWith('/blog/') && pathname !== '/blog';
  const priority = pathname === '/' || pathname === routes.filhotes || pathname === routes.blog || isBlogPost;

  // Elegibilidade por rota (não mostrar em /admin ou rotas admin group)
  const routeAllowed = !pathname?.startsWith('/admin');

  // Thresholds dinâmicos
  const scrollThreshold = priority ? 0.3 : 0.5; // 30% vs 50%
  const inactivityMs = priority ? 10_000 : 20_000; // 10s vs 20s

  // Copy A/B persistente na sessão
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = 'cta_puppies_variant_v1';
      const stored = sessionStorage.getItem(key) as 'A' | 'B' | null;
      if (stored === 'A' || stored === 'B') {
        setVariant(stored);
      } else {
        const chosen = Math.random() < 0.5 ? 'A' : 'B';
        sessionStorage.setItem(key, chosen);
        setVariant(chosen);
      }
    } catch { /* ignore */ }
  }, []);

  // Montagem + checagem de dismiss
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (disabled) return;
    if (!routeAllowed && !force) return;
    if (sessionStorage.getItem(persistentDismissKey) === '1' && !force) return;
    setMounted(true);
  }, [disabled, persistentDismissKey, routeAllowed, force]);

  // Atualiza timestamp de atividade
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Listeners de atividade
  useEffect(() => {
    if (!mounted) return;
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, markActivity));
    };
  }, [mounted, markActivity]);

  // Gating via scroll OU inatividade
  useEffect(() => {
    if (!mounted) return;
    if (force) { setEligible(true); return; }

    let raf: number;
    const check = () => {
      if (!eligible) {
        try {
          const doc = document.documentElement;
          const scrollable = doc.scrollHeight - window.innerHeight;
          const scrolledRatio = scrollable > 0 ? window.scrollY / scrollable : 0;
          const inactive = Date.now() - lastActivityRef.current >= inactivityMs;
          if (scrolledRatio >= scrollThreshold || inactive) {
            setEligible(true);
          }
        } catch { /* ignore */ }
      }
      raf = window.requestAnimationFrame(check);
    };
    raf = window.requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [mounted, eligible, scrollThreshold, inactivityMs, force]);

  // Agenda exibição quando elegível
  useEffect(() => {
    if (!eligible) return;
    if (visible) return; // já visível
    if (scheduledRef.current) return; // já agendado
    if (sessionStorage.getItem(persistentDismissKey) === '1' && !force) return;
    scheduledRef.current = true;
    const delay = force ? 0 : Math.round(1000 + Math.random() * 3000); // 1-4s
    const id = window.setTimeout(() => {
      setVisible(true);
      scheduledRef.current = false;
      // Dispatch event (analytics hook opcional)
      try {
        window.dispatchEvent(new CustomEvent('floating-cta:show', { detail: { variant, pathname } }));
      } catch { /* ignore */ }
    }, delay);
    timers.current.push(id);
  }, [eligible, visible, persistentDismissKey, force, variant, pathname]);

  // Auto-hide + re-agendamento se continuar elegível
  useEffect(() => {
    if (!visible) return;
    const hideId = window.setTimeout(() => {
      setVisible(false);
      if (sessionStorage.getItem(persistentDismissKey) === '1' && !force) return;
      if (!eligible) return;
      const nextDelay = Math.round(30_000 + Math.random() * 60_000); // 30-90s
      const id2 = window.setTimeout(() => {
        if (!eligible) return;
        setVisible(true);
        try {
          window.dispatchEvent(new CustomEvent('floating-cta:show', { detail: { variant, pathname, repeat: true } }));
        } catch { /* ignore */ }
      }, nextDelay);
      timers.current.push(id2);
    }, 8_000); // visível por 8s
    timers.current.push(hideId);
    return () => clearTimeout(hideId);
  }, [visible, eligible, force, persistentDismissKey, variant, pathname]);

  const dismiss = (permanent = false) => {
    setVisible(false);
    if (permanent) {
      try { sessionStorage.setItem(persistentDismissKey, '1'); } catch { /* ignore */ }
      try { window.dispatchEvent(new CustomEvent('floating-cta:dismiss', { detail: { variant, pathname, permanent: true } })); } catch { /* ignore */ }
    } else {
      try { window.dispatchEvent(new CustomEvent('floating-cta:dismiss', { detail: { variant, pathname, permanent: false } })); } catch { /* ignore */ }
    }
  };

  // Limpeza de timers on unmount
  useEffect(() => {
    const arr = timers.current; // captura referência mutável
    return () => {
      arr.forEach((id) => clearTimeout(id));
    };
  }, []);

  if (disabled || !mounted) return null;

  // Copy por variante
  const copy = variant === 'A'
    ? {
        title: 'Últimos filhotes disponíveis!',
        cta: 'Ver agora',
      }
    : {
        title: 'Novos filhotes chegaram 🐶',
        cta: 'Conhecer',
      };

  // Evita sobrepor botão WhatsApp (fica lado esquerdo)
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-site-shell="cta"
          initial={{ opacity: 0, x: -40, scale: reduce ? 1 : 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -40, scale: reduce ? 1 : 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed left-4 bottom-28 z-[60] max-w-[240px] sm:max-w-xs"
          role="dialog"
          aria-label="Filhotes disponíveis"
        >
          <div className="relative rounded-2xl bg-emerald-800 text-white shadow-xl ring-1 ring-emerald-300/30 p-4 pr-10">
            <div className="flex items-start gap-2">
              <FlameIcon className="text-amber-300 flex-shrink-0" />
              <p className="text-sm leading-snug font-medium">
                {copy.title}<br />
                <Link
                  href={routes.filhotes}
                  className="mt-1 inline-block rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                  data-variant={variant}
                >
                  {copy.cta}
                </Link>
              </p>
            </div>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => dismiss(false)}
              className="absolute top-1.5 right-1.5 rounded-full px-1.5 py-1 text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              ×
            </button>
            <button
              type="button"
              aria-label="Não mostrar novamente"
              onClick={() => dismiss(true)}
              className="absolute -bottom-5 left-0 text-[10px] text-emerald-700/70 hover:text-emerald-800/90 dark:text-emerald-200/60 dark:hover:text-emerald-100"
              data-variant={variant}
            >
              ocultar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingPuppiesCTA;
