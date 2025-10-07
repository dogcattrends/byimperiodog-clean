"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const schema = z.object({
  nome: z.string().min(2, "Informe seu nome completo"),
  telefone: z.string().min(8, "Informe um WhatsApp válido"),
  cidade: z.string().min(2, "Informe cidade e estado"),
  preferencia: z.string().optional(),
  mensagem: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type SubmitStatus = "idle" | "success" | "error";

export default function LeadForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setStatus("idle");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Não foi possível enviar agora. Tente novamente em instantes.");
      }

      setStatus("success");
      reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Erro inesperado. Recarregue a página e tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-nome" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Nome completo
          </label>
          <input
            id="contato-nome"
            type="text"
            autoComplete="name"
            {...register("nome")}
            aria-invalid={errors.nome ? "true" : "false"}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Ex: Ana Souza"
          />
          {errors.nome && <p className="text-sm text-rose-600">{errors.nome.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-telefone" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            WhatsApp
          </label>
          <input
            id="contato-telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register("telefone")}
            aria-invalid={errors.telefone ? "true" : "false"}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="DDD + número"
          />
          {errors.telefone && <p className="text-sm text-rose-600">{errors.telefone.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-cidade" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Cidade / UF
          </label>
          <input
            id="contato-cidade"
            type="text"
            autoComplete="address-level2"
            {...register("cidade")}
            aria-invalid={errors.cidade ? "true" : "false"}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Ex: Bragança Paulista / SP"
          />
          {errors.cidade && <p className="text-sm text-rose-600">{errors.cidade.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-preferencia" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Preferência (opcional)
          </label>
          <input
            id="contato-preferencia"
            type="text"
            {...register("preferencia")}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Cor, sexo ou características desejadas"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contato-mensagem" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Conte-nos mais
        </label>
        <textarea
          id="contato-mensagem"
          rows={4}
          {...register("mensagem")}
          className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          placeholder="Como será a rotina do filhote? Existe data ideal para a chegada?"
        />
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            buttonVariants({ variant: "solid", size: "lg" }),
            "w-full justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          )}
        >
          {isSubmitting ? "Enviando..." : "Quero receber orientação personalizada"}
        </button>
        <div className="text-xs text-[var(--text-muted)]" aria-live="polite">
          {status === "success" && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[var(--text)]">
              Recebemos seu contato! Entraremos em contato pelo WhatsApp em até 2 horas.
            </p>
          )}
          {status === "error" && errorMessage && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-rose-600">
              {errorMessage}
            </p>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Respondemos de segunda a sábado, das 9h às 19h. Seus dados são usados apenas para contato relacionado aos filhotes.
        </p>
      </div>
    </form>
  );
}
