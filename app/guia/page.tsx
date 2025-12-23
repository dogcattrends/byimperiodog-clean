import type { Metadata } from "next";

import { GuiaLeadForm } from "@/components/guia/GuiaLeadForm";
import TrustBlock from "@/components/ui/TrustBlock";
import { TRUST_BLOCK_ITEMS } from "@/lib/trust-data";

export const metadata: Metadata = {
  title: "Guia completo do tutor | By Império Dog",
  description:
    "Baixe o guia gratuito para preparar a chegada do seu Spitz Alemão Anão: roteiro de socialização, checklist de saúde e conselhos da criadora.",
  alternates: { canonical: "/guia" },
};

export default function GuiaPage() {
  return (
    <main className="bg-gradient-to-b from-white to-zinc-50/80">
      <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Guia premium</p>
          <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Guarde o seu guia de preparação para o novo filhote
          </h1>
          <p className="max-w-3xl text-base text-zinc-600">
            Checklist de rotinas, orientações de saúde e microcopy de confiança para deixar o seu lar pronto. A entrega
            é totalmente digital, segura e rastreada, respeitando o consentimento e a privacidade da sua família.
          </p>
        </div>

        <div className="mt-10">
          <TrustBlock
            title="Confiança comprovada"
            description="Processo guiado, prova de pedigree e suporte vitalício"
            items={TRUST_BLOCK_ITEMS}
          />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="space-y-6 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">O que você recebe</h2>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span className="text-[var(--brand)]">•</span>
                Passo a passo para socialização, alimentação e saúde do filhote.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--brand)]">•</span>
                Modelo de rotina diária, cuidado com pelagem e viagens seguras.
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--brand)]">•</span>
                Linguagem de confiança para conversar com veterinários e familiares.
              </li>
            </ul>
            <p className="text-xs text-[var(--text-muted)]">
              O download é liberado imediatamente após o preenchimento do formulário com consentimento explícito.
            </p>
          </article>

          <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <GuiaLeadForm />
          </div>
        </div>
      </section>
    </main>
  );
}
