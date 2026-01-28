import { Clock, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import Link from "next/link";


import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import LeadForm from "@/components/LeadForm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/route";
import { pageMetadata } from "@/lib/seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";

import { BreadcrumbJsonLd, WebPageJsonLd } from "../components/BreadcrumbWebPageJsonLd";
import { FAQJsonLd } from "../components/contato/FAQJsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br";

const RAW_FULL = (process.env.NEXT_PUBLIC_WA_PHONE || process.env.NEXT_PUBLIC_WA_LINK || "5511968633239").replace(/\D/g, "");
const RAW_LOCAL = RAW_FULL.startsWith("55") ? RAW_FULL.slice(2) : RAW_FULL;

function formatDisplayPhone(p: string): string {
	if (p.length < 4) return p;
	const area = p.slice(0, 2);
	const rest = p.slice(2);
	if (rest.length === 9) return `(${area}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
	if (rest.length === 8) return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
	return `(${area}) ${rest}`;
}

const DISPLAY_PHONE = process.env.NEXT_PUBLIC_WA_DISPLAY || formatDisplayPhone(RAW_LOCAL);
const PHONE_TEL = RAW_FULL ? `+${RAW_FULL}` : undefined;
const buildContatoWhatsApp = (origin: string) =>
	buildWhatsAppLink({
		message: "Ola! Vim pela pagina Contato da By Imperio Dog e gostaria de saber sobre filhotes disponiveis.",
		utmSource: "site",
		utmMedium: "contato",
		utmCampaign: "whatsapp",
		utmContent: origin,
	});

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "byimperiodog@gmail.com";
const INSTAGRAM = process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/byimperiodog";
const YOUTUBE = process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://youtube.com/@byimperiodog";

const TITLE = "Contato By Império Dog";

export const metadata = pageMetadata({
	title: "Contato | By Império Dog",
	description:
		"Fale com a By Império Dog por WhatsApp, e-mail ou formulário. Resposta rápida e orientação personalizada para quem busca um Spitz Alemão Anão (Lulu da Pomerânia).",
	path: "/contato",
});

const CONTATO_SNIPPET =
	"Esta página organiza os canais oficiais de contato da By Império Dog. Use o WhatsApp para respostas rápidas, o formulário para enviar contexto completo e o e-mail para documentos e confirmações.";

const quickFaq = [
	{
		question: "Qual o prazo de resposta?",
		answer: "Respondemos no WhatsApp nos dias uteis em ate 2 horas. E-mails sao retornados no mesmo dia util.",
	},
	{
		question: "Posso visitar a estrutura?",
		answer: "Sim. Agendamos visitas presenciais aos sabados mediante disponibilidade ou videochamadas durante a semana.",
	},
	{
		question: "Voces entregam em outras cidades?",
		answer:
			"Realizamos transporte humanizado para todo o Brasil, com profissional acompanhando o Spitz Alemao Anão (Lulu da Pomerânia).",
	},
	{
		question: "Como funciona a reserva?",
		answer:
			"Apos conhecer a familia, enviamos contrato digital e sinal para garantir prioridade de escolha da ninhada.",
	},
];

const faqLd = quickFaq.length > 0 ? {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	"mainEntity": quickFaq.map((item) => ({
		"@type": "Question",
		"name": item.question,
		"acceptedAnswer": {
			"@type": "Answer",
			"text": item.answer,
		},
	})),
} : null;

export default function ContatoPage() {
	const breadcrumbLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
			{ "@type": "ListItem", position: 2, name: "Contato", item: `${SITE_URL}/contato` },
		],
	};
	const webPageLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${SITE_URL.replace(/\/$/, "")}/contato#webpage`,
		url: `${SITE_URL.replace(/\/$/, "")}/contato`,
		name: TITLE,
		description:
			"Fale com a By Império Dog por WhatsApp, e-mail ou formulário. Resposta rápida e orientação personalizada para quem busca um Spitz Alemão Anão (Lulu da Pomerânia).",
		isPartOf: { "@type": "WebSite", url: SITE_URL.replace(/\/$/, ""), name: "By Império Dog" },
	};

	return (
		<main className="mx-auto max-w-6xl space-y-16 px-5 pb-24 pt-16 text-[var(--text)]">
		<BreadcrumbJsonLd ld={breadcrumbLd} />
		<WebPageJsonLd ld={webPageLd} />
		{faqLd ? <FAQJsonLd ld={faqLd} /> : null}

			<header className="text-center sm:text-left">
				<span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
					Contato oficial
				</span>
				<h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Fale com a By Império Dog</h1>
				<p className="mt-4 max-w-3xl text-base text-[var(--text-muted)] sm:text-lg">
					Duvidas sobre disponibilidade, valores ou preparo do lar? Estamos no WhatsApp, e-mail e redes sociais para orientar cada etapa
					de forma transparente e cuidadosa.
				</p>
				<div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
					<a
						href={buildContatoWhatsApp("contato-hero")}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							buttonVariants({ variant: "solid", size: "lg" }),
							"h-12 rounded-full bg-[var(--accent)] px-6 text-[var(--accent-foreground)] shadow-md hover:brightness-110"
						)}
					>
						<WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
						Atendimento via WhatsApp
					</a>
					<Link
						href={routes.filhotes}
						className={cn(
							buttonVariants({ variant: "ghost", size: "lg" }),
							"h-12 rounded-full px-6 text-[var(--text)] hover:bg-[var(--surface-2)]"
						)}
					>
						Ver filhotes disponíveis
					</Link>
				</div>
			</header>

			<nav className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6" aria-label="Nesta página">
				<h2 className="text-sm font-semibold text-[var(--text)]">Nesta página</h2>
				<ul className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
					<li>
						<a className="underline decoration-dotted" href="#canais">
							Canais oficiais
						</a>
					</li>
					<li>
						<a className="underline decoration-dotted" href="#formulario">
							Formulario
						</a>
					</li>
					<li>
						<a className="underline decoration-dotted" href="#prioritario">
							WhatsApp prioritario
						</a>
					</li>
					<li>
						<a className="underline decoration-dotted" href="#faq">
							FAQ
						</a>
					</li>
				</ul>
			</nav>

			<section id="canais" data-geo-answer="contato" className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
				<h2 className="text-2xl font-semibold text-[var(--text)]">Canais oficiais</h2>
				<p className="mt-3 text-sm text-[var(--text-muted)]">{CONTATO_SNIPPET}</p>
				<div className="mt-4 grid gap-3 text-sm text-[var(--text-muted)]">
					<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
						<strong className="block text-[var(--text)]">WhatsApp</strong>
						Resposta rapida para disponibilidade, valores e orientacoes iniciais.
					</div>
					<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
						<strong className="block text-[var(--text)]">Formulario</strong>
						Recomendado quando voce quer enviar contexto completo para um retorno mais preciso.
					</div>
					<div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
						<strong className="block text-[var(--text)]">E-mail</strong>
						Ideal para documentos, confirmacoes e detalhes formais.
					</div>
				</div>
				<div className="mt-4 flex flex-wrap gap-3 text-sm">
					<Link className="underline decoration-dotted" href="/comprar-spitz-anao">
						Como comprar com seguranca
					</Link>
					<Link className="underline decoration-dotted" href="/preco-spitz-anao">
						Entender faixas de investimento
					</Link>
					<Link className="underline decoration-dotted" href="/sobre">
						Conhecer nossa estrutura
					</Link>
				</div>
			</section>

			<section className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
				<div id="formulario" className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
					<h2 className="text-2xl font-semibold text-[var(--text)]">Envie uma mensagem</h2>
					<p className="mt-2 text-sm text-[var(--text-muted)]">
						Conte sobre sua familia, cidade e quando deseja receber o Spitz Alemao Anão (Lulu da Pomerânia). Respondemos com prioridade para mensagens completas.
					</p>
					<LeadForm />
				</div>
				<aside className="space-y-6">
					<a
						id="prioritario"
						href={buildContatoWhatsApp("contato-prioritario")}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-between rounded-3xl bg-[var(--brand)] px-6 py-5 text-[var(--brand-foreground)] shadow-md transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
					>
						<span className="flex items-center gap-3 text-base font-semibold">
							<MessageCircle className="h-5 w-5" aria-hidden /> Atendimento via WhatsApp
						</span>
						<span className="text-sm">Tempo medio: 2h</span>
					</a>

					<div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
						<h3 className="text-lg font-semibold text-[var(--text)]">Outros canais</h3>
						<ul className="mt-4 space-y-3 text-sm text-[var(--text)]">
							<li className="flex items-center gap-3">
								<Phone className="h-4 w-4 text-[var(--brand)]" aria-hidden />
								{PHONE_TEL ? (
									<a
										href={`tel:${PHONE_TEL}`}
										className="rounded-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
										aria-label={`Ligar para ${DISPLAY_PHONE}`}
									>
										{DISPLAY_PHONE}
									</a>
								) : (
									<span>{DISPLAY_PHONE}</span>
								)}
							</li>
							<li className="flex items-center gap-3">
								<Mail className="h-4 w-4 text-[var(--brand)]" aria-hidden />
								<a
									href={`mailto:${EMAIL}`}
									className="rounded-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
								>
									{EMAIL}
								</a>
							</li>
							<li className="flex items-center gap-3 text-[var(--text-muted)]">
								<Clock className="h-4 w-4 text-[var(--brand)]" aria-hidden /> Atendimento: 09h as 19h (seg-sab)
							</li>
							<li className="flex items-center gap-3 text-[var(--text-muted)]">
								<MapPin className="h-4 w-4 text-[var(--brand)]" aria-hidden /> Braganca Paulista - SP (visitas com agendamento)
							</li>
						</ul>
						<div className="mt-4 flex flex-wrap gap-3">
							<a
								href={INSTAGRAM}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
							>
								<Instagram className="h-4 w-4" aria-hidden /> Instagram
							</a>
							<a
								href={YOUTUBE}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
							>
								<Youtube className="h-4 w-4" aria-hidden /> YouTube
							</a>
						</div>
					</div>
				</aside>
			</section>

			<section id="faq">
				<h2 className="text-2xl font-semibold text-[var(--text)]">Perguntas rapidas</h2>
				<div className="mt-4 grid gap-4 md:grid-cols-2">
					{quickFaq.map((item) => (
						<details key={item.question} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
							<summary className="cursor-pointer text-sm font-semibold text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40">
								{item.question}
							</summary>
							<p className="mt-3 text-sm text-[var(--text-muted)]">{item.answer}</p>
						</details>
					))}
				</div>
			</section>

			<section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-10">
				<h2 className="text-2xl font-semibold text-[var(--text)]">Pronto para dar o primeiro passo?</h2>
				<p className="mt-3 text-sm text-[var(--text-muted)]">
					Compartilhe sua rotina e receba orientacoes personalizadas sobre disponibilidade, valores e preparacao.
				</p>
				<div className="mt-6 flex flex-wrap justify-center gap-3">
					<a
						href={buildContatoWhatsApp("contato-final")}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							buttonVariants({ variant: "solid", size: "lg" }),
							"h-12 rounded-full bg-[var(--brand)] px-6 text-[var(--brand-foreground)] shadow-md hover:shadow-lg"
						)}
					>
						<WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
						Atendimento via WhatsApp
					</a>
					<Link
						href={routes.sobre}
						className={cn(
							buttonVariants({ variant: "ghost", size: "lg" }),
							"h-12 rounded-full px-6 text-[var(--text)] hover:bg-[var(--surface-2)]"
						)}
					>
						Conhecer nossa historia
					</Link>
				</div>
			</section>
		</main>
	);
}
