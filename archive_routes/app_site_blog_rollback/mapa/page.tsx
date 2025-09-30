import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Row = { slug: string; title: string; created_at: string; status: string };

export default async function BlogMapaPage() {
  const sb = supabaseAdmin();
  const { data } = await sb.from('blog_posts').select('slug,title,created_at,status').eq('status','published').order('created_at',{ascending:false});
  const rows = (data||[]) as Row[];
  const clusters: Record<string, Row[]> = {};
  const clusterRules: { key: string; match: RegExp }[] = [
    { key: 'Guia', match: /guia|completo|tamanho|peso/i },
    { key: 'Comportamento', match: /comport|adestra|socializa|ansiedade|latid/i },
    { key: 'Saúde', match: /vacina|saude|vermifuga|doenca|bucal/i },
    { key: 'Alimentação', match: /alimenta/i },
    { key: 'Grooming', match: /groom|pelagem|tosa|queda/i },
    { key: 'Compra & Planejamento', match: /comprar|custo|checklist|criador/i },
    { key: 'Estilo de Vida', match: /apartamento|enriquecimento/i },
  ];
  function classify(r: Row) {
    for (const c of clusterRules) if (c.match.test(r.slug) || c.match.test(r.title)) return c.key;
    return 'Outros';
  }
  for (const r of rows) {
    const c = classify(r);
    clusters[c] ||= [];
    clusters[c].push(r);
  }
  const clusterKeys = Object.keys(clusters).sort();
  const now = Date.now();
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Mapa de Conteúdo (Clusters)</h1>
  <p className="text-sm text-zinc-600 mb-6">Distribuição dos artigos publicados por cluster temático. Itens marcados como &quot;Novo&quot; foram publicados nos últimos 7 dias.</p>
      <div className="space-y-8">
        {clusterKeys.map(key => (
          <div key={key}>
            <h2 className="mb-2 text-xl font-semibold">{key}</h2>
            <ul className="space-y-1">
              {clusters[key].map(r => {
                const isNew = (now - new Date(r.created_at).getTime()) < 7*24*3600*1000;
                const isGuide = /guia|completo/i.test(r.slug) || /guia|completo/i.test(r.title);
                return (
                  <li key={r.slug} className="text-sm flex gap-2 items-center">
                    <Link href={`/blog/${r.slug}`} className="text-blue-700 hover:underline">{r.title}</Link>
                    {isGuide && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 text-[10px] uppercase">Guia</span>}
                    {isNew && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700 text-[10px] uppercase">Novo</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}