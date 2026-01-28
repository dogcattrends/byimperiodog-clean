"use client";

import { Loader2, Lock, Mail, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const loggedOut = searchParams.get("logout") === "1";
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const emailTrimmed = email.trim();
 if (!emailTrimmed) {
 setError("Informe um email válido.");
 return;
 }
 if (!password) {
 setError("Informe a senha.");
 return;
 }

 setLoading(true);
 setError(null);
 try {
 const res = await fetch("/api/admin/login", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email: emailTrimmed, password }),
 });
 if (!res.ok) {
 const json = await res.json().catch(() => ({}));
 throw new Error(json.error || "Falha no login. Verifique as credenciais.");
 }
 router.push("/admin/dashboard");
 } catch (err) {
 const message = (err as Error)?.message || "Falha no login.";
 if (message.toLowerCase().includes("failed to fetch")) {
 setError("Não foi possível conectar ao servidor. Verifique se o Next está rodando e tente novamente.");
 return;
 }
 setError(message);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="w-full">
 <div className="admin-glass-card admin-border-glow p-8">
 <div className="mb-6 flex items-center gap-3">
 <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(var(--admin-brand), 0.12)" }}>
 <Shield className="h-5 w-5" style={{ color: "rgb(var(--admin-brand))" }} aria-hidden />
 </div>
 <div className="min-w-0">
 <h1 className="text-lg font-semibold leading-tight" style={{ color: "rgb(var(--admin-text))" }}>
 Painel Administrativo
 </h1>
 <p className="text-sm" style={{ color: "rgb(var(--admin-text-soft))" }}>
 By Império Dog
 </p>
 </div>
 </div>

 {loggedOut ? (
 <div className="admin-inline-message success" role="status" aria-live="polite">
 <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M5 13l4 4L19 7"
 />
 </svg>
 <span>Sessão encerrada. Faça login novamente.</span>
 </div>
 ) : null}

 <form onSubmit={handleSubmit} className="space-y-4">
 <label className="block">
 <span className="mb-2 block text-sm font-medium" style={{ color: "rgb(var(--admin-text-muted))" }}>
 Email
 </span>
 <div
 className="admin-interactive flex items-center gap-3 rounded-xl px-4 py-3"
 style={{
 background: "rgba(var(--admin-surface), 0.55)",
 border: "1px solid rgba(var(--admin-border), 0.6)",
 }}
 >
 <Mail className="h-4 w-4" style={{ color: "rgb(var(--admin-text-soft))" }} aria-hidden />
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="flex-1 bg-transparent text-sm outline-none"
 style={{ color: "rgb(var(--admin-text))" }}
 placeholder="admin@byimperiodog.com"
 autoComplete="email"
 aria-invalid={error?.toLowerCase().includes("email") || undefined}
 />
 </div>
 </label>

 <label className="block">
 <span className="mb-2 block text-sm font-medium" style={{ color: "rgb(var(--admin-text-muted))" }}>
 Senha
 </span>
 <div
 className="admin-interactive flex items-center gap-3 rounded-xl px-4 py-3"
 style={{
 background: "rgba(var(--admin-surface), 0.55)",
 border: "1px solid rgba(var(--admin-border), 0.6)",
 }}
 >
 <Lock className="h-4 w-4" style={{ color: "rgb(var(--admin-text-soft))" }} aria-hidden />
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="flex-1 bg-transparent text-sm outline-none"
 style={{ color: "rgb(var(--admin-text))" }}
 placeholder="••••••••"
 autoComplete="current-password"
 aria-invalid={error?.toLowerCase().includes("senha") || undefined}
 />
 </div>
 </label>

 {error && (
 <div className="admin-inline-message error" role="alert">
 <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
 />
 </svg>
 <span>{error}</span>
 </div>
 )}

 <button type="submit" disabled={loading} className="admin-btn-primary w-full">
 <span className="flex items-center justify-center gap-2">
 {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
 <span>{loading ? "Autenticando..." : "Entrar"}</span>
 </span>
 </button>
 </form>
 </div>
 </div>
 );
}
