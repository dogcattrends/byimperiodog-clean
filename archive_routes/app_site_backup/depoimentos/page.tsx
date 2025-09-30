import type { Metadata } from "next";
import Testimonials from "@/components/Testimonials";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Depoimentos de clientes | By Império Dog",
  description: "Fotos e relatos de quem já comprou seu Spitz conosco.",
  alternates: { canonical: `${SITE}/depoimentos` },
};

export default function DepoimentosPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <Testimonials jsonLd title="Clientes satisfeitos" />
    </main>
  );
}

