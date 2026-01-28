import FAQBlock from "@/components/answer/FAQBlock";
import { GuiaLeadForm } from "@/components/guia/GuiaLeadForm";
import TrustBlock from "@/components/ui/TrustBlock";
import { pageMetadata } from "@/lib/seo";
import { TRUST_BLOCK_ITEMS } from "@/lib/trust-data";

export const metadata = pageMetadata({
 title: "Guia completo do tutor | By Império Dog",
 description:
 "Baixe o guia gratuito para preparar a chegada do seu Spitz Alemão Anão Lulu da Pomerânia: roteiro de socialização, checklist de saúde e conselhos da criadora.",
 path: "/guia",
});

const GUIA_SNIPPET =
 "O guia do tutor é um plano prático para preparar a casa e cuidar do Spitz Alemão Anão Lulu da Pomerânia; resume rotina, alimentação, higiene e socialização para evitar erros, acelerar a adaptação e organizar o dia a dia do novo lar.";

const GUIA_FAQ = [
 {
 question: "O guia é gratuito?",
 answer: "Sim. O download é liberado após o envio do formulário com consentimento informado.",
 },
 {
 question: "O material inclui a rotina de socialização?",
 answer: "Sim. Há orientações práticas para cada etapa e atividades guiadas.",
 },
 {
 question: "Posso compartilhar o guia com minha família?",
 answer: "Pode. O material foi pensado para alinhar todos os cuidadores do filhote.",
 },
];


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
 <div data-geo-answer="guia" className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
 <h2 className="text-xl font-semibold text-zinc-900">Resumo</h2>
 <p className="mt-3 text-sm text-zinc-600">{GUIA_SNIPPET}</p>
 </div>
 </div>

 <div className="mt-10">
 <TrustBlock
 title="Confiança comprovada"
 description="Processo guiado, prova de pedigree e suporte vitalício"
 items={TRUST_BLOCK_ITEMS}
 />
 </div>

 <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
 <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
 <h2 className="text-xl font-semibold text-zinc-900">Resumo</h2>
 <div className="mt-4">
 <h3 className="text-sm font-semibold text-zinc-900">Definição rápida</h3>
 <p className="mt-2 text-sm text-zinc-600">
 Este guia apresenta um checklist de preparo do tutor, com foco em rotina, socializacao e cuidados iniciais.
 </p>
 </div>
 <div className="mt-4">
 <h3 className="text-sm font-semibold text-zinc-900">Pontos principais</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
 <li>O roteiro organiza o lar e a agenda do tutor.</li>
 <li>O guia descreve a socialização por etapa.</li>
 <li>O checklist reforça saúde preventiva e rotina.</li>
 </ul>
 </div>
 <div className="mt-4">
 <h3 className="text-sm font-semibold text-zinc-900">Tabela comparativa</h3>
 <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--border)]">
 <table className="w-full text-left text-sm text-zinc-600">
 <thead className="bg-zinc-50 text-xs uppercase tracking-[0.2em] text-zinc-500">
 <tr>
 <th className="px-4 py-3">Etapa</th>
 <th className="px-4 py-3">Entrega do guia</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-t border-[var(--border)]">
 <td className="px-4 py-3 font-medium text-zinc-900">Antes</td>
 <td className="px-4 py-3">Checklist de casa, itens e rotina.</td>
 </tr>
 <tr className="border-t border-[var(--border)]">
 <td className="px-4 py-3 font-medium text-zinc-900">Primeira semana</td>
 <td className="px-4 py-3">Socialização e adaptação do filhote.</td>
 </tr>
 <tr className="border-t border-[var(--border)]">
 <td className="px-4 py-3 font-medium text-zinc-900">Rotina</td>
 <td className="px-4 py-3">Organização diária e suporte contínuo.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 <div className="mt-4">
 <h3 className="text-sm font-semibold text-zinc-900">Fontes</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
 <li>
 <a className="underline decoration-dotted" href="https://wsava.org/global-guidelines/global-nutrition-guidelines/" target="_blank" rel="noreferrer">
 WSAVA - Global Nutrition Guidelines
 </a>
 </li>
 <li>
 <a className="underline decoration-dotted" href="https://www.akc.org/dog-breeds/pomeranian/" target="_blank" rel="noreferrer">
 AKC - Pomeranian breed overview
 </a>
 </li>
 </ul>
 </div>
 </section>

 <FAQBlock items={GUIA_FAQ} />
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
