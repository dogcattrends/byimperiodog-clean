
import { ShieldCheck, HeartHandshake, CheckCircle2 } from "lucide-react";
import Image from "next/image";

import { HERO_IMAGE_SIZES } from "../../lib/image-sizes";

const SELLING_POINTS = [
 {
 icon: ShieldCheck,
 title: "Saúde validada",
 description: "Exames genéticos, laudos cardiológicos e pedigree entregue antes da reserva.",
 },
 {
 icon: HeartHandshake,
 title: "Mentoria vitalícia",
 description: "Acompanhamento direto pelo WhatsApp para rotina, nutrição e comportamento.",
 },
 {
 icon: CheckCircle2,
 title: "Porte mini",
 description: "Seleção cuidadosa para famílias que buscam Spitz Alemão Anão Lulu da Pomerânia dentro do padrão FCI.",
 },
] as const;

const STATS = [
 { value: "10+", label: "anos com Spitz Alemão Anão Lulu da Pomerânia" },
 { value: "180+", label: "famílias acompanhadas" },
 { value: "24h", label: "suporte humano dedicado" },
] as const;

export default function HeroSection() {
 const greeting = "Bem-vindo! Aqui você encontra orientação direta para escolher e cuidar do Spitz Alemão Anão Lulu da Pomerânia.";

 return (
 <section
 className="relative isolate overflow-hidden bg-gradient-to-br from-[#fbefe3] via-[#fdf7ee] to-[#ffffff] text-zinc-900"
 aria-labelledby="hero-heading"
 >
 <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr,1fr] lg:items-center lg:gap-16 lg:py-20">
 <div className="space-y-7 animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
 <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 shadow-sm">
 Spitz Alemão Anão Lulu da Pomerânia com mentoria premium
 </span>
 <header className="space-y-5">
 <h1 id="hero-heading" className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
 Transparência e carinho para entregar o seu Spitz Alemão Anão Lulu da Pomerânia com suporte vitalício
 </h1>
 <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">{greeting}</p>
 <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
 Entrevista de alinhamento, socialização guiada, logística assistida e mentoria contínua.
 Tudo para que o Spitz Alemão Anão Lulu da Pomerânia viva em equilíbrio com a sua família.
 </p>
 </header>
 <div className="grid gap-4 sm:grid-cols-2">
 {SELLING_POINTS.map(({ icon: Icon, title, description }, idx) => (
 <article
 key={title}
 className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-white/95 p-4 shadow-sm transition hover:shadow-md focus-within:shadow-md animate-fade-in-up"
 style={{ animationDelay: `${0.2 + idx * 0.1}s`, animationFillMode: "both" }}
 >
 <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
 {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
 </span>
 <div className="space-y-1">
 <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
 <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
 </div>
 </article>
 ))}
 </div>
 <ul className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-emerald-700 animate-fade-in-up" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
 {(["Entrega humanizada", "Mentoria vitalícia", "Planejamento financeiro claro"] as const).map((label, index, arr) => (
 <li key={label} className="flex items-center gap-2">
 <span>{label}</span>
 {index < arr.length - 1 ? (
 <span className="text-zinc-600" aria-hidden="true">
 •
 </span>
 ) : null}
 </li>
 ))}
 </ul>
 <dl className="grid gap-4 sm:grid-cols-3 animate-fade-in-up" aria-label="Indicadores de confiança" style={{ animationDelay: "0.7s", animationFillMode: "both" }}>
 {STATS.map((stat, idx) => (
 <div
 key={stat.label}
 className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm animate-fade-in-up"
 style={{ animationDelay: `${0.8 + idx * 0.1}s`, animationFillMode: "both" }}
 >
 <dt className="text-xs uppercase tracking-[0.24em] text-zinc-500">{stat.label}</dt>
 <dd className="mt-2 text-2xl font-semibold text-zinc-900">{stat.value}</dd>
 </div>
 ))}
 </dl>
 <div className="rounded-3xl border border-emerald-200 bg-white/80 p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: "1.1s", animationFillMode: "both" }}>
 <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Compromisso estratégico</h3>
 <p className="mt-3 text-sm text-zinc-600">
 Cada reserva nasce de conversa personalizada: avaliamos o cotidiano familiar, estabelecemos marcos de socialização e enviamos relatórios semanais de saúde.
 </p>
 <p className="mt-2 text-sm text-zinc-600">
 Investimento é compartilhado com transparência, desenhando planos sob medida sem pressão antes de qualquer decisão definitiva.
 </p>
 </div>
 </div>
 <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "1.3s", animationFillMode: "both" }}>
 <figure className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-white shadow-2xl">
 <div className="relative aspect-[3/4] lg:aspect-[2/3]">
 <Image
 src="/spitz-hero-desktop.webp?v=20260111"
 alt="Treinador interagindo com um grupo de Spitz Alemão Anão Lulu da Pomerânia em um gramado, em um momento de socialização"
 fill
 priority
 fetchPriority="high"
 sizes={HERO_IMAGE_SIZES}
  className="object-cover object-[70%_65%]"
 style={{ contentVisibility: "auto" }}
 />
 </div>
 <figcaption className="absolute bottom-3 left-3 rounded-full bg-white px-4 py-1 text-xs font-semibold text-emerald-700 shadow">
 Socialização guiada com vídeos semanais
 </figcaption>
 </figure>
 <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg animate-fade-in-up" style={{ animationDelay: "1.5s", animationFillMode: "both" }}>
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div className="space-y-1">
 <p className="text-sm font-semibold text-zinc-900">Atendimento humano em tempo real</p>
 <p className="text-xs leading-relaxed text-zinc-600">
 Envie um vídeo da sua casa e receba checklist de rotina, enxoval e investimento em minutos.
 </p>
 </div>
 {/* <PrimaryCTA
 href={routes.filhotes}
 variant="ghost"
 tracking={{ location: "hero", ctaId: "hero_secondary_contact" }}
 className="min-h-[48px] px-4 py-2 text-sm"
 >
 FALAR COM A ESPECIALISTA
 </PrimaryCTA> */}
 </div>
 </div>
 </div>
 </div>
 </section>
 );
}

