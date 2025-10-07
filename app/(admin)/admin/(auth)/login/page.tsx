"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AdminBodyClass from "@/components/admin/AdminBodyClass";

export default function AdminLoginPage() {
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const err = searchParams?.get("error");
    if (err) setMsg("Sessao expirada ou acesso negado. Faca login novamente.");
  }, [searchParams]);

  const handleCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsOn(event.getModifierState?.("CapsLock") ?? false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const password = pwd.trim();
    if (!password) {
      setMsg("Informe a senha de acesso.");
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.replace("/admin/dashboard");
        router.refresh();
        return;
      }

      const data = await response.json().catch(() => ({}));
      setMsg(typeof data.error === "string" ? data.error : "Senha invalida.");
    } catch {
      setMsg("Nao foi possivel entrar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminBodyClass />
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-16">
        <div className="w-full max-w-sm space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-8 shadow-xl">
          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-[var(--text)]">Area Administrativa</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Acesso restrito. Informe a senha fornecida pela equipe.
            </p>
          </header>

          <form onSubmit={submit} className="space-y-5" aria-busy={loading}>
            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm font-medium text-[var(--text)]">
                Senha
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60"
                  placeholder="Digite a senha do time"
                  value={pwd}
                  onChange={(event) => setPwd(event.currentTarget.value)}
                  onKeyDown={handleCapsLock}
                  onKeyUp={handleCapsLock}
                  disabled={loading}
                />
              </div>
              {capsOn ? (
                <p className="text-xs font-semibold text-amber-600" role="status">
                  Caps Lock esta ativado.
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !pwd.trim()}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {msg ? (
              <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {msg}
              </p>
            ) : null}
          </form>

          <p className="text-xs text-center text-[var(--text-muted)]">
            Em caso de duvidas, fale com o responsavel de tecnologia ou #suporte-admin.
          </p>
        </div>
      </main>
    </>
  );
}
