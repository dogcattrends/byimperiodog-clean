import { AlertTriangle, Brain, Copy, Loader2, PawPrint, Sparkles } from "lucide-react";

import type { LeadAdvisorSnapshot, AdvisorMessage } from "@/lib/ai/leadAdvisor";

import type { LeadPuppyMatch, LeadStatus } from "../queries";

type LeadAiSummaryCardProps = {
 advisor: LeadAdvisorSnapshot;
 matchedPuppy?: LeadPuppyMatch | null;
};

export function LeadAiSummaryCard({ advisor, matchedPuppy }: LeadAiSummaryCardProps) {
 return (
 <article className="admin-glass-card admin-interactive p-4">
 <header className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold admin-text">Leitura da IA</p>
 <p className="text-xs admin-text-muted">Compatibilidade e prioridade</p>
 </div>
 <Brain className="h-5 w-5" style={{ color: 'rgb(var(--admin-accent))' }} aria-hidden />
 </header>
 <div className="mt-4 space-y-3 text-sm admin-text">
 <p className="text-base font-semibold">
 {advisor.compatibility.label} · {advisor.compatibility.score}%
 </p>
 <p className="admin-text-muted">{advisor.compatibility.summary}</p>
 {matchedPuppy && (
 <div className="rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'rgba(var(--admin-border),0.25)', background: 'rgba(var(--admin-surface-2),0.45)' }}>
 <p className="font-semibold">Match sugerido</p>
 <p className="admin-text-muted">{matchedPuppy.name}</p>
 </div>
 )}
 <div className="rounded-xl border border-dashed px-3 py-2 text-xs" style={{ borderColor: 'rgba(var(--admin-border),0.35)', background: 'rgba(var(--admin-surface-2),0.25)' }}>
 <p className="font-semibold admin-text">Prioridade {advisor.priority.level.toUpperCase()}</p>
 <p className="admin-text-muted">{advisor.priority.reason}</p>
 </div>
 </div>
 </article>
 );
}

type LeadStatusSuggestionCardProps = {
 advisor: LeadAdvisorSnapshot;
 currentStatus: LeadStatus;
 suggestedStatus: LeadStatus | null;
 mutating: LeadStatus | null;
 onApply: (status: LeadStatus) => void | Promise<void>;
};

export function LeadStatusSuggestionCard({ advisor, currentStatus, suggestedStatus, mutating, onApply }: LeadStatusSuggestionCardProps) {
 const canApply = suggestedStatus && suggestedStatus !== currentStatus;

 return (
 <article className="admin-glass-card admin-interactive flex flex-col p-4">
 <header className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold admin-text">Próximo passo</p>
 <p className="text-xs admin-text-muted">Sugestão automática</p>
 </div>
 <Sparkles className="h-5 w-5" style={{ color: 'rgb(var(--admin-warning))' }} aria-hidden />
 </header>
 <div className="mt-4 flex-1 space-y-3 text-sm admin-text">
 <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'rgba(var(--admin-border),0.25)', background: 'rgba(var(--admin-surface-2),0.45)' }}>
 <p className="text-xs admin-text-muted">Status indicado</p>
 <p className="text-base font-semibold admin-text">{advisor.status.label}</p>
 </div>
 <p className="admin-text-muted">{advisor.status.reason}</p>
 </div>
 <button
 type="button"
 disabled={!canApply || mutating === suggestedStatus}
 onClick={() => suggestedStatus && onApply(suggestedStatus)}
 className="admin-btn-primary mt-4 inline-flex w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
 >
 {mutating === suggestedStatus ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Aplicar status"}
 </button>
 </article>
 );
}

type LeadLossCardProps = {
 loss: LeadAdvisorSnapshot["loss"];
 copying: boolean;
 onCopy: () => void;
};

export function LeadLossCard({ loss, copying, onCopy }: LeadLossCardProps) {
 return (
 <article className="admin-glass-card admin-interactive p-4">
 <header className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold admin-text">Risco de perda</p>
 <p className="text-xs admin-text-muted">Monitoramento automático</p>
 </div>
 <AlertTriangle className="h-5 w-5" style={{ color: loss.isCold ? 'rgb(var(--admin-danger))' : 'rgb(var(--admin-text-soft))' }} aria-hidden />
 </header>
 <div className="mt-4 space-y-2 text-sm admin-text">
 <div className={loss.isCold ? "admin-badge admin-badge-danger" : "admin-badge admin-badge-info"}>
 {loss.isCold ? "Lead frio" : "Dentro da janela"}
 </div>
 <p className="admin-text-muted">{loss.summary}</p>
 <p className="text-xs admin-text-muted">Última atualização há {loss.hoursSinceUpdate}h</p>
 </div>
 <button
 type="button"
 onClick={onCopy}
 className="admin-btn-glass mt-4 inline-flex w-full items-center justify-center gap-2"
 >
 {copying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Copiar reativação
 </button>
 </article>
 );
}

type LeadMessageStylesProps = {
 messages: AdvisorMessage[];
 copyingStyle: string | null;
 onCopy: (text: string, label: string, styleId?: string) => void;
};

export function LeadMessageStyles({ messages, onCopy, copyingStyle }: LeadMessageStylesProps) {
 if (!messages.length) return null;

 return (
 <section className="admin-glass-card admin-interactive p-4">
 <header className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold admin-text">Estilos de mensagem</p>
 <p className="text-xs admin-text-muted">IA sugere 3 variações</p>
 </div>
 <PawPrint className="h-5 w-5" style={{ color: 'rgb(var(--admin-brand))' }} aria-hidden />
 </header>
 <div className="mt-4 grid gap-3 md:grid-cols-3">
 {messages.map((message) => (
 <article
 key={message.id}
 className="flex flex-col rounded-xl border p-3 text-sm"
 style={{ borderColor: 'rgba(var(--admin-border),0.25)', background: 'rgba(var(--admin-surface-2),0.35)' }}
 >
 <p className="text-xs font-semibold uppercase tracking-wide admin-text-muted">{message.label}</p>
 <p className="mt-2 flex-1 admin-text-muted">{message.text}</p>
 <button
 type="button"
 onClick={() => onCopy(message.text, message.label, message.id)}
 className="admin-btn-glass mt-3 inline-flex w-full items-center justify-center gap-2"
 >
 {copyingStyle === message.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Copiar
 </button>
 </article>
 ))}
 </div>
 </section>
 );
}
