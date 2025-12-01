import type { Metadata } from "next";

import LeadsCRM from "./LeadsCRM";
import { listLeadsAdmin } from "@/lib/data/supabase";

export const metadata: Metadata = {
  title: "Leads | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLeadsPage() {
  const { items } = await listLeadsAdmin(100, 0);

  return <LeadsCRM items={(items ?? []) as any} />;
}
