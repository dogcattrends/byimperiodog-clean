"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

export default function AdminLoginPage() {
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const successTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.body.classList.add("admin-login-context");
    return () => document.body.classList.remove("admin-login-context");
  }, []);

  useEffect(() => {
    const err = searchParams?.get("error");
    if (err) setMsg("Sessao expirada ou acesso negado. Faca login novamente.");
  }, [searchParams]);

  const handleCapsLock = (
    event: KeyboardEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>
  ) => {
    if ("getModifierState" in event && typeof event.getModifierState === "function") {
      setCapsOn(event.getModifierState("CapsLock"));
    } else {
      setCapsOn(false);
    }
  };

  useEffect(() => {
    return () => {
      if (successTimeout.current) {
        clearTimeout(successTimeout.current);
      }
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const password = pwd.trim();
    if (!password) {
      setMsg("Informe a senha de acesso.");
      return;
    }

    setLoading(true);
    setMsg(null);
    setSuccess(false);
    if (successTimeout.current) {
      clearTimeout(successTimeout.current);
      successTimeout.current = null;
    }
    let succeeded = false;
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        succeeded = true;
        setSuccess(true);
        setMsg("Acesso liberado! Redirecionando...");
        successTimeout.current = setTimeout(() => {
          router.replace("/admin/dashboard");
          router.refresh();
          successTimeout.current = null;
        }, 900);
        return;
      }

      const data = await response.json().catch(() => ({}));
      setMsg(typeof data.error === "string" ? data.error : "Senha invalida.");
    } catch {
      setMsg("Nao foi possivel entrar agora. Tente novamente.");
    } finally {
      if (!succeeded) {
        setLoading(false);
      }
    }
  };

  const lengthInfo = useMemo(() => {
    const length = pwd.length;
    const progress = Math.min(length, 16) / 16 * 100;
    const label = `${length} caractere${length === 1 ? "" : "s"} digitado${length === 1 ? "" : "s"}`;
    return { length, progress, label };
  }, [pwd]);

  const describedBy = useMemo(() => {
    const ids: string[] = [];
    if (capsOn) ids.push("caps-lock-indicator");
    if (msg) ids.push("login-feedback");
    if (lengthInfo.length) ids.push("password-length-indicator");
    return ids.length ? ids.join(" ") : undefined;
  }, [capsOn, msg, lengthInfo.length]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50/90 to-emerald-50 px-4 py-16">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.1),_transparent_55%)]" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.65),_transparent_60%)]" />
      <span
        aria-hidden
        className="paw-trail paw-trail--left"
        style={{ "--paw-rotate": "-12deg" } as CSSProperties}
      />
      <span
        aria-hidden
        className="paw-trail paw-trail--right"
        style={{ "--paw-rotate": "18deg" } as CSSProperties}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="floating-orb absolute left-6 top-12 h-40 w-40" />
        <span className="floating-orb floating-orb--alt absolute right-10 top-1/3 h-52 w-52" />
        <span className="floating-orb floating-orb--slow absolute left-1/2 bottom-8 h-40 w-40 -translate-x-1/2" />
      </div>

      <div className="relative w-full max-w-md space-y-6 overflow-hidden rounded-[32px] border border-emerald-200/70 bg-white/90 px-8 py-10 shadow-[0_30px_70px_-40px_rgba(15,118,110,0.6)] backdrop-blur">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-white/40 via-transparent to-emerald-200/20" />
          <AnimatePresence>
            {success && (
              <motion.div
                key="login-success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-emerald-900/5 backdrop-blur"
              >
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-300/40 bg-white/90 px-8 py-9 text-center text-emerald-900 shadow-[0_26px_60px_-32px_rgba(16,185,129,0.65)]"
                >
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-500/10 text-emerald-600"
                    aria-hidden
                  >
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </motion.span>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600/80">
                    Acesso liberado
                  </p>
                  <p className="text-xs text-emerald-900/70">
                    Conectando você ao hub especial dos Spitz. Preparando métricas e histórias em instantes.
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="admin-badge inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-800">
              Cuidado Spitz
            </span>
            <h1 className="mt-3 text-2xl font-semibold text-emerald-950">Portal da criadora</h1>
            <p className="mt-1 text-sm text-emerald-800">
              Acesse relatórios, histórias e métricas que mantêm os filhotes Lulu da Pomerânia sempre em destaque.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            title="Voltar ao site"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </a>
        </div>
          <header className="space-y-2 text-center">
            <div className="glow-badge mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/40">
              <span className="text-xl font-bold">BI</span>
            </div>
            <h1 className="text-2xl font-semibold text-emerald-950">Área Administrativa</h1>
            <p className="text-sm text-emerald-700">
              Acesso restrito. Informe a senha fornecida pela equipe.
            </p>
          </header>

          <form onSubmit={submit} className="space-y-5" aria-busy={loading}>
            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm font-medium text-emerald-950">
                Senha
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-medium tracking-[0.2em] text-emerald-950 caret-emerald-500 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-60"
                  placeholder="Digite a senha do time"
                  value={pwd}
                  onChange={(event) => setPwd(event.currentTarget.value)}
                  onKeyDown={handleCapsLock}
                  onKeyUp={handleCapsLock}
                  onFocus={handleCapsLock}
                  aria-describedby={describedBy}
                  aria-invalid={Boolean(msg)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center rounded-xl bg-emerald-100 px-3 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-200 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {capsOn ? (
                <p id="caps-lock-indicator" className="text-xs font-semibold text-amber-700" role="status">
                  Caps Lock esta ativado.
                </p>
              ) : null}
              <div className="space-y-2 pt-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-emerald-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 transition-all duration-500 ease-out"
                    style={{ width: `${lengthInfo.progress}%` }}
                    aria-hidden
                  />
                </div>
                <p
                  id="password-length-indicator"
                  className="text-[11px] font-medium text-emerald-700"
                  role="status"
                  aria-live="polite"
                >
                  {lengthInfo.label}
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn-aurora relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(5,150,105,0.65)] transition duration-300 hover:shadow-[0_24px_52px_-18px_rgba(5,150,105,0.75)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !pwd.trim()}
            >
              {loading ? "Entrando..." : "Entrar no painel"}
            </button>

            {msg ? (
              <p
                id="login-feedback"
                role="alert"
                aria-live="assertive"
                className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-inner"
              >
                {msg}
              </p>
            ) : null}
          </form>

          <p className="text-xs text-center text-emerald-700">
            Em caso de duvidas, fale com o responsavel de tecnologia ou #suporte-admin.
          </p>
          <p className="text-[11px] text-center text-emerald-600">
            Seguranca reforcada com consentimento e pixels alinhados ao marketing da By Imperio Dog.
          </p>
        </div>
      <style jsx>{`
        .paw-trail {
          position: absolute;
          width: 320px;
          height: 320px;
          opacity: 0.18;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 60 60'%3E%3Cg fill='%23d1f4d6'%3E%3Ccircle cx='18' cy='16' r='8'/%3E%3Ccircle cx='42' cy='16' r='8'/%3E%3Ccircle cx='30' cy='10' r='8'/%3E%3Cpath fill='%23b3f0c4' d='M30 28c-9 0-16 7.5-16 16.8 0 6 4.8 10.8 10.8 10.8 2.9 0 5.6-1.2 7.5-3.3 1.9 2.1 4.6 3.3 7.5 3.3 6 0 10.8-4.8 10.8-10.8C50 35.5 43 28 34 28h-4z'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 180px;
          background-repeat: no-repeat;
          filter: drop-shadow(0 20px 40px rgba(16, 185, 129, 0.18));
          animation: pawDrift 26s linear infinite;
        }
        .paw-trail--left {
          top: -60px;
          left: -40px;
          transform: rotate(-12deg);
        }
        .paw-trail--right {
          bottom: -40px;
          right: -20px;
          animation-delay: -9s;
          transform: rotate(18deg);
        }
        .admin-badge {
          box-shadow: 0 20px 35px -28px rgba(16, 185, 129, 0.65);
        }
        @keyframes floatOrb {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.75;
          }
          50% {
            transform: translate3d(0, -18px, 0) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.85;
          }
        }
        @keyframes badgePulse {
          0%,
          100% {
            box-shadow: 0 20px 45px -24px rgba(16, 185, 129, 0.9),
              0 0 0 0 rgba(16, 185, 129, 0.15);
          }
          50% {
            box-shadow: 0 24px 60px -26px rgba(5, 46, 43, 0.95),
              0 0 0 12px rgba(16, 185, 129, 0);
          }
        }
        @keyframes btnShine {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .floating-orb {
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, rgba(134, 239, 172, 0.35), transparent 65%);
          animation: floatOrb 18s ease-in-out infinite;
          filter: blur(0px);
        }
        .floating-orb--alt {
          background: radial-gradient(circle at 65% 35%, rgba(52, 211, 153, 0.25), transparent 75%);
          animation-duration: 22s;
          animation-delay: -6s;
        }
        .floating-orb--slow {
          background: radial-gradient(circle at 50% 50%, rgba(5, 46, 43, 0.28), transparent 70%);
          animation-duration: 26s;
          animation-direction: alternate;
        }
        .glow-badge {
          animation: badgePulse 8s ease-in-out infinite;
        }
        .btn-aurora::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 70%
          );
          transform: translateX(-120%);
          animation: btnShine 3s ease-in-out infinite;
        }
        .btn-aurora:disabled::after {
          display: none;
        }
        @keyframes pawDrift {
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(var(--paw-rotate, 0deg));
            opacity: 0.18;
          }
          50% {
            transform: translate3d(16px, -12px, 0) scale(1.04) rotate(calc(var(--paw-rotate, 0deg) + 3deg));
            opacity: 0.26;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(var(--paw-rotate, 0deg));
            opacity: 0.18;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .floating-orb,
          .floating-orb--alt,
          .floating-orb--slow,
          .glow-badge {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
          }
          .btn-aurora::after {
            animation: none;
          }
          .paw-trail {
            animation: none;
          }
        }
      `}</style>
      <style jsx global>{`
        body.admin-login-context header[role="banner"],
        body.admin-login-context footer[role="contentinfo"],
        body.admin-login-context nav[aria-label="Navegacao principal"] {
          display: none !important;
        }
        body.admin-login-context {
          background: transparent;
        }
      `}</style>
    </main>
  );
}
