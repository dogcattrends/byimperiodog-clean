import Link from "next/link";
import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import LeadForm from "@/components/LeadForm";
import PageViewPing from "@/components/PageViewPing";
import { buildArticleLD, buildBreadcrumbLD, buildFAQPageLD } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { whatsappLeadUrl } from "@/lib/utm";

const TITLE = "Preço do Spitz Alemão Anão (Lulu da Pomerânia)";
const SUBTITLE =
	"Entenda as faixas de investimento, os fatores que influenciam o valor e os próximos passos para comparar opções com clareza.";

export const metadata = pageMetadata({
	title: "Preço do Spitz Alemão Anão (Lulu da Pomerânia) | By Império Dog",
	description:
		"Entenda as faixas de preço do Spitz Alemão Anão (Lulu da Pomerânia): pedigree, linhagem, cor e fatores que influenciam o valor.",
	path: "/preco-spitz-anao",
});

const PUBLISHED_AT = "2024-02-01";
const MODIFIED_AT = "2024-12-01";

const PRECO_SNIPPET =
	"Esta página explica como o preço do Spitz Alemão Anão (Lulu da Pomerânia) varia conforme linhagem, disponibilidade, perfil e orientações iniciais. Use para estimar investimento e seguir um caminho seguro antes da reserva.";

const PRECO_FAQ = [
	{
		question: "O que influencia o preço?",
		answer: "Linhagem, cor, demanda, cuidados iniciais e planejamento da ninhada.",
	},
	{
		question: "O preço inclui suporte?",
		answer: "Sim. Há orientações iniciais e acompanhamento para adaptação.",
	},
	{
		question: "Como recebo uma estimativa atualizada?",
		answer: "Envie o formulário e retornamos com disponibilidade e faixa atual.",
	},
];

const PRECO_SOURCES = [
	{ label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
	{ label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

export default function PrecoSpitzPage() {
	const articleLd = buildArticleLD({
		url: "https://www.byimperiodog.com.br/preco-spitz-anao",
		title: TITLE,
		description:
			"Guia de preços do Spitz Alemão Anão: fatores que influenciam o valor e como solicitar uma estimativa atual.",
		datePublished: PUBLISHED_AT,
		dateModified: MODIFIED_AT,
	});

	const breadcrumbLd = buildBreadcrumbLD([
		{ name: "Início", url: "https://www.byimperiodog.com.br/" },
		{ name: "Preço Spitz Anão", url: "https://www.byimperiodog.com.br/preco-spitz-anao" },
	]);

	const faqLd = buildFAQPageLD(PRECO_FAQ);

	return (
		<main className="container mx-auto px-4 py-10 pb-28 lg:pb-10">
			<PageViewPing pageType="intent" intent="preco-spitz-anao" />

			<header className="space-y-3">
				<h1 className="text-2xl font-bold">{TITLE}</h1>
				<p className="text-muted-foreground">{SUBTITLE}</p>
			</header>

			<nav aria-label="Nesta página" className="mt-5 rounded-2xl border border-border bg-surface p-4">
				<h2 className="text-sm font-semibold">Nesta página</h2>
				<ul className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
					<li>
						<a className="underline decoration-dotted" href="#faixas">
							Faixas e fatores
						</a>
					</li>
					<li>
						<a className="underline decoration-dotted" href="#tabela">
							Tabela
						</a>
					</li>
					<li>
						<a className="underline decoration-dotted" href="#proximos-passos">
							Próximos passos
						</a>
					</li>
					<li>
						<a className="underline decoration-dotted" href="#faq">
							FAQ
						</a>
					</li>
					<li>
						<a className="underline decoration-dotted" href="#estimativa">
							Estimativa
						</a>
					</li>
					<li>
						<a className="underline decoration-dotted" href="#fontes">
							Fontes
						</a>
					</li>
				</ul>
			</nav>

			<section data-geo-answer="preco-spitz-anao" className="mt-6 rounded-2xl border border-border bg-surface p-4">
				<h2 className="text-lg font-semibold">Visão geral</h2>
				<p className="mt-2 text-sm text-muted-foreground">{PRECO_SNIPPET}</p>
			</section>

			<section id="faixas" className="mt-6 rounded-2xl border border-border bg-surface p-4">
				<h2 className="text-lg font-semibold">Faixas e fatores de preço</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Os valores variam conforme perfil, linhagem, disponibilidade e cuidados iniciais. Para comparar com
					segurança, confira as opções atuais e alinhe expectativas antes da reserva.
				</p>
				<ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
					<li>Linhagem e pedigree influenciam previsibilidade e histórico.</li>
					<li>Perfil de cor e demanda alteram a faixa final.</li>
					<li>Socialização e rotina impactam tempo de dedicação inicial.</li>
					<li>Suporte e orientação são parte do acompanhamento.</li>
				</ul>
				<div className="mt-4 flex flex-wrap gap-3 text-sm">
					<Link className="underline decoration-dotted" href="/filhotes">
						Ver filhotes disponíveis
					</Link>
					<Link className="underline decoration-dotted" href="/comprar-spitz-anao">
						Como comprar com segurança
					</Link>
				</div>
			</section>

			<section id="tabela" className="mt-6 rounded-2xl border border-border bg-surface p-4">
				<h2 className="text-lg font-semibold">Tabela comparativa</h2>
				<div className="mt-3 overflow-hidden rounded-2xl border border-border">
					<table className="w-full text-left text-sm text-muted-foreground">
						<thead className="bg-surface-subtle text-xs uppercase tracking-[0.2em] text-muted-foreground">
							<tr>
								<th className="px-4 py-3">Fator</th>
								<th className="px-4 py-3">Impacto no valor</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-t border-border">
								<td className="px-4 py-3 font-medium text-foreground">Linhagem</td>
								<td className="px-4 py-3">Define previsibilidade e histórico de saúde.</td>
							</tr>
							<tr className="border-t border-border">
								<td className="px-4 py-3 font-medium text-foreground">Socialização</td>
								<td className="px-4 py-3">Afeta rotina inicial e tempo de dedicação.</td>
							</tr>
							<tr className="border-t border-border">
								<td className="px-4 py-3 font-medium text-foreground">Suporte</td>
								<td className="px-4 py-3">Inclui orientação e acompanhamento contínuo.</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section id="proximos-passos" className="mt-6 rounded-2xl border border-border bg-surface p-4">
				<h2 className="text-lg font-semibold">Próximos passos</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Organize a comparação e avance com clareza. Estas etapas ajudam a tomar decisão com menos idas e vindas.
				</p>
				<div className="mt-4 grid gap-3 md:grid-cols-3">
					<Link
						href="/filhotes"
						className="rounded-2xl border border-border bg-background p-4 transition hover:bg-surface-subtle"
					>
						<h3 className="text-sm font-semibold">1) Ver filhotes disponíveis</h3>
						<p className="mt-1 text-sm text-muted-foreground">Confira disponibilidade, cores e perfil de cada filhote.</p>
					</Link>
					<Link
						href="/reserve-seu-filhote"
						className="rounded-2xl border border-border bg-background p-4 transition hover:bg-surface-subtle"
					>
						<h3 className="text-sm font-semibold">2) Entender o processo de reserva</h3>
						<p className="mt-1 text-sm text-muted-foreground">Veja como funciona o alinhamento e os próximos passos.</p>
					</Link>
					<div className="rounded-2xl border border-border bg-background p-4">
						<h3 className="text-sm font-semibold">3) Pedir a faixa atual</h3>
						<p className="mt-1 text-sm text-muted-foreground">
							No WhatsApp, você recebe a faixa atual com base no perfil desejado.
						</p>
						{process.env.NEXT_PUBLIC_WA_PHONE && (
							<a
								className="mt-3 inline-flex w-full items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-foreground underline decoration-dotted"
								target="_blank"
								rel="noreferrer"
								href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
									pageType: "intent",
									url: "https://www.byimperiodog.com.br/preco-spitz-anao",
									intent: "preco-spitz-anao",
								})}
								aria-label="Atendimento via WhatsApp"
							>
								Atendimento via WhatsApp
							</a>
						)}
					</div>
				</div>
			</section>

			<section id="faq" className="mt-6">
				<FAQBlock items={PRECO_FAQ} />
			</section>

			<section id="estimativa" className="mt-10">
				<h2 className="text-xl font-semibold">Receber uma estimativa atual</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Conte o perfil desejado para receber uma faixa atualizada com base na disponibilidade do momento.
				</p>
				<LeadForm context={{ pageType: "intent", intent: "preco-spitz-anao" }} />
			</section>

			<section id="fontes" className="mt-6 rounded-2xl border border-border bg-surface p-4">
				<h2 className="text-lg font-semibold">Fontes</h2>
				<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
					{PRECO_SOURCES.map((item) => (
						<li key={item.url}>
							<a className="underline decoration-dotted" href={item.url} target="_blank" rel="noreferrer">
								{item.label}
							</a>
						</li>
					))}
				</ul>
			</section>

			<section className="mt-6">
				{process.env.NEXT_PUBLIC_WA_PHONE && (
					<a
						className="btn-whatsapp inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
						target="_blank"
						rel="noreferrer"
						href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
							pageType: "intent",
							url: "https://www.byimperiodog.com.br/preco-spitz-anao",
							intent: "preco-spitz-anao",
						})}
						aria-label="Atendimento via WhatsApp"
					>
						Atendimento via WhatsApp
					</a>
				)}
			</section>

			<div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur lg:hidden">
				<div className="mx-auto flex w-full max-w-3xl items-center gap-3">
					<Link
						href="/filhotes"
						className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold"
						aria-label="Ver filhotes disponíveis"
					>
						Ver filhotes
					</Link>
					{process.env.NEXT_PUBLIC_WA_PHONE && (
						<a
							className="btn-whatsapp inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
							target="_blank"
							rel="noreferrer"
							href={whatsappLeadUrl(process.env.NEXT_PUBLIC_WA_PHONE.replace(/\D/g, ""), {
								pageType: "intent",
								url: "https://www.byimperiodog.com.br/preco-spitz-anao",
								intent: "preco-spitz-anao",
							})}
							aria-label="Atendimento via WhatsApp"
						>
							WhatsApp
						</a>
					)}
				</div>
			</div>

			<Script id="intent-preco-article-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
			<Script id="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
			<Script id="faq-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
		</main>
	);
}
