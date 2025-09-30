import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { notFound } from "next/navigation";

import { supabasePublic } from "@/lib/supabasePublic";
import { mapRowToPuppy, extractImageUrls } from "@/lib/puppyMapper";
import { formatBRL, formatDate } from "@/lib/formatters";
import PuppyGallery from "@/components/PuppyGallery";

const WA = process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/5511968633239";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supa = supabasePublic();
  const { data } = await supa
    .from("puppies")
    .select("id,nome,cor,color,gender,price_cents,preco,midia,status,nascimento,created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) return { title: "Filhote | By Imperio Dog" };

  const p = mapRowToPuppy(data);
  const imgs = extractImageUrls(data.midia);
  const title = `${p.name} • ${p.color} • ${p.gender === "male" ? "Macho" : "Fêmea"}`;
  const description = `Spitz Alemão Anão ${p.color}, ${p.gender === "male" ? "macho" : "fêmea"}. Status: ${
    p.status === "disponivel" ? "Disponível" : p.status === "reservado" ? "Reservado" : "Vendido"
  }.`;

  return {
  title: `${title} | By Imperio Dog`,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE}/filhote/${p.id}`,
      images: imgs.slice(0, 4).map((u) => ({ url: u })),
    },
    alternates: { canonical: `${SITE}/filhote/${p.id}` },
  };
}

export default async function PuppyPage({ params }: Props) {
  const supa = supabasePublic();
  const { data, error } = await supa
    .from("puppies")
    .select("id,nome,cor,color,gender,price_cents,preco,midia,status,nascimento,created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (error) console.error(error);
  if (!data) notFound();

  const p = mapRowToPuppy(data);
  const images = extractImageUrls(data.midia);

  const label = p.status === "disponivel" ? "Disponível" : p.status === "reservado" ? "Reservado" : "Vendido";

  const text = encodeURIComponent(
  `Olá! Vi o filhote *${p.name}* (${p.color}, ${p.gender === "male" ? "macho" : "fêmea"}) no site By Imperio Dog e quero saber mais.`
  );
  const waLink = `${WA}?text=${text}`;

  // JSON-LD (Product)
  const ld: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: `Spitz Alemão Anão ${p.color}, ${p.gender === "male" ? "macho" : "fêmea"}`,
    image: images,
  brand: { "@type": "Brand", name: "By Imperio Dog" },
    itemCondition: "https://schema.org/NewCondition",
    offers:
      p.status === "disponivel"
        ? {
            "@type": "Offer",
            price: (p.priceCents || 0) / 100,
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            url: `${SITE}/filhote/${p.id}`,
          }
        : {
            "@type": "Offer",
            availability: "https://schema.org/OutOfStock",
            priceCurrency: "BRL",
            url: `${SITE}/filhote/${p.id}`,
          },
  };

  return (
    <>
      <Script id="ld-product" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Script
        id="ld-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Filhotes", item: `${SITE}/filhotes` },
              { "@type": "ListItem", position: 3, name: p.name, item: `${SITE}/filhote/${p.id}` },
            ],
          }),
        }}
      />
  <main className="bg-[var(--surface)] text-[var(--text)]">
        <div className="mx-auto max-w-7xl px-4 py-10">
          {/* breadcrumb */}
          <div className="mb-6 text-sm text-[var(--text-muted)]">
            <Link href={"/" as any} className="hover:underline decoration-brand underline-offset-4 focus-visible:focus-ring">
              Início
            </Link>{" "}
            /{" "}
            <a href="/#filhotes" className="hover:underline decoration-brand underline-offset-4 focus-visible:focus-ring">
              Filhotes
            </a>{" "}
            / <span className="text-[var(--text)]">{p.name}</span>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Galeria */}
            <PuppyGallery images={images} alt={`Filhote ${p.name} | ${p.color}`} />

            {/* Ficha */}
            <section className="space-y-6">
              <div>
                <span
                  className={[
                    "mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring",
                    p.status === "disponivel"
                      ? "bg-brand/15 text-zinc-800 ring-brand/30"
                      : p.status === "reservado"
                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                      : "bg-rose-50 text-rose-700 ring-rose-200",
                  ].join(" ")}
                  aria-label={`Status: ${label}`}
                >
                  {label}
                </span>
                <h1 className="mt-2 text-2xl font-bold md:text-3xl text-[var(--text)]">{p.name}</h1>
                <p className="mt-1 text-[var(--text-muted)]">{p.color} • {p.gender === "male" ? "Macho" : "Fêmea"}</p>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
                <dl className="grid grid-cols-2 gap-4 text-sm text-[var(--text)]">
                  <div>
                    <dt className="text-[var(--text-muted)]">Nascimento</dt>
                    <dd className="font-medium text-[var(--text)]">{formatDate((p as any).birth || null)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--text-muted)]">Preço</dt>
                    <dd className="font-semibold text-[var(--text)]">
                      <span className="underline decoration-brand decoration-2 underline-offset-4">{formatBRL(p.priceCents)}</span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-3">
                {p.status === "disponivel" ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-whatsapp px-5 py-3 text-base font-semibold text-on-whatsapp transition hover:brightness-95 focus-visible:focus-ring active:scale-[0.98]"
                  >
                    Falar no WhatsApp
                  </a>
                ) : (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-whatsapp px-5 py-3 text-base font-semibold text-[var(--text)] transition hover:bg-brand/10 hover:underline decoration-brand underline-offset-4 focus-visible:focus-ring active:scale-[0.98]"
                  >
                    Avisar se ficar disponível
                  </a>
                )}
                <a href="/#filhotes" className="inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] focus-visible:focus-ring">
                  Voltar aos filhotes
                </a>
              </div>

              <div className="prose prose-zinc max-w-none text-[var(--text)]">
                <h3>Sobre este filhote</h3>
                <p>
                  Criado com carinho, socialização e acompanhamento de saúde. Na By Império Dog, cada filhote recebe
                  cuidado, orientação e suporte no pós-venda.
                </p>
                <ul>
                  <li>Pedigree reconhecido</li>
                  <li>Vacinação e vermifugação em dia</li>
                  <li>Entrega aérea em todo o Brasil</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
