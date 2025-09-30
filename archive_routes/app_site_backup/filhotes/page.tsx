import type { Metadata } from "next";
import PuppiesGrid from "@/components/PuppiesGrid";
import { supabasePublic } from "@/lib/supabasePublic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Filhotes de Spitz Alemão Anão disponíveis | By Império Dog",
  description:
    "Veja nossos filhotes de Spitz Alemão Anão (Lulu da Pomerânia) disponíveis para compra. Pedigree, saúde e suporte pós-venda.",
  alternates: { canonical: `${SITE}/filhotes` },
  openGraph: {
    title: "Filhotes de Spitz Alemão Anão disponíveis | By Império Dog",
    description:
      "Veja nossos filhotes disponíveis com pedigree, entrega segura e acompanhamento pós-venda.",
    url: `${SITE}/filhotes`,
  },
};

export default async function FilhotesPage() {
  const sb = supabasePublic();
  const { data } = await sb
    .from("puppies")
    .select("id,nome,cor,color,gender,status,created_at")
    .in("status", ["disponivel", "available", "reservado", "reserved", "vendido", "sold"]) // lista completa para não vazar apenas disponíveis
    .order("created_at", { ascending: false })
    .limit(6);
  const items = (data || []).map((p: any, i: number) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE}/filhote/${p.id}`,
    name: p.nome || `Filhote ${String(p.id).slice(0, 6)}`,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900">Filhotes disponíveis</h1>
        <p className="mt-1 text-zinc-600">
          Escolha seu Spitz Alemão Anão com segurança. Fale conosco para reservar e tirar dúvidas.
        </p>
      </header>
      {/* JSON-LD ItemList para SEO da listagem */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: items,
          }),
        }}
      />
      <PuppiesGrid />
    </main>
  );
}

