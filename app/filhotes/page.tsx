import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import PuppiesGridPremium from "@/components/PuppiesGridPremium";
import type { Puppy } from "@/types/domain";

export const metadata: Metadata = {
  title: "Filhotes Disponiveis - Spitz Alemao | By Imperio Dog",
  description:
    "Descubra filhotes de Spitz Alemao disponiveis para adocao. Criados com amor, saude garantida e suporte completo. Reserve seu filhote hoje!",
  alternates: {
    canonical: "/filhotes",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchPuppies(): Promise<Puppy[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("puppies")
      .select("*")
      .in("status", ["disponivel", "reservado"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar filhotes:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("Nenhum filhote encontrado com status disponivel ou reservado");
      return [];
    }

    return data.map(normalizePuppyFromDB);
  } catch (error) {
    console.error("Erro ao buscar filhotes:", error);
    return [];
  }
}

export default async function FilhotesPage() {
  const puppies = await fetchPuppies();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50/30">
      <PuppiesGridPremium initialItems={puppies} />
    </div>
  );
}























