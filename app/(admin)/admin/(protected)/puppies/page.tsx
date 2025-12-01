import type { Metadata } from "next";

import { listPuppiesCatalog } from "@/lib/data/supabase";
import { PuppiesPageClient } from "./PuppiesPageClient";

export const metadata: Metadata = {
  title: "Filhotes | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPuppiesPage() {
  const { puppies } = await listPuppiesCatalog({}, "recent", { limit: 200 });

  // Serializa para evitar erro de Date não serializável no client component
  const serializedPuppies = puppies.map((p) => ({
    ...p,
    birthDate: p.birthDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    readyForAdoptionDate: p.readyForAdoptionDate?.toISOString(),
    publishedAt: p.publishedAt?.toISOString(),
    soldAt: p.soldAt?.toISOString(),
    reservedAt: p.reservedAt?.toISOString(),
    reservationExpiresAt: p.reservationExpiresAt?.toISOString(),
    vaccinationDates: p.vaccinationDates?.map((d) => d.toISOString()),
    nextVaccinationDate: p.nextVaccinationDate?.toISOString(),
  }));

  return (
    <div className="space-y-[var(--space-6)]">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Filhotes</h1>
          <p className="text-sm text-[var(--text-muted)]">Gerencie os filhotes (criar, editar, status).</p>
        </div>
        <a
          href="/admin/puppies/new"
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] bg-emerald-600 px-[var(--space-4)] py-[var(--space-2)] text-sm font-semibold text-white shadow-[var(--elevation-2)] transition hover:bg-emerald-700 hover:shadow-[var(--elevation-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Novo filhote
        </a>
      </header>

      <PuppiesPageClient items={serializedPuppies as any} leadCounts={{}} />
    </div>
  );
}
