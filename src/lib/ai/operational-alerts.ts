import { supabaseAdmin } from "../supabaseAdmin";

export type Alerts = {
 critical: string[];
 medium: string[];
 low: string[];
};

function daysBetween(created?: string | null) {
 if (!created) return 0;
 return (Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24);
}

export async function generateOperationalAlerts(): Promise<Alerts> {
 const sb = supabaseAdmin();

 const [{ data: puppies }, { data: leads }] = await Promise.all([
 sb
 .from("puppies")
 .select("id,name,slug,status,price_cents,created_at,color,midia")
 .order("created_at", { ascending: false }),
 sb
 .from("leads")
 .select("id,created_at,status,cor_preferida,sexo_preferido,page_slug,page,last_contact_at")
 .gte("created_at", new Date(Date.now() - 120 * 86400 * 1000).toISOString())
 .order("created_at", { ascending: false }),
 ]);

 const alerts: Alerts = { critical: [], medium: [], low: [] };
 const puppyLeadCount = new Map<string, number>();

 (leads ?? []).forEach((l: unknown) => {
 const row = l as Record<string, unknown>;
 const slug = String(row.page_slug ?? row.page ?? "");
 if (!slug) return;
 puppyLeadCount.set(slug, (puppyLeadCount.get(slug) ?? 0) + 1);
 });

 // Map estoque por cor para comparar com demanda
 const stockByColor = new Map<string, number>();
 (puppies ?? [])
 .filter((p: unknown) => String((p as Record<string, unknown>).status ?? "available") === "available")
 .forEach((p: unknown) => {
 const row = p as Record<string, unknown>;
 const c = String(row.color ?? "desconhecida").toLowerCase();
 stockByColor.set(c, (stockByColor.get(c) ?? 0) + 1);
 });

 // Filhotes sem foto / sem preço / tempo de estoque
 (puppies ?? []).forEach((p: unknown) => {
 const row = p as Record<string, unknown>;
 const id = String(row.id ?? "");
 const name = String(row.name ?? row.slug ?? id);
 const midia = row.midia as unknown[] | undefined;
 if (!midia || midia.length === 0) alerts.medium.push(`Filhote sem foto: ${name}`);
 const price = Number(row.price_cents ?? 0) || 0;
 if (!price || price <= 0) alerts.medium.push(`Filhote sem preço: ${name}`);
 if (daysBetween(String(row.created_at ?? null)) > 90 && String(row.status ?? "available") === "available") {
 alerts.medium.push(`Filhote >90 dias no estoque: ${name}`);
 }

 const leadHits = puppyLeadCount.get(String(row.slug ?? "")) ?? 0;
 if (leadHits >= 20 && String(row.status ?? "available") === "available") {
 alerts.critical.push(`Risco de overbooking: ${name} com ${leadHits} leads.`);
 }
 });

 // Leads sem resposta >2h
 const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
 (leads ?? []).forEach((l: unknown) => {
 const row = l as Record<string, unknown>;
 const last = row.last_contact_at ? new Date(String(row.last_contact_at)).getTime() : new Date(String(row.created_at)).getTime();
 const status = String(row.status ?? "");
 if ((!status || status === "novo") && last < twoHoursAgo) {
 alerts.medium.push(`Lead sem resposta >2h: ${String(row.id ?? "")}`);
 }
 });

 // Demanda por cor > estoque
 const demandByColor = new Map<string, number>();
 (leads ?? []).forEach((l: unknown) => {
 const row = l as Record<string, unknown>;
 const c = String(row.cor_preferida ?? "desconhecida").toLowerCase();
 demandByColor.set(c, (demandByColor.get(c) ?? 0) + 1);
 });
 demandByColor.forEach((demand, color) => {
 const stock = stockByColor.get(color) ?? 0;
 if (demand >= stock * 2 && demand > 5) {
 alerts.critical.push(`Alta demanda x estoque baixo para cor ${color}: leads ${demand}, estoque ${stock}.`);
 } else if (demand > stock && demand > 3) {
 alerts.medium.push(`Demanda maior que estoque para cor ${color}: leads ${demand}, estoque ${stock}.`);
 }
 });

 // Compacta e remove duplicados
 alerts.critical = Array.from(new Set(alerts.critical));
 alerts.medium = Array.from(new Set(alerts.medium));
 alerts.low = Array.from(new Set(alerts.low));

 return alerts;
}
