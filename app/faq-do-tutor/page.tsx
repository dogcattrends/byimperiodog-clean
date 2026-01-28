import type { Metadata } from "next";
import Link from "next/link";

import { LastUpdated } from "@/components/common/LastUpdated";
import { TOC } from "@/components/common/TOC";
import { faqPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";

import { FAQJsonLd } from "../components/blog/FAQJsonLd";
import { BreadcrumbJsonLd, WebPageJsonLd } from "../components/BreadcrumbWebPageJsonLd";

const path = "/faq-do-tutor";
const lastUpdated = "2026-01-10T09:00:00.000Z";

const faqItems = [
 {
 question: "Como preparamos cada Spitz Alemão Lulu da Pomerânia antes da nova família?",
 answer:
 "Realizamos socialização diária com crianças e adultos, dessensibilização a sons domésticos, enriquecimento ambiental supervisionado e avaliação veterinária completa. O objetivo é que o Spitz Alemão Lulu da Pomerânia chegue com autoconfiança e rotina estável.",
 },
 {
 question: "Qual o porte adulto esperado do Spitz Alemão Anão Lulu da Pomerânia?",
 answer:
 "As nossas linhagens são acompanhadas por geneticista e mantêm estrutura saudável de porte mini, com pelagem densa e equilíbrio entre energia e docilidade. Compartilhamos laudos com curva de peso e reforçamos os ajustes de alimentação para cada fase.",
 },
 {
 question: "Quais cuidados manter nas primeiras 48 horas em casa?",
 answer:
 "Providencie ambiente calmo, tigelas individuais, água fresca, ração indicada e intervalo de descanso sem visitantes. Agende consulta veterinária preventiva e monitore alimentação, hidratação e eliminações. Qualquer alteração deve ser reportada imediatamente ao nosso time.",
 },
 {
 question: "Como funciona o suporte contínuo após a entrega?",
 answer:
 "O tutor recebe acesso à biblioteca digital, cronograma de socialização e acompanhamento por WhatsApp. Disponibilizamos videochamadas para ajustes de rotina, reforço positivo e orientação em emergências comportamentais ou nutricionais.",
 },
 {
 question: "Quais exames acompanham o Spitz Alemão Lulu da Pomerânia?",
 answer:
 "Entregamos carteira de vacinação, exames parasitológicos, histórico de vermifugação, relatório de avaliação odontológica e teste de patela. Também emitimos nota fiscal, contrato de responsabilidade compartilhada e garantia de suporte vitalício.",
 },
];

const FAQ_SNIPPET =
 "A FAQ do Tutor responde às dúvidas mais comuns sobre preparo da casa, primeiros dias, rotina, exames e suporte após a entrega. Use como checklist rápido antes da chegada do Spitz Alemão Lulu da Pomerânia e como referência sempre que surgir uma dúvida no dia a dia.";

const FAQ_SOURCES = [
 { label: "WSAVA - Global Nutrition Guidelines", url: "https://wsava.org/global-guidelines/global-nutrition-guidelines/" },
 { label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

const tocItems = [
 { id: "faq-principais", label: "Perguntas frequentes" },
 { id: "primeiros-cuidados", label: "Primeiros cuidados" },
 { id: "materiais-suporte", label: "Materiais de suporte" },
 { id: "contato", label: "Canais de contato" },
];

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateMetadata(): Metadata {
 return pageMetadata({
 title: "FAQ do Tutor | By Império Dog",
 description:
 "Perguntas frequentes sobre preparo, saúde, socialização e suporte após a entrega para o Spitz Alemão Lulu da Pomerânia.",
 path,
 images: [
 {
 url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br"}/og/faq-tutor.jpg`,
 alt: "Tutora segurando um Spitz Alemão Lulu da Pomerânia saudável no colo",
 },
 ],
 });
}

export default function FaqDoTutorPage() {
 const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br").replace(/\/$/, "");
 const whatsappLink = buildWhatsAppLink({
   message: "Olá! Vim pela página FAQ do Tutor e preciso de orientação sobre meu Spitz Alemão Lulu da Pomerânia.",
  utmSource: "site",
  utmMedium: "faq-do-tutor",
  utmCampaign: "whatsapp",
  utmContent: "faq-contato",
 });
 const jsonLd = faqPageSchema(faqItems, `${siteBase}${path}`);
 const breadcrumbLd = {
 "@context": "https://schema.org",
 "@type": "BreadcrumbList",
 itemListElement: [
 { "@type": "ListItem", position: 1, name: "Início", item: `${siteBase}/` },
 { "@type": "ListItem", position: 2, name: "FAQ do Tutor", item: `${siteBase}${path}` },
 ],
 };
 const webPageLd = {
 "@context": "https://schema.org",
 "@type": "WebPage",
 "@id": `${siteBase}${path}#webpage`,
 url: `${siteBase}${path}`,
 name: "FAQ do Tutor | By Império Dog",
 description:
 "Perguntas frequentes sobre preparo, saúde, socialização e suporte após a entrega para o Spitz Alemão Lulu da Pomerânia.",
 isPartOf: { "@type": "WebSite", url: siteBase, name: "By Império Dog" },
 };

   const DATA_PUBLICACAO = "Publicado em 10 de janeiro de 2024";
   const DATA_ATUALIZACAO = "Atualizado em 13 de janeiro de 2026";
   const AUTOR = "Por By Império Dog";
   return (
      <main className="mx-auto max-w-4xl space-y-12 px-6 py-16 text-zinc-800">

         <figure className="mb-8">
            <img
               src="/faq-tutor.png"
               alt="Tutora segurando um Spitz Alemão Lulu da Pomerânia saudável no colo"
                  className="w-full max-w-xl max-h-80 shadow-lg object-contain mx-auto"
                  style={{ }}
            />
            <figcaption className="text-xs text-zinc-500 text-center mt-2">Imagem ilustrativa: Tutora e Spitz Alemão Lulu da Pomerânia</figcaption>
         </figure>

         <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm text-zinc-500">{AUTOR}</span>
            <span className="text-sm text-zinc-500">{DATA_PUBLICACAO}</span>
            <span className="text-sm text-zinc-500">{DATA_ATUALIZACAO}</span>
         </div>

         <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">FAQ do Tutor</p>
            <h1 className="text-3xl font-bold text-zinc-900">Dúvidas frequentes do tutor</h1>
            <p className="text-base text-zinc-600">
               Tire dúvidas rápidas sobre preparo, rotina e suporte do Spitz Alemão Lulu da Pomerânia. Respostas diretas para o dia a dia do tutor.
            </p>
         </header>
 <section data-geo-answer="faq-do-tutor" className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
 <div className="flex items-center gap-2 mb-1">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
    <h2 className="text-xl font-semibold text-zinc-900">Informações rápidas</h2>
 </div>
 <p className="mt-3 text-sm text-zinc-600">{FAQ_SNIPPET}</p>
 </section>


 <section className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
 <div className="flex items-center gap-2 mb-1 mt-8">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
    <h2 className="text-xl font-semibold text-zinc-900">Resumo</h2>
 </div>
 <div className="mt-4">
 <div className="flex items-center gap-2 mb-1 mt-4">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
    <h3 className="text-sm font-semibold text-zinc-900">Checklist</h3>
 </div>
 <p className="mt-2 text-sm text-zinc-600">
 Respostas diretas sobre preparo, rotina e suporte para novos tutores.
 </p>
 </div>
 <div className="mt-4">
 <div className="flex items-center gap-2 mb-1 mt-4">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
    <h3 className="text-sm font-semibold text-zinc-900">Pontos principais</h3>
 </div>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
 <li>O checklist resume os primeiros cuidados em casa.</li>
 <li>O resumo cobre exames, vacinas e acompanhamento.</li>
 <li>Os canais de suporte garantem orientação contínua.</li>
 </ul>
 </div>
 <div className="mt-4">
 <div className="flex items-center gap-2 mb-1 mt-4">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
    <h3 className="text-sm font-semibold text-zinc-900">Tabela de cuidados</h3>
 </div>
 <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-100">
 <table className="w-full text-left text-sm text-zinc-600">
 <thead className="bg-zinc-50 text-xs uppercase tracking-[0.2em] text-zinc-500">
 <tr>
 <th className="px-4 py-3">Momento</th>
 <th className="px-4 py-3">Foco do FAQ</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-t border-zinc-100">
 <td className="px-4 py-3 font-medium text-zinc-900">Antes da chegada</td>
 <td className="px-4 py-3">Preparar casa e rotina.</td>
 </tr>
 <tr className="border-t border-zinc-100">
 <td className="px-4 py-3 font-medium text-zinc-900">Primeiras 48h</td>
 <td className="px-4 py-3">Adaptação e observação do filhote.</td>
 </tr>
 <tr className="border-t border-zinc-100">
 <td className="px-4 py-3 font-medium text-zinc-900">Acompanhamento</td>
 <td className="px-4 py-3">Suporte contínuo e revisões.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 <div className="mt-4">
 <h3 className="text-sm font-semibold text-zinc-900">Fontes</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
 {FAQ_SOURCES.map((item) => (
 <li key={item.url}>
 <a className="underline decoration-dotted" href={item.url} target="_blank" rel="noreferrer">
 {item.label}
 </a>
 </li>
 ))}
 </ul>
 </div>
 </section>

 <TOC items={tocItems} />

 <section id="faq-principais" className="space-y-6">
 <h2 className="text-2xl font-semibold text-zinc-900">Perguntas frequentes</h2>
 <div className="space-y-4">
 {faqItems.map((item) => (
 <article key={item.question} className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
 <h3 className="text-xl font-semibold text-zinc-900">{item.question}</h3>
 <p className="mt-2 text-zinc-600">{item.answer}</p>
 </article>
 ))}
 </div>
 </section>

 <section id="primeiros-cuidados" className="space-y-4">
 <h2 className="text-2xl font-semibold text-zinc-900">Primeiros cuidados nas 48 horas</h2>
 <p className="text-zinc-600">
 A adaptação do Spitz Alemão Lulu da Pomerânia depende de rotina previsível, estímulos positivos e monitoramento próximo.
 Recomendamos o seguinte passo a passo:
 </p>
 <ul className="list-disc space-y-2 pl-6 text-zinc-600">
 <li>
 Defina um quarto seguro com cama ortopédica, tapete higiênico e brinquedos de diferentes texturas para estimular
 exploração.
 </li>
 <li>
 Mantenha a alimentação dividida em pequenas porções, com suplementação indicada pela nossa equipe de acordo com o peso
 e com porte mini previsto para a fase adulta.
 </li>
 <li>
 Registre vídeos curtos para avaliarmos comportamento, postura e interação com a família. Isso acelera eventuais
 ajustes de manejo.
 </li>
 <li>
 Livre acesso à água filtrada, controle de temperatura entre 22 °C e 24 °C e passeio apenas após liberação do veterinário
 responsável.
 </li>
 </ul>
 </section>

 <section id="materiais-suporte" className="space-y-4">
 <h2 className="text-2xl font-semibold text-zinc-900">Materiais de suporte</h2>
 <p className="text-zinc-600">
 Todo tutor recebe acesso a materiais de apoio para aprofundar o conhecimento sobre o Spitz Alemão Lulu da Pomerânia:
 </p>
 <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 md:grid-cols-2">
 <article>
 <h3 className="text-lg font-semibold text-emerald-900">Biblioteca digital</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
 <li>Protocolos de socialização por faixa etária.</li>
 <li>Planilhas de reforço positivo e treino de caixa de transporte.</li>
 <li>Checklist de viagem com o Spitz Alemão Lulu da Pomerânia.</li>
 </ul>
 </article>
 <article>
 <h3 className="text-lg font-semibold text-emerald-900">Suporte direto</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
 <li>Videochamadas para ajustes de rotina e ambientação.</li>
 <li>Canal prioritário para emergências comportamentais.</li>
 <li>
 Consultoria com nutricionista canino quando houver necessidade de adaptação de dieta ou suplementação.
 </li>
 </ul>
 </article>
 </div>
 </section>

 <section id="contato" className="space-y-4">
 <h2 className="text-2xl font-semibold text-zinc-900">Canais de contato</h2>
 <p className="text-zinc-600">
 Sempre que precisar de suporte imediato, utilize um dos canais oficiais abaixo. Respostas são priorizadas para tutores
 em fase de adaptação quando possível.
 </p>
 <div className="flex flex-wrap gap-3">
 <a
    href={whatsappLink}
 className="btn-whatsapp inline-flex min-h-[48px] items-center justify-center rounded-full px-6 text-sm font-semibold shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-2"
 >
 Atendimento via WhatsApp
 </a>
 <Link
 href="/contato"
 className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2"
 >
 Ver canais completos
 </Link>
 </div>
 </section>

 <LastUpdated buildTime={process.env.NEXT_PUBLIC_BUILD_TIME} contentTime={lastUpdated} />

 <FAQJsonLd ld={jsonLd} />
 <BreadcrumbJsonLd ld={breadcrumbLd} />
 <WebPageJsonLd ld={webPageLd} />
 </main>
 );
}


