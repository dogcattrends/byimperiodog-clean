import Link from "next/link";
import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

export const metadata = pageMetadata({
 title: "Criador de Spitz Confiável | By Império Dog",
 description:
 "Critérios para escolher um criador confiável de Spitz Alemão Anão Lulu da Pomerânia. Documentação, pedigree, suporte e transparência.",
 path: "/criador-spitz-confiavel",
});

const CRIADOR_SNIPPET =
 "Este guia define como identificar um criador confiável de Spitz Alemão Anão Lulu da Pomerânia. Ele descreve sinais objetivos de transparência, documentação, pedigree, histórico de saúde e suporte após a entrega. Use como checklist para comparar criadores e decidir com segurança antes da reserva.";

const CRIADOR_FAQ = [
 { question: "O que é essencial verificar?", answer: "Pedigree, carteira de vacinação, atestado de saúde e contrato." },
 { question: "Existe acompanhamento pós-compra?", answer: "Sim, há suporte e orientação contínua ao tutor." },
 { question: "Posso visitar a estrutura?", answer: "Visitas são agendadas e seguem protocolo de segurança." },
];

const CRIADOR_SOURCES = [
 { label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
 { label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

export default function CriadorConfiavelPage() {
 const articleLd = buildArticleLD({
 url: "https://www.byimperiodog.com.br/criador-spitz-confiavel",
 title: "Criador de Spitz Confiável",
 description: "Entenda como identificar um criador de Spitz Alemão Anão Lulu da Pomerânia realmente confiável.",
 datePublished: "2024-02-01",
 dateModified: "2024-12-01",
 });

 const breadcrumbLd = buildBreadcrumbLD([
 { name: "Início", url: "https://www.byimperiodog.com.br/" },
 { name: "Criador Confiável", url: "https://www.byimperiodog.com.br/criador-spitz-confiavel" },
 ]);

	const DATA_PUBLICACAO = "Publicado em 10 de janeiro de 2024";
	const DATA_ATUALIZACAO = "Atualizado em 13 de janeiro de 2026";
	const AUTOR = "Por By Império Dog";
	return (
		<main className="container mx-auto px-4 py-10">
			<PageViewPing pageType="intent" intent="criador-spitz-confiavel" />

			<figure className="mb-8">
				<img
					src="/og/spitz-alemao.png"
					alt="Criador de Spitz Confiável - By Império Dog"
					className="w-full rounded-2xl shadow-lg object-cover max-h-[420px] mx-auto"
					style={{ aspectRatio: '2/1', background: '#f3f3f3' }}
				/>
				<figcaption className="text-xs text-zinc-500 text-center mt-2">Imagem ilustrativa: Criador de Spitz Confiável</figcaption>
			</figure>

			<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<span className="text-sm text-zinc-500">{AUTOR}</span>
				<span className="text-sm text-zinc-500">{DATA_PUBLICACAO}</span>
				<span className="text-sm text-zinc-500">{DATA_ATUALIZACAO}</span>
			</div>

			<h1 className="text-3xl font-bold mb-4">Como Identificar um Criador de Spitz Confiável: O Guia que Ninguém Conta</h1>
			<p className="text-lg text-zinc-700 mb-6">
				Escolher um criador de Spitz Alemão Anão (Lulu da Pomerânia) é uma jornada cheia de detalhes e pegadinhas. Este guia editorial revela sinais, perguntas e bastidores que todo tutor deveria conhecer antes de tomar uma decisão — sem promessas fáceis, só o que realmente importa para garantir saúde, transparência e bem-estar.
			</p>

 <nav aria-label="Nesta página" className="mt-5 rounded-2xl border border-border bg-surface p-4">
 <h2 className="text-sm font-semibold">Nesta página</h2>
 <ul className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
 <li>
 <a className="underline decoration-dotted" href="#checklist">
 Checklist
 </a>
 </li>
 <li>
 <a className="underline decoration-dotted" href="#alertas">
 Sinais de alerta
 </a>
 </li>
 <li>
 <a className="underline decoration-dotted" href="#faq">
 FAQ
 </a>
 </li>
 <li>
 <a className="underline decoration-dotted" href="#avaliar">
 Avaliar criador
 </a>
 </li>
 </ul>
 </nav>
 <section data-geo-answer="criador-spitz-confiavel" className="mt-6 rounded-2xl border border-border bg-surface p-4">
 <h2 className="text-lg font-semibold">Informações</h2>
 <p className="mt-2 text-sm text-muted-foreground">{CRIADOR_SNIPPET}</p>
 </section>

 <section className="mt-6 grid gap-3 md:grid-cols-2">
 <div className="rounded-2xl border border-border bg-surface p-4">
 <h2 id="checklist" className="text-lg font-semibold">Checklist de transparência (criador confiável)</h2>
 <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
 <li>Explica rotina, socialização e cuidados iniciais sem “prometer milagre”.</li>
 <li>Mostra fotos/vídeos atuais e tira dúvidas com consistência.</li>
 <li>Entrega documentação/contrato claro e orienta o pós-entrega.</li>
 <li>Deixa critérios de escolha explícitos (perfil, prazos, logística).</li>
 </ul>
 <div className="mt-3 flex flex-wrap gap-3">
 <Link className="underline decoration-dotted" href="/comprar-spitz-anao">
 Como comprar com segurança
 </Link>
 <Link className="underline decoration-dotted" href="/preco-spitz-anao">
 Entender faixas de preço
 </Link>
 </div>
 </div>

 <div className="rounded-2xl border border-border bg-surface p-4">
 <h2 id="alertas" className="text-lg font-semibold">Sinais de alerta</h2>
 <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
 <li>Evita perguntas sobre rotina/pets/crianças e empurra “fechar agora”.</li>
 <li>Não explica contrato/entrega e muda informação com frequência.</li>
 <li>Não tem clareza sobre suporte pós-entrega e acompanhamento.</li>
 <li>Promete padrão/resultado sem explicar histórico e critérios.</li>
 </ul>
 <div className="mt-4 grid gap-2">
 <Link
 href="/filhotes"
 className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold transition hover:bg-surface-subtle"
 >
 Ver filhotes disponíveis
 </Link>
 {process.env.NEXT_PUBLIC_WA_PHONE && (
 <a
 className="btn-whatsapp inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold"
 target="_blank"
 rel="noreferrer"
 href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
 pageType: "intent",
 url: "https://www.byimperiodog.com.br/criador-spitz-confiavel",
 intent: "criador-spitz-confiavel",
 })}
 >
 Atendimento via WhatsApp
 </a>
 )}
 </div>
 </div>
 </section>

 {/* JSON-LD */}
 <Script id="intent-criador-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
 <Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />


 <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
 <h2 className="text-lg font-semibold">Resumo</h2>
 <div className="mt-3">
 <h3 className="text-sm font-semibold">Definição rápida</h3>
 <p className="mt-2 text-sm text-muted-foreground">
 Este checklist orienta a avaliar criadores com foco em documentação, saúde e suporte ao tutor.
 </p>
 </div>
 <div className="mt-3">
 <h3 className="text-sm font-semibold">Pontos principais</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
 <li>A transparência cobre histórico e rotina dos filhotes.</li>
 <li>A documentação completa inclui contrato claro.</li>
 <li>O suporte contínuo segue após a entrega.</li>
 </ul>
 </div>
 <div className="mt-3">
 <h3 className="text-sm font-semibold">Tabela comparativa</h3>
 <div className="mt-2 overflow-hidden rounded-2xl border border-border">
 <table className="w-full text-left text-sm text-muted-foreground">
 <thead className="bg-surface-subtle text-xs uppercase tracking-[0.2em] text-muted-foreground">
 <tr>
 <th className="px-4 py-3">Critério</th>
 <th className="px-4 py-3">O que observar</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-t border-border">
 <td className="px-4 py-3 font-medium text-foreground">Documentação</td>
 <td className="px-4 py-3">Pedigree, contrato e atestados.</td>
 </tr>
 <tr className="border-t border-border">
 <td className="px-4 py-3 font-medium text-foreground">Estrutura</td>
 <td className="px-4 py-3">Ambiente limpo, socialização e rotina.</td>
 </tr>
 <tr className="border-t border-border">
 <td className="px-4 py-3 font-medium text-foreground">Suporte</td>
 <td className="px-4 py-3">Acompanhamento depois da entrega.</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 <div className="mt-3">
 <h3 className="text-sm font-semibold">Fontes</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
 {CRIADOR_SOURCES.map((item) => (
 <li key={item.url}>
 <a className="underline decoration-dotted" href={item.url} target="_blank" rel="noreferrer">
 {item.label}
 </a>
 </li>
 ))}
 </ul>
 </div>
 </section>

 <section id="faq" className="mt-6">
 <FAQBlock items={CRIADOR_FAQ} />
 </section>

 {/* Conteúdo pilar */}
 <section className="mt-8 space-y-4">
 <h2 className="font-semibold">Critérios principais</h2>
 <ul className="list-disc pl-6 text-sm">
 <li>Documentação completa e pedigree</li>
 <li>Transparência sobre saúde e histórico</li>
 <li>Suporte e acompanhamento pós-compra</li>
 <li>Referências e avaliações de clientes</li>
 </ul>
 </section>

 {/* Lead Form para intencao */}
 <section id="avaliar" className="mt-10">
 <h2 className="text-xl font-semibold">Quero avaliar um criador confiável</h2>
 <LeadForm context={{ pageType: "intent", intent: "criador-spitz-confiavel" }} />
 </section>

 <section className="mt-6">
 {process.env.NEXT_PUBLIC_WA_PHONE && (
 <a
 className="btn-whatsapp inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
 target="_blank"
 rel="noreferrer"
 href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
 pageType: "intent",
 url: "https://www.byimperiodog.com.br/criador-spitz-confiavel",
 intent: "criador-spitz-confiavel",
 })}
 >
 Atendimento via WhatsApp
 </a>
 )}
 </section>
 </main>
 );
}



