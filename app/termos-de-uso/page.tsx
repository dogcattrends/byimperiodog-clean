import type { Metadata } from "next";
import Link from "next/link";

import LastUpdated from "@/components/common/LastUpdated";
import TOC from "@/components/common/TOC";
import { pageMetadata } from "@/lib/seo";

const UPDATED_AT = "2025-10-25";

export const metadata: Metadata = pageMetadata({
  title: "Termos de Uso | By Império Dog",
  description: "Condições de uso do site, responsabilidades e limitações.",
  path: "/termos-de-uso",
});

export default function TermosDeUsoPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-text">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold leading-tight">Termos de Uso</h1>
        <LastUpdated date={UPDATED_AT} className="mt-1 text-textMuted" />
      </header>

      <div className="mb-8">
        <TOC containerId="conteudo-termos" />
      </div>

      <div id="conteudo-termos" className="prose prose-zinc max-w-none">
        <section id="uso" className="mb-8">
          <h2 className="text-xl font-semibold">1. Uso do site</h2>
          <p className="mt-2">Este site tem caráter informativo e institucional. Ao navegar, você concorda em utilizar os recursos de boa-fé, sem práticas que possam comprometer sua segurança ou disponibilidade.</p>
        </section>

        <section id="conteudo" className="mb-8">
          <h2 className="text-xl font-semibold">2. Conteúdo e direitos autorais</h2>
          <p className="mt-2">Textos, imagens, logotipos e demais conteúdos publicados pertencem à By Império Dog ou a seus respectivos autores e são protegidos por direitos autorais. É proibida a reprodução não autorizada.</p>
        </section>

        <section id="responsabilidades" className="mb-8">
          <h2 className="text-xl font-semibold">3. Responsabilidades do usuário</h2>
          <p className="mt-2">O usuário compromete-se a fornecer informações verdadeiras quando entrar em contato e a não utilizar o site para atividades ilegais, ofensivas ou que infrinjam direitos de terceiros.</p>
        </section>

        <section id="limitacoes" className="mb-8">
          <h2 className="text-xl font-semibold">4. Limitações de responsabilidade</h2>
          <p className="mt-2">Empregamos esforços razoáveis para manter o site disponível e atualizado, porém não garantimos funcionamento ininterrupto. O uso das informações aqui presentes é de responsabilidade do usuário.</p>
        </section>

        <section id="contato" className="mb-8">
          <h2 className="text-xl font-semibold">5. Contato</h2>
          <p className="mt-2">Para dúvidas sobre estes termos, fale conosco:</p>
          <ul className="mt-2 list-disc pl-5">
            <li>E‑mail: <a className="underline decoration-brand underline-offset-4 focus-visible:outline-none focus-ring" href="mailto:byimperiodog@gmail.com">byimperiodog@gmail.com</a></li>
            <li>WhatsApp: <a className="underline decoration-brand underline-offset-4 focus-visible:outline-none focus-ring" href={(process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/5511999999999")} target="_blank" rel="noopener noreferrer">abrir conversa</a></li>
          </ul>
          <p className="mt-4 text-sm text-textMuted">Estes termos poderão ser atualizados para refletir alterações legais ou melhorias nos serviços.</p>
          <p className="mt-1 text-sm"><Link href="/" className="underline decoration-brand underline-offset-4 focus-visible:outline-none focus-ring">Voltar para a página inicial</Link></p>
        </section>
      </div>
    </main>
  );
}
