import type { Metadata } from "next";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

import { ConfigForm } from "./ui/ConfigForm";

export const metadata: Metadata = {
  title: "Configurações | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminConfigPage() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("admin_config")
    .select("id,brand_name,brand_tagline,contact_email,contact_phone,instagram,tiktok,whatsapp_message,followup_rules,avg_response_minutes,template_first_contact,template_followup,seo_title_default,seo_description_default,seo_meta_tags")
    .eq("id", "default")
    .maybeSingle();

  const config = {
    brand_name: data?.brand_name ?? "By Império Dog",
    brand_tagline: data?.brand_tagline ?? "Curadoria premium de Spitz Alemão",
    contact_email: data?.contact_email ?? "",
    contact_phone: data?.contact_phone ?? "",
    instagram: data?.instagram ?? "",
    tiktok: data?.tiktok ?? "",
    whatsapp_message:
      data?.whatsapp_message ??
      "Oi! Eu vi seu interesse nos filhotes da By Império Dog. Como posso te ajudar a escolher o Spitz ideal?",
    template_first_contact:
      data?.template_first_contact ??
      "Olá, vi sua mensagem sobre Spitz. Posso te mostrar fotos/vídeo e opções de cores e entregas.",
    template_followup:
      data?.template_followup ?? "Tudo bem? Ainda tem interesse no Spitz? Posso esclarecer dúvidas ou ajustar o valor/entrega.",
    avg_response_minutes: data?.avg_response_minutes ?? 30,
    followup_rules: data?.followup_rules ?? "Responder em até 30 min; 2 follow-ups em 24h; oferta expira em 48h.",
    seo_title_default: data?.seo_title_default ?? "By Império Dog • Spitz Alemão Anão (Lulu da Pomerânia)",
    seo_description_default:
      data?.seo_description_default ??
      "Filhotes de Spitz Alemão Anão com curadoria premium, saúde garantida e entrega segura. Veja cores, preços e vídeos.",
    seo_meta_tags: data?.seo_meta_tags ?? "spitz, lulu da pomerânia, filhotes, criação responsável",
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-[var(--text)]">Configurações</h1>
        <p className="text-sm text-[var(--text-muted)]">Marca, funil e SEO global do site.</p>
      </header>
      <ConfigForm initialData={config} />
    </div>
  );
}
