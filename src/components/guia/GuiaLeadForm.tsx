"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import PrimaryCTA from "@/components/ui/PrimaryCTA";
import track from "@/lib/track";
import { captureUtmFromLocation } from "@/lib/utm";

type FormFields = {
 name: string;
 whatsapp: string;
 email: string;
 consent: boolean;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

type SubmitStatus = "idle" | "loading" | "success" | "error";

const DEFAULT_FIELDS: FormFields = {
 name: "",
 whatsapp: "",
 email: "",
 consent: false,
};

const sanitizePhone = (value: string) => {
 const digits = value.replace(/\D+/g, "");
 if (digits.startsWith("55") && digits.length >= 12) return digits.slice(2);
 return digits;
};

export function GuiaLeadForm() {
 const [fields, setFields] = useState<FormFields>(DEFAULT_FIELDS);
 const [errors, setErrors] = useState<FormErrors>({});
 const [status, setStatus] = useState<SubmitStatus>("idle");
 const [message, setMessage] = useState("");
 const [downloadToken, setDownloadToken] = useState<string | null>(null);

 const hasConsent = fields.consent;
 const isSubmitting = status === "loading";

 const handleChange = (key: keyof FormFields) => (event: ChangeEvent<HTMLInputElement>) => {
 const value = key === "consent" ? event.target.checked : event.target.value;
 setFields((prev) => ({ ...prev, [key]: value }));
 setErrors((prev) => ({ ...prev, [key]: undefined }));
 };

 const validate = () => {
 const next: FormErrors = {};
 if (fields.name.trim().length < 2) next.name = "Informe seu nome";
 const phoneDigits = sanitizePhone(fields.whatsapp);
 if (!phoneDigits || phoneDigits.length < 10) next.whatsapp = "Informe um WhatsApp válido";
 if (phoneDigits.length > 11) next.whatsapp = "Use DDD + número";
 if (fields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
 next.email = "Informe um e-mail válido";
 }
 if (!hasConsent) next.consent = "Você precisa concordar com os termos";
 setErrors(next);
 return Object.keys(next).length === 0;
 };

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 if (!validate()) return;
 setStatus("loading");
 setMessage("");

 const payload = {
 nome: fields.name.trim(),
 telefone: sanitizePhone(fields.whatsapp),
 cidade: "Online",
 estado: "SP",
 email: fields.email.trim() || null,
 consent_lgpd: hasConsent,
 consent_version: "1.0",
 page_type: "guia",
 page_slug: "guia",
 page: typeof window !== "undefined" ? window.location.pathname : undefined,
 page_url: typeof window !== "undefined" ? window.location.href : undefined,
 ...captureUtmFromLocation(),
 };

 try {
 const response = await fetch("/api/leads", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });
 const result = await response.json().catch(() => ({}));
 if (!response.ok) {
 setStatus("error");
 setMessage(result?.error ?? "Erro ao enviar. Tente novamente.");
 return;
 }
 setStatus("success");
 setMessage("Obrigado! O guia já está pronto para download.");
 const token = result?.downloadToken ?? null;
 setDownloadToken(token);
 const downloadUrl = token ? `/download/guia?token=${token}` : null;
 if (hasConsent) {
 track.event?.("lead_submit", { page: "guia", whatsapp: fields.whatsapp, email_provided: Boolean(fields.email) });
 }

 // Inicia o download automaticamente após o submit bem-sucedido.
 if (typeof window !== "undefined" && downloadUrl) {
  window.location.href = downloadUrl;
 }
 } catch (error) {
 setStatus("error");
 setMessage("Erro inesperado. Recarregue e tente novamente.");
 }
 };

 const downloadTracker = useMemo(
 () => () => track.event?.("pdf_downloaded", { page: "guia", format: "pdf" }),
 [],
 );

 if (status === "success") {
 return (
 <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
 <p className="text-lg font-semibold text-[var(--text)]">Guia pronto!</p>
 <p className="text-sm text-[var(--text-muted)]">{message}</p>
 <PrimaryCTA
      href={downloadToken ? `/download/guia?token=${downloadToken}` : "/guia"}
 tracking={{ location: "guia_page", ctaId: "guia_pdf_download" }}
 onClick={downloadTracker}
 >
      {downloadToken ? "Baixar agora" : "Gerar link de download"}
 </PrimaryCTA>
     {!downloadToken ? (
      <p className="text-xs text-rose-600" role="alert">
        Não foi possível gerar o link de download agora. Recarregue a página e envie novamente.
      </p>
     ) : null}
 </div>
 );
 }

 return (
 <form className="space-y-4" onSubmit={handleSubmit} noValidate>
 {message && (
 <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
 {message}
 </div>
 )}
 <div>
 <label htmlFor="guia-name" className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
 Nome
 </label>
 <input
 id="guia-name"
 name="name"
 type="text"
 className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/40"
 value={fields.name}
 onChange={handleChange("name")}
 aria-describedby={errors.name ? "guia-name-error" : undefined}
 />
 {errors.name && (
 <p id="guia-name-error" className="mt-1 text-xs text-rose-600" role="alert">
 {errors.name}
 </p>
 )}
 </div>

 <div>
 <label htmlFor="guia-whatsapp" className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
 WhatsApp
 </label>
 <input
 id="guia-whatsapp"
 name="whatsapp"
 type="tel"
 className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/40"
 value={fields.whatsapp}
 onChange={handleChange("whatsapp")}
 aria-describedby={errors.whatsapp ? "guia-whatsapp-error" : undefined}
 />
 {errors.whatsapp && (
 <p id="guia-whatsapp-error" className="mt-1 text-xs text-rose-600" role="alert">
 {errors.whatsapp}
 </p>
 )}
 </div>

 <div>
 <label htmlFor="guia-email" className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
 E-mail (opcional)
 </label>
 <input
 id="guia-email"
 name="email"
 type="email"
 className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/40"
 value={fields.email}
 onChange={handleChange("email")}
 />
 </div>

 <div className="flex items-start gap-3">
 <input
 id="guia-consent"
 name="consent"
 type="checkbox"
 checked={fields.consent}
 onChange={handleChange("consent")}
 className="h-4 w-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]"
 />
 <label htmlFor="guia-consent" className="text-sm text-[var(--text)]">
 Li e concordo com a política de privacidade e autorizo o envio do guia.
 </label>
 </div>
 {errors.consent && (
 <p className="text-xs text-rose-600" role="alert">
 {errors.consent}
 </p>
 )}

 <PrimaryCTA type="submit" disabled={isSubmitting} tracking={{ location: "guia_form", ctaId: "guia_form_submit" }}>
 {isSubmitting ? "Enviando..." : "Enviar e baixar o guia"}
 </PrimaryCTA>
 {status === "error" && (
 <p className="text-xs text-rose-600" role="alert">
 {message || "Erro ao enviar. Tente novamente."}
 </p>
 )}
 </form>
 );
}
