import { createClient } from "@supabase/supabase-js";

export const revalidate = 60;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export default async function Home() {
  const { data: pups } = await supabase
    .from("puppies")
    .select("id,nome,cor,gender,price_cents,status,created_at")
    .in("status", ["disponivel","available"])
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <main>
  <section className="bg-brand text-on-brand">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Spitz Alemão Anão com excelência
            </h1>
            <p className="mt-4 max-w-prose text-on-brand/90">
              Filhotes selecionados, entrega responsável e pós-venda acolhedor.
            </p>
            <a href="/#filhotes" className="mt-6 inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 font-semibold text-on-accent shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:focus-ring-accent active:translate-y-0">
              Ver filhotes disponíveis
            </a>
          </div>
          <div className="rounded-3xl bg-brand/25 p-4 ring-1 ring-brand/30">
            <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-brand/20" />
          </div>
        </div>
      </section>

      <section id="filhotes" className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Filhotes disponíveis</h2>
          <a href="/contato" className="hidden rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:focus-ring active:scale-[0.98] transition md:inline-block">
            Falar no WhatsApp
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(pups ?? []).map((p) => (
            <article key={p.id} className="group rounded-3xl border border-[var(--border)] p-2 transition hover:shadow-md focus-within:shadow-md">
              <div className="overflow-hidden rounded-2xl bg-[var(--surface-2)]">
                <div className="aspect-[4/3] w-full bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] transition group-hover:scale-[1.01]" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-[var(--text)]">{p.nome ?? "Spitz Alemão Anão"}</h3>
                <p className="text-sm text-[var(--text-muted)]">{p.cor ?? "Cor indefinida"} {" · "} {p.gender === "female" ? "Fêmea" : "Macho"}</p>
                <p className="mt-2 text-xl font-bold text-[var(--text)]">
                  {(() => {
                    const priceCents = (p && typeof p === 'object' && 'price_cents' in p) ? (p as { price_cents?: number }).price_cents ?? 0 : 0;
                    return `R$ ${(priceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                  })()}
                </p>
                <div className="mt-4 flex gap-2">
                  <a href={`/filhote/${p.id}`} className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2 text-center text-[var(--text)] transition hover:bg-[var(--surface-2)] focus-visible:focus-ring active:scale-[0.98]">Ver detalhes</a>
                  <a href={`/reserva/${p.id}`} className="flex-1 rounded-xl bg-brand px-4 py-2 text-center font-medium text-on-brand transition hover:brightness-110 focus-visible:focus-ring active:scale-[0.98]">Reservar</a>
                </div>
              </div>
            </article>
          ))}
          {!(pups ?? []).length && (
            <div className="col-span-full rounded-2xl border border-[var(--border)] p-6 text-center text-[var(--text-muted)]">
              Nenhum filhote disponível no momento.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}


