import type { Metadata } from "next";
import Link from "next/link";

import Breadcrumbs from "@/components/Breadcrumbs";
import SeoJsonLd from "@/components/SeoJsonLd";
import { baseBlogMetadata, canonical } from "@/lib/seo.core";
import { supabasePublic } from "@/lib/supabasePublic";

export const revalidate = 120; // 2 min

export async function generateMetadata(): Promise<Metadata> {
  const url = canonical("/blog/categorias");
  return baseBlogMetadata({
    title: "Categorias do Blog | By Imperio Dog",
    description: "Navegue pelas categorias dos artigos sobre Spitz Alemão (Lulu da Pomerânia).",
    alternates: { canonical: url },
    openGraph: { url, title: "Categorias do Blog | By Imperio Dog" },
  });
}

interface CategoryRow { id: string; name: string; slug: string }

async function fetchCategories(): Promise<CategoryRow[]> {
  const sb = supabasePublic();
  const { data } = await sb.from("blog_categories").select("id,name,slug").order("name", { ascending: true }).limit(500);
  return (data || []) as CategoryRow[];
}

export default async function BlogCategoriasPage() {
  const categories = await fetchCategories();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: categories.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `${siteUrl}/blog/categoria/${encodeURIComponent(c.slug)}`,
    })),
  };
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 text-zinc-900">
      <Breadcrumbs className="mb-3" items={[{ label: 'Início', href: '/' }, { label: 'Blog', href: '/blog' }, { label: 'Categorias' }]} />
      <SeoJsonLd data={jsonLd} />
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold leading-tight">Categorias do Blog</h1>
        <p className="mt-1 text-zinc-600 max-w-2xl">Agrupamentos temáticos para você explorar conteúdos sobre saúde, nutrição, cuidados, temperamento e mais do Spitz Alemão.</p>
      </header>
      {categories.length === 0 ? (
        <p className="text-zinc-600">Nenhuma categoria cadastrada.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categories.map(c => (
            <li key={c.id} className="group rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md">
              <h2 className="font-semibold text-zinc-800 group-hover:underline">
                <Link href={`/blog/categoria/${encodeURIComponent(c.slug)}`}>{c.name}</Link>
              </h2>
              <p className="mt-2 text-xs text-zinc-500">Ver artigos →</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-10 text-sm">
        <Link href="/blog" className="underline text-zinc-600">Voltar para o Blog</Link>
      </div>
    </main>
  );
}
