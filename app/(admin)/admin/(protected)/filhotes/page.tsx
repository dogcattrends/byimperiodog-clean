import type { Metadata } from "next";

import { fetchAdminPuppies, parsePuppyFilters } from "@/lib/admin/puppies";

import { PuppiesPageClient } from "../puppies/PuppiesPageClient";

export const metadata: Metadata = {
  title: "Filhotes | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminFilhotesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const { filters, sort } = parsePuppyFilters(searchParams ?? {});
  const data = await fetchAdminPuppies({ filters, sort });

  return (
    <div className="space-y-6">
      <header className="admin-glass-card admin-stagger-item flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="admin-card-title flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(251, 191, 36, 0.2))' }}>
              <svg className="h-5 w-5" style={{ color: 'rgb(var(--admin-brand))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
            Filhotes
          </h1>
          <p className="admin-card-subtitle mt-2">Gerencie os filhotes (criar, editar, status).</p>
        </div>
        <a
          href="/admin/filhotes/novo"
          className="admin-btn-primary admin-interactive admin-ripple admin-focus-ring admin-btn-mobile-full"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo filhote
        </a>
      </header>

      <PuppiesPageClient
        items={data.items}
        leadCounts={data.leadCounts}
        filters={filters}
        sort={sort}
        total={data.total}
        hasMore={data.hasMore}
        statusSummary={data.statusSummary}
        colorOptions={data.colorOptions}
        cityOptions={data.cityOptions}
        basePath="/admin/filhotes"
      />
    </div>
  );
}
