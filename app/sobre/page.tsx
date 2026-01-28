import { CheckCircle, Heart, Home, PawPrint, Shield, Users } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

import FAQBlock from "@/components/answer/FAQBlock";
import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/route";
import { pageMetadata } from "@/lib/seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const TITLE = "Sobre a By Império Dog";

export const metadata = pageMetadata({
	title: "Sobre a By Império Dog | Especialistas em Spitz Alemão Anão (Lulu da Pomerânia)",
	description:
		"Conheça a história da By Império Dog, a estrutura familiar e a metodologia responsável aplicada ao Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista.",
	path: "/sobre",
	openGraph: {
		title: "Sobre a By Império Dog",
		description:
			"Nossa história, estrutura e valores no cuidado responsável do Spitz Alemão Anão (Lulu da Pomerânia).",
	},
});

const SOBRE_SNIPPET =
	"Aqui você entende quem somos e como funciona nosso processo com o Spitz Alemão Anão (Lulu da Pomerânia). Mostramos história, estrutura, seleção de famílias, rotina de socialização e orientação contínua para apoiar a adaptação.";

const SOBRE_FAQ = [
	{
		question: "Qual o foco do trabalho?",
		answer:
			"Bem-estar, socialização em ambiente familiar, transparência de exames/documentação e orientação prática para a rotina do tutor.",
	},
	{
		question: "Como funciona a seleção das famílias?",
		answer:
			"Fazemos uma conversa de alinhamento (rotina, cidade/estado e experiência com pets) para orientar o melhor encaixe e definir os próximos passos antes da reserva.",
	},
	{
		question: "Existe suporte após a entrega?",
		answer:
			"Sim. Você segue com orientação e acompanhamento pelos canais oficiais, com dicas de adaptação, rotina e dúvidas do dia a dia.",
	},
];

const SOBRE_SOURCES = [
	{ label: "FCI - German Spitz", url: "https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html" },
	{ label: "AKC - Pomeranian breed overview", url: "https://www.akc.org/dog-breeds/pomeranian/" },
];

const timeline = [
	{
		year: "2012",
		title: "Primeiros passos com a raça",
		description:
			"A família Império recebeu a primeira fêmea de Spitz Alemão Anão (Lulu da Pomerânia) e iniciou estudos com mentores europeus sobre genética, manejo e padrões da raça.",
	},
	{
		year: "2016",
		title: "Certificações e planejamento genético",
		description:
			"A estrutura foi homologada para emissão de pedigree, com matrizes e padreadores testados para apoiar saúde e temperamento equilibrado.",
	},
	{
		year: "2019",
		title: "Estrutura dedicada aos filhotes",
		description:
			"Construímos uma estrutura integrada à residência, com ambientes climatizados, maternidade monitorada e espaço de socialização para o Spitz Alemão Anão (Lulu da Pomerânia).",
	},
	{
		year: "2023",
		title: "Programa de acompanhamento",
		description:
			"Lançamos um programa de orientação contínua, com suporte remoto, biblioteca de conteúdos e rede de parceiros especializados.",
	},
	{
		year: "2026",
		title: "Processo mais previsível",
		description:
			"Refinamos checklists de rotina, acompanhamento por WhatsApp e comunicação de etapas para tornar o processo mais claro para novas famílias.",
	},
] as const;

const values = [
	{
		icon: Heart,
		title: "Afeto desde o primeiro dia",
		description:
			"Os filhotes nascem e crescem dentro de casa, ao lado da família, ouvindo vozes, música e convivendo com crianças.",
	},
	{
		icon: Users,
		title: "Famílias selecionadas",
		description:
			"Cada escolha de família é conduzida com entrevistas, orientações e acompanhamento para garantir o melhor vínculo humano-animal.",
	},
	{
		icon: Shield,
		title: "Transparência absoluta",
		description:
			"Apresentamos pedigree, exames laboratoriais, relatórios veterinários e contrato claro em cada etapa do processo.",
	},
] as const;

const structureHighlights = [
	{
		icon: Home,
		title: "Ambientes preparados",
		description:
			"Maternidade climatizada, nursery com enriquecimento sensorial e área externa sombreada para exploração natural.",
	},
	{
		icon: PawPrint,
		title: "Rotina positiva",
		description:
			"Rotina diária de socialização, estímulos olfativos e treino de superfície para facilitar a adaptação na nova casa.",
	},
	{
		icon: CheckCircle,
		title: "Rede multidisciplinar",
		description:
			"Equipe de veterinários, comportamentalista e groomer parceiros garantem cuidado integral aos nossos Spitz Alemão Anão (Lulu da Pomerânia).",
	},
] as const;

const supportItems = [
	"Plano alimentar personalizado conforme idade e porte",
	"Calendário de vacinas, vermifugações e consultas",
	"Conteúdos sobre adestramento gentil",
	"Canal de orientação contínua no WhatsApp",
] as const;

export default function SobrePage() {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.byimperiodog.com.br";
	const waHeroLink = buildWhatsAppLink({
		message: "Olá! Vim pela página Sobre da By Império Dog e quero entender o processo e filhotes disponíveis.",
		utmSource: "site",
		utmMedium: "sobre",
		utmCampaign: "whatsapp",
		utmContent: "sobre-hero",
	});
	const waCtaLink = buildWhatsAppLink({
		message: "Olá! Vim pela página Sobre e gostaria de falar com a especialista.",
		utmSource: "site",
		utmMedium: "sobre",
		utmCampaign: "whatsapp",
		utmContent: "sobre-cta",
	});

	const breadcrumbLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "Início", item: `${siteUrl}/` },
			{ "@type": "ListItem", position: 2, name: "Sobre", item: `${siteUrl}/sobre` },
		],
	};
	const webPageLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${siteUrl}/sobre#webpage`,
		url: `${siteUrl}/sobre`,
		name: TITLE,
		description:
			"Conheça a história da By Império Dog, a estrutura familiar e a metodologia responsável aplicada ao Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista.",
		isPartOf: { "@type": "WebSite", url: siteUrl, name: "By Império Dog" },
	};

	return (
		<main className="space-y-20 bg-[var(--bg)] pb-24 pt-16 text-[var(--text)]">
			<Script id="ld-breadcrumb-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
			<Script id="ld-webpage-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />

			<section className="mx-auto max-w-6xl px-5 text-center sm:text-left">
				<span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
					Sobre a equipe
				</span>
				<h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
					By Império Dog: estrutura familiar dedicada ao Spitz Alemão Anão (Lulu da Pomerânia)
				</h1>
				<p className="mt-4 max-w-3xl text-base text-[var(--text-muted)] sm:text-lg">
					Localizada em Bragança Paulista, nossa equipe prioriza afeto, responsabilidade genética e orientação contínua
					para famílias que buscam um Spitz equilibrado e saudável.
				</p>
				<div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
					<Link
						href={routes.filhotes}
						className={cn(
							buttonVariants({ variant: "solid", size: "lg" }),
							"h-12 rounded-full bg-[var(--brand)] px-6 text-[var(--brand-foreground)] shadow-md hover:shadow-lg"
						)}
					>
						Ver filhotes disponíveis
					</Link>
					<a
						href={waHeroLink}
						target="_blank"
						rel="noreferrer"
						className={cn(
							buttonVariants({ variant: "outline", size: "lg" }),
							"h-12 rounded-full border-[var(--brand)] px-6 text-[var(--brand)] hover:bg-[var(--surface-2)]"
						)}
					>
						<WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
						Atendimento via WhatsApp
					</a>
				</div>
			</section>

			<nav className="mx-auto max-w-6xl px-5" aria-label="Nesta página">
				<div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
					<h2 className="text-sm font-semibold text-[var(--text)]">Nesta página</h2>
					<ul className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
						<li>
							<a className="underline decoration-dotted" href="#visao-geral">
								Visão geral
							</a>
						</li>
						<li>
							<a className="underline decoration-dotted" href="#como-cuidamos">
								Como cuidamos
							</a>
						</li>
						<li>
							<a className="underline decoration-dotted" href="#estrutura">
								Estrutura
							</a>
						</li>
						<li>
							<a className="underline decoration-dotted" href="#historia">
								História
							</a>
						</li>
						<li>
							<a className="underline decoration-dotted" href="#suporte">
								Suporte
							</a>
						</li>
						<li>
							<a className="underline decoration-dotted" href="#faq">
								FAQ
							</a>
						</li>
						<li>
							<a className="underline decoration-dotted" href="#fontes">
								Fontes
							</a>
						</li>
					</ul>
				</div>
			</nav>

			<section id="visao-geral" className="mx-auto max-w-6xl px-5">
				<div data-geo-answer="sobre" className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
					<h2 className="text-2xl font-semibold text-[var(--text)]">Visão geral</h2>
					<p className="mt-3 text-sm text-[var(--text-muted)]">{SOBRE_SNIPPET}</p>
					<div className="mt-4 flex flex-wrap gap-3 text-sm">
						<Link className="underline decoration-dotted" href={routes.filhotes}>
							Ver filhotes
						</Link>
						<Link className="underline decoration-dotted" href="/comprar-spitz-anao">
							Como comprar com segurança
						</Link>
						<Link className="underline decoration-dotted" href={routes.contato}>
							Contato e canais oficiais
						</Link>
					</div>
				</div>
			</section>

			<section id="como-cuidamos" className="mx-auto max-w-6xl space-y-6 px-5">
				<h2 className="text-2xl font-semibold text-[var(--text)]">Como cuidamos dos nossos filhotes</h2>
				<div className="grid gap-4 md:grid-cols-3">
					{values.map((value) => (
						<article key={value.title} className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
							<value.icon className="h-6 w-6 text-[var(--brand)]" aria-hidden />
							<h3 className="mt-4 text-lg font-semibold text-[var(--text)]">{value.title}</h3>
							<p className="mt-2 text-sm text-[var(--text-muted)]">{value.description}</p>
						</article>
					))}
				</div>
			</section>

			<section id="estrutura" className="mx-auto max-w-6xl grid gap-8 px-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<div className="space-y-5">
					<h2 className="text-2xl font-semibold text-[var(--text)]">Estrutura pensada para bem-estar e socialização</h2>
					<p className="text-sm text-[var(--text-muted)]">
						Mantemos poucos cães adultos para garantir atenção individualizada. Cada ambiente é higienizado diariamente
						e monitorado por câmeras para manter segurança e rotinas consistentes.
					</p>
					<div className="grid gap-4 sm:grid-cols-2">
						{structureHighlights.map((item) => (
							<article key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
								<item.icon className="h-5 w-5 text-[var(--brand)]" aria-hidden />
								<h3 className="mt-3 text-sm font-semibold text-[var(--text)]">{item.title}</h3>
								<p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
							</article>
						))}
					</div>
					<div className="flex flex-wrap gap-3 text-sm">
						<Link className="underline decoration-dotted" href="/preco-spitz-anao">
							Entender faixas de investimento
						</Link>
						<Link className="underline decoration-dotted" href="/comprar-spitz-anao">
							Passo a passo da compra
						</Link>
					</div>
				</div>
				<aside id="suporte" className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
					<h3 className="text-lg font-semibold text-[var(--text)]">Rede de suporte ao tutor</h3>
					<p className="mt-2 text-sm text-[var(--text-muted)]">
						Após a chegada do filhote, você continua próximo da nossa equipe e especialistas parceiros.
					</p>
					<ul className="mt-4 space-y-3">
						{supportItems.map((item) => (
							<li key={item} className="flex items-start gap-2 text-sm text-[var(--text)]">
								<CheckCircle className="mt-1 h-4 w-4 flex-none text-[var(--brand)]" aria-hidden />
								<span>{item}</span>
							</li>
						))}
					</ul>
					<div className="mt-6 rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[var(--surface-2)] p-4 text-sm text-[var(--text-muted)]">
						<strong className="block text-[var(--text)]">Orientação contínua</strong>
						Acompanhamento e conteúdos práticos para apoiar a adaptação do filhote na nova rotina.
					</div>
				</aside>
			</section>

			<section id="historia" className="mx-auto max-w-6xl px-5">
				<h2 className="text-2xl font-semibold text-[var(--text)]">Nossa história</h2>
				<ol className="mt-6 space-y-6 border-l border-dashed border-[var(--border)] pl-6" aria-label="Linha do tempo">
					{timeline.map((item) => (
						<li key={item.year} className="relative rounded-2xl bg-[var(--surface)] p-6 shadow-sm">
							<span className="absolute -left-[37px] top-6 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-[var(--brand-foreground)] shadow">
								{item.year}
							</span>
							<h3 className="text-lg font-semibold text-[var(--text)]">{item.title}</h3>
							<p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
						</li>
					))}
				</ol>
			</section>

			<section id="faq" className="mx-auto max-w-6xl px-5">
				<FAQBlock items={SOBRE_FAQ} />
			</section>

			<section id="fontes" className="mx-auto max-w-6xl px-5">
				<div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-[var(--text)]">Fontes</h2>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
						{SOBRE_SOURCES.map((item) => (
							<li key={item.url}>
								<a className="underline decoration-dotted" href={item.url} target="_blank" rel="noreferrer">
									{item.label}
								</a>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="mx-auto max-w-5xl px-5">
				<div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-10">
					<h2 className="text-2xl font-semibold text-[var(--text)]">
						Quer entender se um Lulu da Pomerânia da By Império Dog combina com sua família?
					</h2>
					<p className="mt-3 text-sm text-[var(--text-muted)]">
						Agende uma conversa transparente, conheça nossa estrutura em vídeo e receba orientações personalizadas.
					</p>
					<div className="mt-6 flex flex-wrap justify-center gap-3">
						<a
							href={waCtaLink}
							target="_blank"
							rel="noreferrer"
							className={cn(
								buttonVariants({ variant: "solid", size: "lg" }),
								"h-12 rounded-full bg-[var(--accent)] px-6 text-[var(--accent-foreground)] shadow-md hover:brightness-110"
							)}
						>
							<WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
							Atendimento via WhatsApp
						</a>
						<Link
							href={routes.contato}
							className={cn(
								buttonVariants({ variant: "ghost", size: "lg" }),
								"h-12 rounded-full px-6 text-[var(--text)] hover:bg-[var(--surface-2)]"
							)}
						>
							Ver canais de contato
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
