import type { Metadata } from "next";
import { cookies } from "next/headers";

import { createLogger } from "@/lib/logger";

import { AdminErrorState } from "../ui/AdminErrorState";

import LeadsCRM from "./LeadsCRM";
import { fetchAdminLeads, parseLeadFilters } from "./queries";

export const metadata: Metadata = {
 title: "Leads | Admin",
 robots: { index: false, follow: false },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
 const logger = createLogger("admin:leads");
 const { filters, page } = parseLeadFilters(searchParams ?? {});
 try {
 const accessToken = cookies().get("admin_sb_at")?.value;
 const payload = await fetchAdminLeads({ filters, page, accessToken });
 return <LeadsCRM {...payload} filters={filters} />;
 } catch (error) {
 logger.error("Falha ao carregar leads", { error, page, filters });
 return (
 <AdminErrorState
 title="Erro ao carregar leads"
 message="Nao foi possivel carregar os leads agora. Tente novamente ou ajuste os filtros."
 actionHref="/admin/leads"
 actionLabel="Recarregar"
 />
 );
 }
}
