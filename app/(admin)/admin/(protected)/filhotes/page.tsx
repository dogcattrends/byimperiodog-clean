import type { Metadata } from "next";
import Link from "next/link";

import { fetchAdminPuppies, parsePuppyFilters } from "@/lib/admin/puppies";

import { AdminPageLayout } from "../components/AdminPageLayout";
import { PuppiesPageClient } from "../puppies/PuppiesPageClient";

export const metadata: Metadata = {
 title: "Filhotes | Admin",
 robots: { index: false, follow: false },
};

export default async function AdminFilhotesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
 const { filters, sort } = parsePuppyFilters(searchParams ?? {});
 const data = await fetchAdminPuppies({ filters, sort });

 return (
 <AdminPageLayout
 title="Filhotes"
 description="Listagem operacional com busca, filtros rápidos e acesso direto ao cadastro. Acompanhe leads, status e prioridades sem sair da tela."
 primaryAction={
 <Link
 href="/admin/filhotes/novo"
 className="admin-btn admin-btn-primary"
 >
 Novo filhote
 </Link>
 }
 secondaryActions={[
 <Link
 key="refresh-list"
 href="/admin/filhotes"
 className="admin-btn admin-btn-secondary"
 >
 Atualizar lista
 </Link>,
 <Link
 key="leads"
 href="/admin/leads"
 className="admin-btn admin-btn-secondary"
 >
 Leads em acompanhamento
 </Link>,
 ]}
 >
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
 </AdminPageLayout>
 );
}
