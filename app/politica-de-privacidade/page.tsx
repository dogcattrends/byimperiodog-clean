import type { Metadata } from "next";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";

const path = "/politica-de-privacidade";
const lastUpdated = "2025-10-18T09:00:00.000Z";

const tocItems = [
  { id: "dados-coletados", label: "Dados coletados" },
  { id: "finalidades", label: "Finalidades e base legal" },
  { id: "retencao", label: "Retenção e segurança" },
  { id: "direitos", label: "Direitos do titular" },
  { id: "contato", label: "Contato do controlador" },
];

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Política de Privacidade | By Império Dog",
    description:
      "Entenda como a By Império Dog trata os dados de tutores interessados no Spitz Alemão Lulu da Pomerânia: coleta, finalidade, retenção e direitos garantidos pela LGPD.",
    path,
  });
}

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 px-6 py-16 text-zinc-800">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">LGPD</p>
        <h1 className="text-4xl font-bold text-zinc-900">Política de Privacidade</h1>
        <p className="text-lg text-zinc-600">
          A By Império Dog respeita sua privacidade e explica a seguir como tratamos dados pessoais durante o processo seletivo e
          o suporte vitalício aos tutores do Spitz Alemão Lulu da Pomerânia.
        </p>
      </header>

      <TOC items={tocItems} />

      <section id="dados-coletados" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Dados coletados</h2>
        <p className="text-zinc-600">
          Coletamos nome, e-mail, telefone, preferências sobre o Spitz Alemão Anão Lulu da Pomerânia, endereço para logística,
          histórico familiar relevante e informações fornecidas em formulários, videochamadas ou mensagens.
        </p>
      </section>

      <section id="finalidades" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Finalidades e base legal</h2>
        <p className="text-zinc-600">
          Usamos os dados para avaliar compatibilidade, organizar visitas, enviar materiais educativos, cumprir obrigações
          contratuais e oferecer suporte pós-entrega. As bases legais incluem execução de contrato (art. 7º, V) e legítimo
          interesse, sempre com transparência e opção de revogação quando aplicável.
        </p>
      </section>

      <section id="retencao" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Retenção e segurança</h2>
        <p className="text-zinc-600">
          Mantemos registros apenas enquanto necessários ao relacionamento ativo ou conforme exigido por lei. Aplicamos controle
          de acesso, criptografia em repouso, monitoração de logs e revisão periódica dos sistemas utilizados.
        </p>
      </section>

      <section id="direitos" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Direitos do titular</h2>
        <p className="text-zinc-600">
          Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, revogação de consentimento
          e eliminação. Respondemos gratuitamente em até 15 dias corridos, conforme a LGPD.
        </p>
      </section>

      <section id="contato" className="space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900">Contato do controlador</h2>
        <p className="text-zinc-600">
          Envie solicitações para <strong>privacidade@byimperiodog.com.br</strong> ou escreva para Rua Atibaia, 200 – Atibaia/SP,
          CEP 12940-000. Ao contatar, informe seu nome completo e meio de comunicação utilizado.
        </p>
      </section>

      <LastUpdated buildTime={process.env.NEXT_PUBLIC_BUILD_TIME} contentTime={lastUpdated} />
    </main>
  );
}
