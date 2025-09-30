import { supabasePublic } from "@/lib/supabasePublic";
import Link from "next/link";

export const revalidate = 60;

export default async function SeriesPage({ params, searchParams }: { params: { slug: string }; searchParams?: { page?: string } }) {
  const slug = decodeURIComponent(params.slug || "").trim().toLowerCase();
  const sb = supabasePublic();
  try {
    // tenta obter série e posts; se tabelas não existirem, cai no fallback
    const { data: series } = await sb.from("blog_series").select("id,name,slug,description,updated_at,created_at").or(`slug.eq.${slug},name.ilike.%${slug}%`).limit(1);
    const s = series?.[0];
    if (!s) return fallback();
    const { data: links } = await sb.from("blog_post_series").select("post_id").eq("series_id", s.id).limit(1000);
    const ids = (links || []).map((l: any) => l.post_id);
    const posts = ids.length
      ? await sb
          .from("blog_posts")
          .select("id,slug,title,excerpt,published_at")
          .eq("status", "published")
          .in("id", ids)
          .order("published_at", { ascending: false })
          .limit(50)
      : { data: [] };
    return (
      <main className="mx-auto max-w-6xl px-6 py-10 text-zinc-900">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold leading-tight">Série: {s.name}</h1>
          {s.description && <p className="mt-1 text-zinc-600 max-w-2xl">{s.description}</p>}
          <div className="mt-3">
            <Link href="/blog" className="text-zinc-600 underline">Ver blog</Link>
          </div>
        </header>
        {!(posts.data || []).length ? (
          <p className="text-sm text-zinc-600">Nenhum post nesta série ainda.</p>
        ) : (
          <ul className="space-y-3">
            {(posts.data || []).map((p: any) => (
              <li key={p.id} className="border rounded p-3 bg-white">
                <Link href={`/blog/${p.slug}`} className="font-medium hover:underline">{p.title}</Link>
                {p.excerpt && <p className="text-sm text-zinc-600 line-clamp-2">{p.excerpt}</p>}
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  } catch {
    return fallback();
  }
}

function fallback() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-zinc-900">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold leading-tight">Série não encontrada</h1>
        <Link href="/blog" className="mt-3 inline-block rounded border px-3 py-1 text-sm">Voltar ao Blog</Link>
      </header>
    </main>
  );
}

