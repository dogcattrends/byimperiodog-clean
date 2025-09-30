import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Entrega e alcance | By Império Dog",
  description: "Entregamos com segurança em todo o Brasil. Opções aérea e terrestre, com acompanhamento.",
  alternates: { canonical: `${SITE}/entrega` },
};

export default function EntregaPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-zinc-900">Entrega</h1>
      <p className="mt-2 text-zinc-600">Opções de envio seguras e acompanhamento até a chegada do filhote.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 text-zinc-700">
        <li className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Entrega aérea</h2>
          <p>Despacho com companhia parceira e retirada no aeroporto da sua cidade.</p>
        </li>
        <li className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Terrestre/retirada</h2>
          <p>Rotas dedicadas em capitais ou retirada presencial com horário agendado.</p>
        </li>
      </ul>
    </main>
  );
}

