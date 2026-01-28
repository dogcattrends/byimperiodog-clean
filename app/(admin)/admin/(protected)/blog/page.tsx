import Link from "next/link";

import BlogPostsTable from "@/components/admin/blog/BlogPostsTable";
import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { sanityBlogRepo } from "@/lib/sanity/blogRepo";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
 const initial = await sanityBlogRepo.listSummaries({
 limit: 50,
 offset: 0,
 includeMetrics: true,
 includePendingComments: true,
 });

 const requiredSanityEnv = [
 { label: "SANITY_PROJECT_ID", value: process.env.SANITY_PROJECT_ID },
 { label: "SANITY_DATASET", value: process.env.SANITY_DATASET },
 { label: "SANITY_API_VERSION", value: process.env.SANITY_API_VERSION },
 { label: "SANITY_TOKEN", value: process.env.SANITY_TOKEN },
 { label: "SANITY_WEBHOOK_SECRET", value: process.env.SANITY_WEBHOOK_SECRET },
 ];
 const missingCount = requiredSanityEnv.filter(({ value }) => !value).length;

 return (
 <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
 <BlogSubnav />
 <header className="flex flex-col gap-2 border-b border-emerald-100 pb-4 md:flex-row md:items-center md:justify-between">
 <div>
 <h1 className="text-2xl font-bold tracking-tight text-emerald-900">Gestão de Posts</h1>
 <p className="text-sm text-emerald-700">
 Controle completo dos artigos, agendamentos, métricas e revisões. Sanity é o CMS único do blog (
 <a href="/docs/BLOG_ARCHITECTURE.md" className="font-semibold text-emerald-900 underline">
 documentação
 </a>
 ).
 </p>
 </div>
 <Link
 href="/admin/blog/editor"
 className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
 >
 Criar novo post
 </Link>
 </header>

 <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
 <p className="font-semibold">Sanity workflow</p>
 <p className="text-[13px]">
 Studio → Webhook seguro → Supabase metadados permitidos → `revalidatePath` → `app/blog`. A duplicação
 do corpo em Supabase é proibida (veja docs/BLOG_ARCHITECTURE.md).
 </p>
 <div className="mt-3 grid gap-3 md:grid-cols-2">
 {requiredSanityEnv.map((env) => (
 <div
 key={env.label}
 className="rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-[11px] font-medium"
 >
 <p className="tracking-[0.3em] text-emerald-500">{env.label}</p>
 <p className={env.value ? "text-emerald-700" : "text-rose-600"} aria-live="polite">
 {env.value ? "Configurado" : "Ausente"}
 </p>
 </div>
 ))}
 </div>
 {missingCount > 0 ? (
 <p className="mt-3 text-xs text-rose-600">
 {missingCount} variáveis obrigatórias ainda faltam; o webhook secreto precisa existir para validar
 revalidações.
 </p>
 ) : (
 <p className="mt-3 text-xs text-emerald-700">Webhook e client Sanity prontos para receber atualizações.</p>
 )}
 </section>

 <BlogPostsTable
 initialData={{
 items: initial.items,
 total: initial.total,
 page: 1,
 perPage: 50,
 }}
 />
 </div>
 );
}
