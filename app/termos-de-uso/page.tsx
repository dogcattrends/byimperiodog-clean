import type { Metadata } from "next";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";

const path = "/termos-de-uso";
const lastUpdated = "2025-10-18T09:00:00.000Z";

const tocItems = [
  { id: "escopo", label: "Escopo dos serviços" },
  { id: "limitacoes", label: "Limitações e responsabilidades" },
  { id: "garantias", label: "Garantias e isenções" },
  { id: "foro", label: "Foro aplicável" },
];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Termos de Uso | By Império Dog",
    description:
      "Condições de uso dos conteúdos e serviços consultivos da By Império Dog para tutores do Spitz Alemão Lulu da Pomerânia.",
    path,
  });
}

export default function TermosDeUsoPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-16 text-zinc-800">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Condições legais</p>
        <h1 className="text-4xl font-bold text-zinc-900">Termos de Uso</h1>
        <p className="text-lg text-zinc-600">
          Estes termos regulam o acesso aos materiais, orientações personalizadas e serviços de suporte prestados pela By Império
          Dog aos tutores do Spitz Alemão Lulu da Pomerânia.
        </p>
      </header>

      <TOC items={tocItems} />

      <section id="escopo" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Escopo dos serviços</h2>
        <p className="text-zinc-600">
          Prestamos consultoria individual, materiais educativos, cronogramas de socialização e suporte remoto contínuo relacionados
          ao Spitz Alemão Anão Lulu da Pomerânia. Nenhum conteúdo substitui avaliação presencial de profissionais habilitados.
        </p>
      </section>

      <section id="limitacoes" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Limitações e responsabilidades</h2>
        <p className="text-zinc-600">
          O tutor é responsável por seguir protocolos veterinários, legislação local e orientações de segurança. A By Império Dog
          não responde por danos decorrentes do uso indevido das informações disponibilizadas.
        </p>
      </section>

      <section id="garantias" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Garantias e isenções</h2>
        <p className="text-zinc-600">
          Garantimos transparência documental, histórico de saúde, suporte técnico e acompanhamento em etapas críticas. Serviços
          adicionais exigem aceite específico e podem ser ajustados conforme disponibilidade.
        </p>
      </section>

      <section id="foro" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Foro aplicável</h2>
        <p className="text-zinc-600">
          Fica eleito o foro da comarca de Atibaia/SP para dirimir conflitos relacionados a estes Termos, com renúncia a qualquer
          outro, por mais privilegiado que seja.
        </p>
      </section>

      <LastUpdated buildTime={process.env.NEXT_PUBLIC_BUILD_TIME} contentTime={lastUpdated} />
    </main>
  );
}
