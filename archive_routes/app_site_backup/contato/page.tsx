import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import Script from "next/script";
import { MessageCircle, Mail, Clock, MapPin, Instagram, Youtube } from "lucide-react";
import Link from "next/link";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
const WA = process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/5511999999999";
const WA_MSG = "Olá! Vim do site By Imperio Dog e quero saber sobre filhotes disponíveis.";
const EMAIL = "byimperiodog@gmail.com";

export const metadata: Metadata = {
  title: "Contato | By Imperio Dog",
  description: "Fale com o By Imperio Dog. WhatsApp e formulário com resposta rápida.",
  alternates: { canonical: `${SITE}/contato` },
};

export default function Contato() {
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
  name: "By Imperio Dog",
    url: SITE,
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", email: EMAIL, areaServed: "BR" },
    ],
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Contato", item: `${SITE}/contato` },
    ],
  };

  return (
  <main className="mx-auto max-w-6xl px-6 py-12 text-[var(--text)]">
      <Script id="ld-contact" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <Script id="ld-breadcrumb-contato" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold leading-tight">Fale com a gente</h1>
  <p className="mt-2 text-[var(--text-muted)]">Tire suas dúvidas. Respondemos rápido no WhatsApp e por e‑mail.</p>
      </header>

      <section className="grid gap-10 md:grid-cols-2">
        {/* Formulário */}
  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Envie uma mensagem</h2>
          <p className="mb-4 text-sm text-[var(--text-muted)]">Deixe seu contato e retornamos o mais breve possível.</p>
          <LeadForm />
        </div>

        {/* Canais diretos */}
        <div className="space-y-4">
          <a
            href={`${WA}?text=${encodeURIComponent(WA_MSG)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl bg-whatsapp px-5 py-4 text-on-whatsapp shadow hover:brightness-105 focus-visible:focus-ring"
          >
            <span className="flex items-center gap-3 font-semibold">
              <MessageCircle className="h-5 w-5" /> WhatsApp
            </span>
            <span className="text-white/90">Abrir conversa</span>
          </a>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="font-semibold">Outros canais</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-[var(--text-muted)]"><Mail className="h-4 w-4" /> {EMAIL}</li>
              <li className="flex items-center gap-2 text-[var(--text-muted)]"><Clock className="h-4 w-4" /> Atendimento: 09h às 19h (seg‑sáb)</li>
              <li className="flex items-center gap-2 text-[var(--text-muted)]"><MapPin className="h-4 w-4" /> Bragança Paulista - SP</li>
              <li className="flex items-center gap-2 text-[var(--text-muted)]"><MapPin className="h-4 w-4" /> Entrega combinada — consulte regiões</li>
            </ul>
            <div className="mt-3 flex gap-3">
              <a href="https://instagram.com/byimperiodog" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:focus-ring">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
              <a href="https://youtube.com/@byimperiodog" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:focus-ring">
                <Youtube className="h-4 w-4" /> YouTube
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ curto */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Perguntas rápidas</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[
            { q: "Posso reservar um filhote?", a: "Sim. Verificamos disponibilidade e condições pelo WhatsApp para orientar a reserva." },
            { q: "Como funciona a entrega?", a: "Combinamos a melhor alternativa para sua região, priorizando o bem‑estar do filhote." },
          ].map((f, i) => (
            <details key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
