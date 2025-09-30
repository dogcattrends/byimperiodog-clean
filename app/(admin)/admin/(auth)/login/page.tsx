"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
	const [pwd, setPwd] = useState("");
	const [msg, setMsg] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [showPwd, setShowPwd] = useState(false);
	const [capsOn, setCapsOn] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const err = searchParams?.get("error");
		if (err) setMsg("Sessão expirada ou acesso negado. Faça login novamente.");
	}, [searchParams]);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setMsg(null);
		setLoading(true);

		const r = await fetch("/api/admin/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password: pwd.trim() }),
		});

		if (r.ok) {
			router.replace("/admin/dashboard");
			router.refresh();
		} else {
			setLoading(false);
			const j = await r.json().catch(() => ({}));
			setMsg(j.error || "Senha inválida.");
		}
	}

	return (
		<main className="relative mx-auto grid min-h-[60vh] max-w-sm place-items-center px-4 py-12">
			{loading && (
				<div className="fixed inset-0 z-50 grid place-items-center bg-white/80 backdrop-blur-sm" aria-live="polite" aria-busy>
					<div className="flex flex-col items-center gap-4 rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-black/5">
						<div className="relative h-24 w-24">
							<div className="absolute inset-0 animate-ping rounded-full bg-emerald-200/60"></div>
							<Image src="/spitz-hero-mobile.png" alt="" className="relative rounded-full object-cover ring-2 ring-emerald-500/30" width={96} height={96} />
						</div>
						<div className="flex items-center gap-2 text-2xl" aria-hidden>
							<span className="paw">{"\uD83D\uDC3E"}</span>
							<span className="paw">{"\uD83D\uDC3E"}</span>
							<span className="paw">{"\uD83D\uDC3E"}</span>
						</div>
					</div>
				</div>
			)}

			<form onSubmit={submit} aria-busy={loading} className="w-full space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
				<h1 className="text-lg font-semibold text-zinc-900">Login do Admin</h1>
				<label className="block text-sm font-medium text-zinc-700">Senha</label>
				<div className="relative">
					<input
						type={showPwd ? "text" : "password"}
						placeholder="Senha do admin"
						className="w-full rounded-xl border px-3 py-2 pr-12 text-sm disabled:opacity-60"
						value={pwd}
						onChange={(e) => setPwd(e.target.value)}
						onKeyUp={(e) => setCapsOn((e as any).getModifierState?.("CapsLock") || false)}
						onKeyDown={(e) => setCapsOn((e as any).getModifierState?.("CapsLock") || false)}
						disabled={loading}
						autoFocus
						autoComplete="current-password"
					/>
					<button
						type="button"
						onClick={() => setShowPwd((v) => !v)}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
						aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
						tabIndex={-1}
					>
						{showPwd ? "Ocultar" : "Mostrar"}
					</button>
				</div>
				{capsOn && <p className="-mt-1 text-xs text-amber-700">Caps Lock ativado</p>}
				<button disabled={loading || !pwd.trim()} className="w-full rounded-xl bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-50">
					{loading ? "Carregando..." : "Entrar"}
				</button>
				{msg && <p className="text-sm text-red-600">{msg}</p>}
			</form>

			<style jsx>{`
				@keyframes paw-walk {
					0% { opacity: 0.2; transform: translateY(6px) scale(0.9) rotate(-10deg); }
					50% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
					100% { opacity: 0.2; transform: translateY(-6px) scale(0.9) rotate(10deg); }
				}
				.paw { animation: paw-walk 900ms infinite ease-in-out; }
				.paw:nth-child(2) { animation-delay: 150ms; }
				.paw:nth-child(3) { animation-delay: 300ms; }
			`}</style>
		</main>
	);
}
