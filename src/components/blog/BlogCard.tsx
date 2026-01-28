"use client";

import {
	ArrowUpRight,
	BookOpen,
	Calendar,
	GraduationCap,
	HeartPulse,
	PawPrint,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BLOG_CARD_SIZES } from "@/lib/image-sizes";
import { BLUR_DATA_URL } from "@/lib/placeholders";

type BlogCardPost = {
	id: string;
	slug: string;
	title: string;
	excerpt?: string | null;
	cover_url?: string | null;
	cover_alt?: string | null;
	published_at?: string | null;
	content_mdx?: string | null;
};

type BlogCardProps = {
	post: BlogCardPost;
};

function normalizeCoverUrl(value?: string | null) {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith("/")) return trimmed;
	const normalized = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
	try {
		const url = new URL(normalized);
		if (url.protocol === "http:" || url.protocol === "https:") return normalized;
	} catch {
		return null;
	}
	return null;
}

function formatDate(value?: string | null) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

function estimateMinutes(content?: string | null) {
	if (!content) return null;
	const words = content.split(/\s+/).filter(Boolean).length;
	if (!words) return null;
	return Math.max(1, Math.round(words / 180));
}

export default function BlogCard({ post }: BlogCardProps) {
	const articleHref = `/blog/${post.slug}`;
	const minutes = estimateMinutes(post.content_mdx ?? post.excerpt ?? "") ?? 5;
	const published = formatDate(post.published_at);
	const publishedIso = post.published_at ? new Date(post.published_at).toISOString() : undefined;
	const coverUrl = normalizeCoverUrl(post.cover_url);
	const topic = getTopicBadge(post.title);

	return (
		<article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 transition-shadow hover:shadow-md focus-within:ring-emerald-500/50">
			<Link href={articleHref} className="focus:outline-none" aria-label={`Ler artigo: ${post.title}`}>
				<div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-zinc-100">
					{coverUrl ? (
						<Image
							src={coverUrl}
							alt={post.cover_alt || post.title}
							fill
							sizes={BLOG_CARD_SIZES}
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
							placeholder="blur"
							blurDataURL={BLUR_DATA_URL}
							loading="lazy"
							decoding="async"
							draggable={false}
						/>
					) : (
						<div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-zinc-500">
							Sem capa
						</div>
					)}
				</div>

				<div className="flex flex-1 flex-col p-4 sm:p-5">
					<div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-emerald-700">
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 leading-none">
							<BookOpen className="h-3 w-3" aria-hidden />
							Blog By Imperio
						</span>
						<span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 leading-none ${topic.className}`}>
							<topic.icon className="h-3 w-3" aria-hidden />
							{topic.label}
						</span>
						{published ? (
							<span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 leading-none text-zinc-600">
								<Calendar className="h-3 w-3" aria-hidden />
								<time dateTime={publishedIso}>{published}</time>
							</span>
						) : null}
						{minutes ? (
							<span
								className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 leading-none text-zinc-600"
								aria-label={`Tempo de leitura estimado ${minutes} minutos`}
							>
								<Sparkles className="h-3 w-3" aria-hidden />
								Leitura {minutes} min
							</span>
						) : null}
					</div>

					<h3 className="line-clamp-2 font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-emerald-700">
						{post.title}
					</h3>
					{post.excerpt ? (
						<p className="mt-2 line-clamp-3 text-sm text-zinc-600">{post.excerpt}</p>
					) : null}

					<div className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-emerald-500">
						Ler artigo
						<ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
					</div>
				</div>
			</Link>
		</article>
	);
}

function normalizeText(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function getTopicBadge(title: string) {
	const t = normalizeText(title);
	if (t.includes("saude") || t.includes("veterin")) {
		return { label: "Saude", icon: HeartPulse, className: "border-rose-200 bg-rose-50 text-rose-700" };
	}
	if (t.includes("pelo") || t.includes("higiene") || t.includes("banho") || t.includes("tosa")) {
		return { label: "Higiene", icon: PawPrint, className: "border-amber-200 bg-amber-50 text-amber-700" };
	}
	if (t.includes("educa") || t.includes("treino") || t.includes("comport")) {
		return { label: "Comportamento", icon: GraduationCap, className: "border-sky-200 bg-sky-50 text-sky-700" };
	}
	if (t.includes("guia") || t.includes("passo") || t.includes("como")) {
		return { label: "Guia", icon: ShieldCheck, className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
	}
	return { label: "Dicas", icon: Sparkles, className: "border-zinc-200 bg-white text-zinc-700" };
}
