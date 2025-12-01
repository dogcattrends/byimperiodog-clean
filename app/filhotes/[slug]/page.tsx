/**
 * Product Page Premium - Filhote Individual
 * 
 * Arquitetura:
 * - Server Component com SSG/ISR
 * - Componentes modulares para Hero, Galeria, Detalhes, Benefícios, Confiança, CTAs e Relacionados
 * - SEO completo: metadados dinâmicos + JSON-LD (Product + Breadcrumb)
 * - UX otimizada para conversão: CTA primário sempre visível, hierarquia clara
 * - A11y WCAG 2.2 AA: semântica, labels, foco, contraste
 * - Performance: Next/Image, lazy loading, ISR
 */

import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import Link from "next/link";

import { buildProductLD, buildBreadcrumbLD } from "@/lib/schema";
import { getRelatedPuppies, buildDetailCrumbs } from "@/lib/interlinking";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { supabaseAnon } from "@/lib/supabaseAnon";
import { normalizePuppyFromDB } from "@/domain/puppy";
import PageViewPing from "@/components/PageViewPing";
import type { Puppy } from "@/domain/puppy";

import { PuppyHero } from "@/components/puppy/PuppyHero";
import { PuppyGallery } from "@/components/puppy/PuppyGallery";
import { PuppyDetails } from "@/components/puppy/PuppyDetails";
import { PuppyBenefits } from "@/components/puppy/PuppyBenefits";
import { PuppyTrust } from "@/components/puppy/PuppyTrust";
import { PuppyActionsClient } from "@/components/puppy/PuppyActionsClient";
import { PuppyRelated } from "@/components/puppy/PuppyRelated";

type Props = { params: { slug: string } };

// SEO: Metadados dinâmicos por filhote
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const puppy = await fetchPuppyBySlug(params.slug);
  if (!puppy) {
    return {
      title: "Filhote não encontrado | By Império Dog",
    };
  }

  const location = [puppy.city, puppy.state].filter(Boolean).join(", ");
  const sex = translateSex(puppy.sex);
  const title = `${puppy.name} - Spitz Alemão Anão ${puppy.color} ${sex} ${location ? `em ${location}` : ""}`;
  const description = puppy.description || `Filhote Spitz Alemão Anão ${puppy.color}, ${sex}. Pedigree CBKC, acompanhamento veterinário completo e mentoria vitalícia. ${location}`;

  return {
    title: `${title} | By Império Dog`,
    description: description.slice(0, 160),
    alternates: {
      canonical: `/filhotes/${puppy.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/filhotes/${puppy.slug}`,
      images: puppy.images?.[0] ? [{ url: puppy.images[0], alt: puppy.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: puppy.images?.[0] ? [puppy.images[0]] : [],
    },
  };
}

// SSG: Gerar páginas estáticas para puppies disponíveis
export async function generateStaticParams() {
  try {
    const sb = supabaseAnon();
    const { data } = await sb
      .from("puppies")
      .select("slug")
      .in("status", ["disponivel", "available", "reservado", "reserved"])
      .limit(50);
    
    return (data || []).map((p: any) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

// ISR: Revalidar a cada 5 minutos
export const revalidate = 300;

export default async function PuppyDetailPage({ params }: Props) {
  const puppy = await fetchPuppyBySlug(params.slug);
  
  if (!puppy) {
    return notFound();
  }

  // Buscar filhotes relacionados
  const relatedPuppies = await fetchRelatedPuppies(puppy);

  // Construir link do WhatsApp com contexto do filhote
  const whatsappLink = buildWhatsAppLink({
    message: `Olá! Vi o filhote ${puppy.name} (${puppy.color}, ${translateSex(puppy.sex)}) e quero mais informações sobre disponibilidade e valores.`,
    utmSource: "site",
    utmMedium: "product_page",
    utmCampaign: "puppy_detail",
    utmContent: puppy.slug,
  });

  // JSON-LD: Product Schema
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";
  const productLd = buildProductLD({
    ...puppy,
    birthDate: puppy.birthDate ? new Date(puppy.birthDate).toISOString().split("T")[0] : undefined,
    siteUrl,
    name: puppy.name,
    image: puppy.images?.[0] || "",
    gender: puppy.sex,
  });

  // JSON-LD: Breadcrumb
  const crumbs = buildDetailCrumbs(puppy);
  const breadcrumbLd = buildBreadcrumbLD(crumbs);

  return (
    <>
      {/* JSON-LD Schemas para SEO */}
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Analytics: ping de pageview */}
      <PageViewPing pageType="puppy" slug={puppy.slug} color={puppy.color} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb de navegação */}
        <nav className="mb-6" aria-label="Navegação estrutural">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            {crumbs.map((crumb, idx) => (
              <li key={crumb.url} className="flex items-center gap-2">
                {idx === crumbs.length - 1 ? (
                  <span className="font-medium text-zinc-900" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.url}
                    className="rounded px-1 py-0.5 transition hover:text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    {crumb.name}
                  </Link>
                )}
                {idx < crumbs.length - 1 && (
                  <span aria-hidden="true" className="text-zinc-400">
                    /
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Seção 1: Hero com foto principal, nome, preço, status e CTA primário */}
        <PuppyHero puppy={puppy} whatsappLink={whatsappLink} />

        {/* Seção 2: Galeria de fotos/vídeos (se houver mais de uma mídia) */}
        {puppy.images && puppy.images.length > 1 && (
          <div className="mt-12">
            <PuppyGallery images={puppy.images} name={puppy.name} />
          </div>
        )}

        {/* Seção 3: Detalhes do filhote (cor, sexo, idade, tamanho, etc.) */}
        <div className="mt-12">
          <PuppyDetails puppy={puppy} />
        </div>

        {/* Seção 4: Benefícios e diferenciais */}
        <div className="mt-16">
          <PuppyBenefits />
        </div>

        {/* Seção 5: Bloco de confiança (garantias, processo, transparência) */}
        <div className="mt-16">
          <PuppyTrust />
        </div>

        {/* Seção 6: CTAs de ação (WhatsApp, agendar visita, mais fotos) */}
        <div className="mt-16">
          <PuppyActionsClient
            whatsappLink={whatsappLink}
            puppyName={puppy.name}
            puppySlug={puppy.slug}
          />
        </div>

        {/* Seção 7: Filhotes relacionados */}
        {relatedPuppies.length > 0 && (
          <div className="mt-20">
            <PuppyRelated puppies={relatedPuppies} />
          </div>
        )}

        {/* Link de retorno ao catálogo */}
        <div className="mt-16 text-center">
          <Link
            href="/filhotes"
            className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            ← Ver todos os filhotes disponíveis
          </Link>
        </div>
      </main>
    </>
  );
}

// Data fetching: buscar filhote por slug no Supabase
async function fetchPuppyBySlug(slug: string): Promise<Puppy | null> {
  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from("puppies")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return normalizePuppyFromDB(data);
  } catch {
    return null;
  }
}

// Data fetching: buscar filhotes relacionados (por cor ou cidade)
async function fetchRelatedPuppies(current: Puppy): Promise<Puppy[]> {
  try {
    const sb = supabaseAnon();
    
    // Buscar por cor ou cidade, excluindo o atual
    const { data } = await sb
      .from("puppies")
      .select("*")
      .in("status", ["disponivel", "available"])
      .neq("id", current.id)
      .or(`cor.eq.${current.color},city.eq.${current.city}`)
      .limit(3);

    if (!data || data.length === 0) {
      // Fallback: buscar quaisquer disponíveis
      const { data: fallback } = await sb
        .from("puppies")
        .select("*")
        .in("status", ["disponivel", "available"])
        .neq("id", current.id)
        .limit(3);
      
      return (fallback || []).map(normalizePuppyFromDB);
    }

    return (data || []).map(normalizePuppyFromDB);
  } catch {
    return [];
  }
}

// Helper: traduzir sexo
function translateSex(sex?: string | null): string {
  if (!sex) return "";
  const lower = sex.toLowerCase();
  if (lower === "male" || lower === "macho") return "Macho";
  if (lower === "female" || lower === "femea" || lower === "fêmea") return "Fêmea";
  return sex;
}

