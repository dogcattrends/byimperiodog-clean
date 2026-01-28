// src/components/home/RecentPostsListAnimated.tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, BookOpen, Calendar, GraduationCap, HeartPulse, PawPrint, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { BLUR_DATA_URL } from '@/lib/placeholders';

export interface RecentPostItem {
	id: string | number;
	slug: string;
	title: string;
	cover_url?: string | null;
	excerpt?: string | null;
	published_at?: string | null;
	reading_time?: number | null;
}

export default function RecentPostsListAnimated({ posts }: { posts: RecentPostItem[] }) {
	const prefersReduced = useReducedMotion();
	const baseHidden = { opacity: 0, y: prefersReduced ? 0 : 12 };
	return (
		<ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{posts.map((p, idx) => {
				const dateIso = p.published_at ? new Date(p.published_at).toISOString() : undefined;
				const dateFormatted = p.published_at ? new Date(p.published_at).toLocaleDateString('pt-BR') : '—';
				const readingTime = p.reading_time || 5;
				const topic = getTopicBadge(p.title);
				return (
					<motion.li
						key={p.id}
						initial={baseHidden}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: '-40px' }}
						transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 0.84, 0.44, 1] as [number, number, number, number] }}
						className="group relative flex flex-col overflow-hidden rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-shadow hover:shadow-md focus-within:ring-emerald-500/50"
					>
						<Link href={`/blog/${p.slug}`} className="focus:outline-none" aria-label={`Ler artigo: ${p.title}`}>
						<div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
							{p.cover_url ? (
								<Image
									src={p.cover_url}
									alt={p.title}
										width={800}
										height={450}
										loading={idx===0 ? 'eager':'lazy'}
										priority={idx===0}
										fetchPriority={idx===0 ? 'high':'auto'}
										decoding={idx===0 ? 'sync':'async'}
										sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
									className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
									placeholder="blur"
									blurDataURL={BLUR_DATA_URL}
									draggable={false}
								/>
							) : (
								<div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
									Sem capa
								</div>
							)}
						</div>
							<div className="flex flex-1 flex-col p-4 sm:p-5">
								<div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-emerald-700">
									<span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 leading-none">
										<BookOpen className="h-3 w-3" aria-hidden="true" />
										Blog By Império
									</span>
									<span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 leading-none ${topic.className}`}>
										<topic.icon className="h-3 w-3" aria-hidden="true" />
										{topic.label}
									</span>
									<span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 leading-none text-zinc-600">
										<Calendar className="h-3 w-3" aria-hidden="true" />
										<time dateTime={dateIso}>{dateFormatted}</time>
									</span>
									<span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 leading-none text-zinc-600" aria-label={`Tempo de leitura estimado ${readingTime} minutos`}>
										<Sparkles className="h-3 w-3" aria-hidden="true" />
										Leitura {readingTime} min
									</span>
								</div>
								<h3 className="line-clamp-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 transition-colors">
									{p.title}
								</h3>
								{p.excerpt && (
									<p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
										{p.excerpt}
									</p>
								)}
								<div className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition duration-300 group-hover:bg-emerald-500 group-hover:-translate-y-0.5">
									Ler artigo
									<ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
								</div>
							</div>
						</Link>
					</motion.li>
				);
			})}
		</ul>
	);
}

function getTopicBadge(title: string) {
	const t = title.toLowerCase();
	if (t.includes("saude") || t.includes("saúde") || t.includes("veterin")) {
		return { label: "Saúde", icon: HeartPulse, className: "border-rose-200 bg-rose-50 text-rose-700" };
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
