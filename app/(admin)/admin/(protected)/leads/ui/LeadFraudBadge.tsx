"use client";

import { ShieldAlert, ShieldCheck, ShieldQuestion, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

type Fraud = {
 score: number;
 reason: string;
 actions: string[];
 badge: "low" | "medium" | "high";
};

const palette: Record<Fraud["badge"], string> = {
 low: "admin-badge admin-badge-success",
 medium: "admin-badge admin-badge-warning",
 high: "admin-badge admin-badge-danger",
};

export function LeadFraudBadge({ leadId }: { leadId: string }) {
 const [pending, start] = useTransition();
 const [fraud, setFraud] = useState<Fraud | null>(null);
 const [error, setError] = useState<string | null>(null);

 const run = () => {
 setError(null);
 start(async () => {
 try {
 const res = await fetch("/api/admin/leads/fraud", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ leadId }),
 });
 const json = await res.json();
 if (!res.ok) throw new Error(json?.error || "Erro ao avaliar fraude");
 setFraud(json.fraud);
 } catch (e) {
 setError((e as Error).message);
 }
 });
 };

 const icon =
 fraud?.badge === "high" ? (
 <ShieldAlert className="h-4 w-4" aria-hidden />
 ) : fraud?.badge === "medium" ? (
 <ShieldQuestion className="h-4 w-4" aria-hidden />
 ) : fraud?.badge === "low" ? (
 <ShieldCheck className="h-4 w-4" aria-hidden />
 ) : null;

 return (
 <div className="admin-glass-card admin-interactive p-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 {icon}
 <div>
 <p className="text-sm font-semibold admin-text">FraudGuard AI</p>
 <p className="text-xs admin-text-muted">Detecta padrões suspeitos no lead.</p>
 </div>
 </div>
 <button
 type="button"
 onClick={run}
 disabled={pending}
 className="admin-btn-glass inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
 Analisar
 </button>
 </div>

 {error && (
 <p className="mt-2 text-sm" style={{ color: "rgb(var(--admin-danger))" }}>
 {error}
 </p>
 )}

 {fraud && (
 <div className="mt-3 space-y-2">
 <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-semibold ${palette[fraud.badge]}`}>
 Score {fraud.score} / 100
 </span>
 <p className="text-sm admin-text">{fraud.reason}</p>
 {fraud.actions.length > 0 && (
 <ul className="list-disc space-y-1 pl-5 text-xs admin-text-muted">
 {fraud.actions.map((a) => (
 <li key={a}>{a}</li>
 ))}
 </ul>
 )}
 </div>
 )}
 </div>
 );
}
