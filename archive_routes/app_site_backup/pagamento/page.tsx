import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Formas de pagamento | By Império Dog",
  description: "Pix, cartão e condições especiais para reservar seu Spitz com segurança.",
  alternates: { canonical: `${SITE}/pagamento` },
};

export default function PagamentoPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-zinc-900">Pagamento</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Pix/Transferência</h2>
          <p className="text-zinc-600">Reserva liberada rapidamente após confirmação.</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Cartão</h2>
          <p className="text-zinc-600">Opções via link com taxas da operadora.</p>
        </div>
      </div>
    </main>
  );
}

