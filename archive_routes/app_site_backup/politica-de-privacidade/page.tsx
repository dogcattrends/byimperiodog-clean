import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/lib/route";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
const WA = process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/5511999999999";
const UPDATED_AT = "2025-08-29";

export const metadata: Metadata = {
  title: "Política de Privacidade | By Império Dog",
  description: "Como tratamos dados pessoais de visitantes, leads e clientes (LGPD).",
  alternates: { canonical: `${SITE}/politica-de-privacidade` },
};

export default function PoliticaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-text">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold leading-tight">Política de Privacidade</h1>
        <p className="mt-1 text-textMuted">Última atualização: {new Date(UPDATED_AT).toLocaleDateString("pt-BR")}</p>
      </header>

      <nav aria-label="Sumário" className="mb-8 grid gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium">Nesta página</p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <li><a className="underline decoration-brand underline-offset-4 hover:opacity-90 focus-visible:outline-none focus-ring" href="#coleta">1. Dados que coletamos</a></li>
          <li><a className="underline decoration-brand underline-offset-4 hover:opacity-90 focus-visible:outline-none focus-ring" href="#uso">2. Como usamos os dados</a></li>
          <li><a className="underline decoration-brand underline-offset-4 hover:opacity-90 focus-visible:outline-none focus-ring" href="#compartilhamento">3. Compartilhamento</a></li>
          <li><a className="underline decoration-brand underline-offset-4 hover:opacity-90 focus-visible:outline-none focus-ring" href="#direitos">4. Seus direitos (LGPD)</a></li>
          <li><a className="underline decoration-brand underline-offset-4 hover:opacity-90 focus-visible:outline-none focus-ring" href="#seguranca">5. Retenção e segurança</a></li>
          <li><a className="underline decoration-brand underline-offset-4 hover:opacity-90 focus-visible:outline-none focus-ring" href="#cookies">6. Cookies e analytics</a></li>
          <li><a className="underline decoration-brand underline-offset-4 hover:opacity-90 focus-visible:outline-none focus-ring" href="#contato">7. Contato do controlador</a></li>
        </ul>
      </nav>

      <section id="coleta" className="mb-8">
        <h2 className="text-xl font-semibold">1. Dados que coletamos</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Identificação e contato: nome, e‑mail, WhatsApp/telefone e cidade/UF.</li>
          <li>Preferências enviadas por você (ex.: interesse por filhote, sexo, cor).</li>
          <li>Dados técnicos mínimos de navegação (ex.: IP encurtado, páginas acessadas), quando aplicável.</li>
        </ul>
      </section>

      <section id="uso" className="mb-8">
        <h2 className="text-xl font-semibold">2. Como usamos os dados</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Responder mensagens e solicitações enviadas por você.</li>
          <li>Enviar propostas e informações sobre filhotes e disponibilidade.</li>
          <li>Melhorar o conteúdo do site e a experiência de atendimento.</li>
        </ul>
      </section>

      <section id="compartilhamento" className="mb-8">
        <h2 className="text-xl font-semibold">3. Compartilhamento</h2>
        <p className="mt-2">Não vendemos seus dados. Compartilhamos apenas com provedores essenciais (ex.: hospedagem, e‑mail, analytics), quando necessário para operar o site e prestar atendimento.</p>
      </section>

      <section id="direitos" className="mb-8">
        <h2 className="text-xl font-semibold">4. Seus direitos (LGPD)</h2>
        <p className="mt-2">Você pode solicitar acesso, correção, exclusão, portabilidade e informações sobre compartilhamento dos seus dados, além de revogar consentimentos quando aplicável.</p>
      </section>

      <section id="seguranca" className="mb-8">
        <h2 className="text-xl font-semibold">5. Retenção e segurança</h2>
        <p className="mt-2">Mantemos dados pelo tempo necessário ao atendimento e às obrigações legais. Adotamos medidas técnicas e organizacionais compatíveis com o porte do site.</p>
      </section>

      <section id="cookies" className="mb-8">
        <h2 className="text-xl font-semibold">6. Cookies e analytics</h2>
        <p className="mt-2">Podemos usar cookies para lembrar preferências e mensurar audiência. Você pode gerenciar cookies nas configurações do seu navegador.</p>
      </section>

      <section id="contato" className="mb-8">
        <h2 className="text-xl font-semibold">7. Contato do controlador</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>E‑mail: <a className="underline decoration-brand underline-offset-4 focus-visible:outline-none focus-ring" href="mailto:byimperiodog@gmail.com">byimperiodog@gmail.com</a></li>
          <li>WhatsApp: <a className="underline decoration-brand underline-offset-4 focus-visible:outline-none focus-ring" href={`${WA}?text=${encodeURIComponent("Olá! Quero falar sobre dados pessoais (LGPD).")}`} target="_blank" rel="noopener noreferrer">abrir conversa</a></li>
          <li>Endereço de atendimento: Bragança Paulista - SP</li>
        </ul>
        <p className="mt-4 text-sm text-textMuted">Esta política poderá ser atualizada para refletir melhorias de processos ou exigências legais.</p>
        <p className="mt-1 text-sm"><Link href={routes.home} className="underline decoration-brand underline-offset-4 focus-visible:outline-none focus-ring">Voltar para a página inicial</Link></p>
      </section>
    </main>
  );
}

