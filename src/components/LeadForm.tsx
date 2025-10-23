"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { trackLeadFormSubmit } from "@/lib/events";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Schema de validação com campos ampliados e LGPD
const schema = z.object({
  nome: z.string().min(2, "Informe seu nome completo"),
  telefone: z
    .string()
    .min(10, "Informe um WhatsApp válido com DDD")
    .regex(/^\d{10,11}$/, "Use apenas números (DDD + telefone)"),
  cidade: z.string().min(2, "Informe a cidade"),
  estado: z.string().length(2, "Informe a UF (ex: SP)").toUpperCase(),
  sexo_preferido: z.enum(["macho", "femea", "tanto_faz"], {
    errorMap: () => ({ message: "Selecione uma preferência" }),
  }).optional(),
  cor_preferida: z.string().optional(),
  prazo_aquisicao: z.enum(["imediato", "1_mes", "2_3_meses", "3_mais"], {
    errorMap: () => ({ message: "Selecione um prazo" }),
  }).optional(),
  mensagem: z.string().optional(),
  consent_lgpd: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar a Política de Privacidade" }),
  }),
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
      // Preparar payload com consent timestamp
      const payload = {
        ...data,
        consent_timestamp: new Date().toISOString(),
        consent_version: "1.0",
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        throw new Error(payloadError?.error || "Não foi possível enviar agora. Tente novamente em instantes.");
      }

      // Tracking
      trackLeadFormSubmit("lead-form-main");

      // Sucesso: resetar form
      setStatus("success");
      reset();

      // Redirecionar para WhatsApp após 2s com mensagem personalizada
      setTimeout(() => {
        const mensagemWhatsApp = `Olá! Acabei de preencher o formulário no site. Meu nome é *${data.nome}* e estou interessado(a) em conhecer os filhotes disponíveis. ${data.mensagem ? `\n\nMinhas observações: ${data.mensagem}` : ""}`;
        
        const whatsappURL = buildWhatsAppLink(mensagemWhatsApp);
        window.open(whatsappURL, "_blank");
      }, 2000);

    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Erro inesperado. Recarregue a página e tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5" noValidate>
      {/* Nome e WhatsApp */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-nome" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Nome completo *
          </label>
          <input
            id="contato-nome"
            type="text"
            autoComplete="name"
            {...register("nome")}
            aria-invalid={errors.nome ? "true" : "false"}
            aria-required="true"
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Ex: Ana Souza"
          />
          {errors.nome && <p className="text-sm text-rose-600">{errors.nome.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-telefone" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            WhatsApp *
          </label>
          <input
            id="contato-telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register("telefone")}
            aria-invalid={errors.telefone ? "true" : "false"}
            aria-required="true"
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="11999887766"
            maxLength={11}
          />
          {errors.telefone && <p className="text-sm text-rose-600">{errors.telefone.message}</p>}
        </div>
      </div>

      {/* Cidade e Estado */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-cidade" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Cidade *
          </label>
          <input
            id="contato-cidade"
            type="text"
            autoComplete="address-level2"
            {...register("cidade")}
            aria-invalid={errors.cidade ? "true" : "false"}
            aria-required="true"
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Ex: Bragança Paulista"
          />
          {errors.cidade && <p className="text-sm text-rose-600">{errors.cidade.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-estado" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            UF *
          </label>
          <input
            id="contato-estado"
            type="text"
            autoComplete="address-level1"
            {...register("estado")}
            aria-invalid={errors.estado ? "true" : "false"}
            aria-required="true"
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 uppercase"
            placeholder="SP"
            maxLength={2}
          />
          {errors.estado && <p className="text-sm text-rose-600">{errors.estado.message}</p>}
        </div>
      </div>

      {/* Sexo Preferido e Cor */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-sexo" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Sexo do Filhote
          </label>
          <select
            id="contato-sexo"
            {...register("sexo_preferido")}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          >
            <option value="">Selecione...</option>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
            <option value="tanto_faz">Tanto faz</option>
          </select>
          {errors.sexo_preferido && <p className="text-sm text-rose-600">{errors.sexo_preferido.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-cor" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Cor Preferida
          </label>
          <input
            id="contato-cor"
            type="text"
            {...register("cor_preferida")}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Ex: Chocolate, preto, azul..."
          />
        </div>
      </div>

      {/* Prazo de Aquisição */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contato-prazo" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Prazo para Aquisição
        </label>
        <select
          id="contato-prazo"
          {...register("prazo_aquisicao")}
          className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
        >
          <option value="">Selecione...</option>
          <option value="imediato">Imediato (até 15 dias)</option>
          <option value="1_mes">Até 1 mês</option>
          <option value="2_3_meses">2 a 3 meses</option>
          <option value="3_mais">Mais de 3 meses</option>
        </select>
        {errors.prazo_aquisicao && <p className="text-sm text-rose-600">{errors.prazo_aquisicao.message}</p>}
      </div>

      {/* Mensagem */}
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

      {/* Consentimento LGPD */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <input
            id="contato-consent"
            type="checkbox"
            {...register("consent_lgpd")}
            aria-invalid={errors.consent_lgpd ? "true" : "false"}
            aria-required="true"
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/40"
          />
          <label htmlFor="contato-consent" className="text-xs leading-relaxed text-[var(--text-muted)]">
            Li e aceito a{" "}
            <a
              href="/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] underline hover:no-underline"
            >
              Política de Privacidade
            </a>
            {" "}e autorizo o uso dos meus dados para contato sobre os filhotes. *
          </label>
        </div>
        {errors.consent_lgpd && <p className="text-sm text-rose-600">{errors.consent_lgpd.message}</p>}
      </div>

      {/* Submit e Mensagens de Feedback */}
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
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">
              ✅ Recebemos seu contato! Você será redirecionado ao WhatsApp em instantes...
            </p>
          )}
          {status === "error" && errorMessage && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-rose-600">
              ❌ {errorMessage}
            </p>
          )}
        </div>
        
        <p className="text-xs text-[var(--text-muted)]">
          * Campos obrigatórios. Respondemos de segunda a sábado, das 9h às 19h. Seus dados são protegidos conforme LGPD.
        </p>
      </div>
    </form>
  );
}
