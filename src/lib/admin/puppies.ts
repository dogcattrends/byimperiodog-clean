import "server-only";

import { cookies } from "next/headers";

import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseUserClient } from "@/lib/supabaseClient";
import { supabasePublic } from "@/lib/supabasePublic";
import type { Database } from "@/types/supabase";

const STATUS_TO_DB = {
 available: "disponivel",
 reserved: "reservado",
 sold: "vendido",
 pending: "pendente",
 coming_soon: "em_breve",
 unavailable: "indisponivel",
} as const;

const DB_TO_STATUS = new Map<string, AdminPuppyStatus>([
 ["disponivel", "available"],
 ["available", "available"],
 ["reservado", "reserved"],
 ["reserved", "reserved"],
 ["vendido", "sold"],
 ["sold", "sold"],
 ["em_breve", "coming_soon"],
 ["embreve", "coming_soon"],
 ["em-breve", "coming_soon"],
 ["pendente", "coming_soon"],
 ["pending", "coming_soon"],
 ["indisponivel", "unavailable"],
 ["indisponível", "unavailable"],
 ["unavailable", "unavailable"],
 ["arquivado", "unavailable"],
]);

const SORT_OPTIONS = ["recent", "status-available", "status-reserved"] as const;

export type AdminPuppyStatus = keyof typeof STATUS_TO_DB;
export type AdminPuppySort = (typeof SORT_OPTIONS)[number];

export type ParsedPuppyFilters = {
 statuses: AdminPuppyStatus[];
 colors: string[];
 city?: string;
 sex?: "male" | "female";
 search?: string;
};

export type AdminPuppyListItem = {
 id: string;
 name: string;
 slug?: string | null;
 status: AdminPuppyStatus;
 rawStatus?: string;
 color?: string | null;
 sex?: "male" | "female" | null;
 city?: string | null;
 state?: string | null;
 priceCents: number;
 createdAt: string;
 imageUrl?: string | null;
 demandScore?: number | null;
 demandFlag?: string | null;
 demandReason?: string | null;
};

export type AdminPuppiesPayload = {
 items: AdminPuppyListItem[];
 total: number;
 hasMore: boolean;
 leadCounts: Record<string, number>;
 colorOptions: string[];
 cityOptions: string[];
 statusSummary: Record<AdminPuppyStatus, number>;
};

type PuppyRow = Database["public"]["Tables"]["puppies"]["Row"] & {
 catalog_ranking?: { score?: number | null; flag?: string | null; reason?: string | null } | null;
};

type StatusAggRow = { status: string | null; count: number };

type ColorRow = { color: string | null };
type CityRow = { cidade: string | null };
type CityRowAlt = { city: string | null };
type ColorRowAlt = { cor: string | null };

type LeadAggRow = { page_slug?: string | null; count: number };

async function fetchLeadCounts(
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 supabase: any,
 slugList: string[],
): Promise<Record<string, number>> {
 const { data, error } = await supabase
 .from("leads")
 .select("page_slug, count:page_slug", { group: "page_slug" })
 .in("page_slug", slugList);

 if (error) {
 const message = error.message?.toLowerCase() ?? "";
 if (message.includes("column") || message.includes("page_slug")) {
 return {};
 }
 throw error;
 }

 const counts: Record<string, number> = {};
 (data as LeadAggRow[]).forEach((row) => {
 const value = row.page_slug;
 if (!value) return;
 const normalized = value.replace(/^filhotes\//, "");
 counts[normalized] = Number(row.count) || 0;
 });
 return counts;
}

const DEFAULT_LIMIT = 200;

const normalizeSearch = (value?: string) => value?.normalize("NFD").replace(/[`´~^]/g, "").trim();

const slugifyValue = (value?: string | null) => {
 if (!value) return null;
 return value
 .normalize("NFD")
 .replace(/\p{Diacritic}/gu, "")
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/^-+|-+$/g, "");
};

const buildSlug = (row: PuppyRow) => {
 const maybeSlug = (row as unknown as Record<string, unknown>).slug;
 if (typeof maybeSlug === "string" && maybeSlug.trim()) return maybeSlug.trim();
 if (typeof row.codigo === "string" && row.codigo.trim()) return row.codigo.trim();
 return slugifyValue(row.nome ?? row.name ?? null);
};

function parseList(param?: string | string[] | null): string[] {
 if (!param) return [];
 const value = Array.isArray(param) ? param.join(",") : param;
 return value
 .split(/[,|]/)
 .map((chunk) => chunk.trim())
 .filter((s): s is string => typeof s === "string" && s.length > 0);
}

function normalizeStatus(value?: string | null): AdminPuppyStatus {
 if (!value) return "available";
 const slug = value.toLowerCase().replace(/\s+/g, "_");
 return DB_TO_STATUS.get(slug) ?? DB_TO_STATUS.get(value.toLowerCase()) ?? "available";
}

function normalizeSex(row: PuppyRow): "male" | "female" | null {
 const sex = row.gender ?? (row as Record<string, unknown>).sex ?? row.sexo;
 if (!sex) return null;
 const value = String(sex).toLowerCase();
 if (value === "male" || value.startsWith("mach")) return "male";
 return "female";
}

function normalizePrice(row: PuppyRow): number {
 if (typeof row.price_cents === "number") return row.price_cents;
 const camelPrice = (row as { priceCents?: number | null }).priceCents;
 if (typeof camelPrice === "number") return camelPrice;
 if (typeof row.preco === "number") return Math.round(row.preco * 100);
 const precoRaw = (row as Record<string, unknown>).preco;
 if (typeof precoRaw === "string" && precoRaw.trim()) {
 const normalized = precoRaw.replace(/\./g, "").replace(/,/g, ".");
 const parsed = Number(normalized);
 if (Number.isFinite(parsed)) return Math.round(parsed * 100);
 }
 return 0;
}

function selectCover(row: PuppyRow): string | null {
 const maybeMain = (row as Record<string, unknown>).main_image_url;
 if (typeof maybeMain === "string" && maybeMain.length) return maybeMain;

 if (typeof row.cover_url === "string" && row.cover_url.length) return row.cover_url;

 const gallery = (row as Record<string, unknown>).gallery;
 if (typeof gallery === "string" && gallery.trim()) {
 try {
 const parsed = JSON.parse(gallery);
 if (Array.isArray(parsed)) {
 const first = parsed.find((x) => typeof x === "string" && x.length) as string | undefined;
 if (first) return first;
 }
 } catch {
 // ignore
 }
 }
 if (Array.isArray(gallery)) {
 const first = (gallery as unknown[]).find((x) => typeof x === "string" && (x as string).length) as string | undefined;
 if (first) return first;
 }

 const mediaSources = Array.isArray(row.media) ? row.media : [];
 for (const entry of mediaSources) {
 if (typeof entry === "string" && entry.length) return entry;
 }
 // `midia` in the DB can be stored as JSON (array) or as a stringified JSON.
 let midiaEntries: unknown[] = [];
 if (Array.isArray(row.midia)) {
 midiaEntries = row.midia;
 } else if (typeof row.midia === "string") {
 try {
 const parsed = JSON.parse(row.midia);
 if (Array.isArray(parsed)) midiaEntries = parsed;
 } catch (err) {
 // ignore parse errors and continue
 midiaEntries = [];
 }
 }
 for (const entry of midiaEntries) {
 if (!entry || typeof entry !== "object") continue;
 const mediaItem = entry as { url?: unknown; type?: unknown };
 if (mediaItem.type === "image" && typeof mediaItem.url === "string" && mediaItem.url.length) {
 return mediaItem.url;
 }
 }
 for (const entry of midiaEntries) {
 if (!entry || typeof entry !== "object") continue;
 const mediaItem = entry as { url?: unknown };
 if (typeof mediaItem.url === "string" && mediaItem.url.length) {
 return mediaItem.url;
 }
 }
 return null;
}

export function parsePuppyFilters(searchParams: Record<string, string | string[] | undefined>) {
 const statuses = parseList(searchParams.status)
 .map((value) => value.replace(/-/g, "_"))
 .filter((value): value is AdminPuppyStatus => value in STATUS_TO_DB);

 const colors = parseList(searchParams.color);
 const cityParam = Array.isArray(searchParams.city) ? searchParams.city[0] : searchParams.city;
 const city = cityParam && cityParam.trim() ? cityParam.trim() : undefined;
 const sexParam = Array.isArray(searchParams.sex) ? searchParams.sex[0] : searchParams.sex;
 const sex = sexParam === "male" || sexParam === "female" ? sexParam : undefined;
 const search = normalizeSearch(Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search) || undefined;
 const sortParam = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
 const sort: AdminPuppySort = SORT_OPTIONS.includes(sortParam as AdminPuppySort) ? (sortParam as AdminPuppySort) : "recent";

 const filters: ParsedPuppyFilters = { statuses, colors, city, sex, search };
 return { filters, sort };
}

export async function fetchAdminPuppies({
 filters,
 sort,
 limit = DEFAULT_LIMIT,
}: {
 filters: ParsedPuppyFilters;
 sort: AdminPuppySort;
 limit?: number;
}): Promise<AdminPuppiesPayload> {
 const token = cookies().get("admin_sb_at")?.value;
 const supabase = hasServiceRoleKey()
 ? supabaseAdmin()
 : token
 ? createSupabaseUserClient(token)
 : supabasePublic();
 let query = supabase
 .from("puppies")
 .select(
 "*,catalog_ranking(score,flag,reason)",
 { count: "exact" },
 )
 .limit(limit);

 if (filters.statuses.length) {
 const dbStatuses = filters.statuses.map((status) => STATUS_TO_DB[status]);
 query = query.in("status", dbStatuses);
 }

 if (filters.colors.length) {
 // suporta schema canonical (color) e legado (cor)
 query = query.or(
 [
 `color.in.(${filters.colors.join(",")})`,
 `cor.in.(${filters.colors.join(",")})`,
 ].join(","),
 );
 }

 if (filters.city) {
 // suporta city (canonical) e cidade (legado)
 query = query.or(`city.eq.${filters.city},cidade.eq.${filters.city}`);
 }

 if (filters.sex) {
 const dbSex = filters.sex === "male" ? "macho" : "femea";
 query = query.or(`sex.eq.${filters.sex},gender.eq.${filters.sex},sexo.eq.${dbSex}`);
 }

 if (filters.search) {
 const like = `%${filters.search.replace(/%/g, "%")}%`;
 query = query.or(
 ["nome", "name", "slug", "color", "cidade", "city"].map((column) => `${column}.ilike.${like}`).join(","),
 );
 }

 switch (sort) {
 default:
 query = query.order("created_at", { ascending: false });
 }

 const [listRes, statusAggRes] = await Promise.all([
 query,
 supabase.from("puppies").select("status, count:id", { group: "status" }),
 ]);

 // color options: tenta primeiro `color`, depois fallback `cor`.
 let colorData: Array<ColorRow | ColorRowAlt> = [];
 try {
 const res = await supabase.from("puppies").select("color").not("color", "is", null);
 if (res.error) throw res.error;
 colorData = (res.data as ColorRow[]) ?? [];
 } catch {
 const res = await supabase.from("puppies").select("cor").not("cor", "is", null);
 if (res.error) throw new Error(res.error.message);
 colorData = (res.data as ColorRowAlt[]) ?? [];
 }

 // city options: tenta primeiro `cidade`, depois fallback `city`.
 let cityData: Array<CityRow | CityRowAlt> = [];
 try {
 const res = await supabase.from("puppies").select("cidade").not("cidade", "is", null);
 if (res.error) throw res.error;
 cityData = (res.data as CityRow[]) ?? [];
 } catch {
 const res = await supabase.from("puppies").select("city").not("city", "is", null);
 if (res.error) throw new Error(res.error.message);
 cityData = (res.data as CityRowAlt[]) ?? [];
 }

 if (listRes.error) throw new Error(listRes.error.message);
 if (statusAggRes.error) throw new Error(statusAggRes.error.message);

 const rows = (listRes.data ?? []) as PuppyRow[];
 const items: AdminPuppyListItem[] = rows.map((row) => ({
 id: row.id!,
 name: row.nome ?? row.name ?? "Sem nome",
 slug: buildSlug(row),
 status: normalizeStatus(row.status),
 rawStatus: row.status ?? "",
 color: (row.color ?? row.cor ?? null) as string | null,
 sex: normalizeSex(row),
 city: (row as Record<string, unknown>).city ? String((row as Record<string, unknown>).city) : (row.cidade ?? null),
 state: (row as Record<string, unknown>).state ? String((row as Record<string, unknown>).state) : (row.estado ?? null),
 priceCents: normalizePrice(row),
 createdAt: typeof row.created_at === "string" ? row.created_at : row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
 imageUrl: selectCover(row),
 demandScore: row.catalog_ranking?.score ?? null,
 demandFlag: row.catalog_ranking?.flag ?? null,
 demandReason: row.catalog_ranking?.reason ?? null,
 }));

 const slugSet = new Set<string>();
 items.forEach((item) => {
 if (item.slug) {
 slugSet.add(item.slug);
 slugSet.add(`filhotes/${item.slug}`);
 }
 });

 const leadCounts: Record<string, number> = {};
 if (slugSet.size) {
 const slugList = Array.from(slugSet);
 const fetched = await fetchLeadCounts(supabase, slugList);
 Object.assign(leadCounts, fetched);
 }

 const colorOptions = Array.from(
 new Set(
 (colorData as Array<ColorRow | ColorRowAlt>)
 .map((row) => ("color" in row ? row.color : row.cor))
 .filter((value): value is string => typeof value === "string" && value.length > 0),
 ),
 ).sort();

 const cityOptions = Array.from(
 new Set(
 (cityData as Array<CityRow | CityRowAlt>)
 .map((row) => ("cidade" in row ? row.cidade : row.city))
 .filter((value): value is string => typeof value === "string" && value.length > 0),
 ),
 ).sort((a, b) => a.localeCompare(b, "pt-BR"));

 const initialSummary: Record<AdminPuppyStatus, number> = {
 available: 0,
 pending: 0,
 reserved: 0,
 sold: 0,
 coming_soon: 0,
 unavailable: 0,
 };
 (statusAggRes.data as StatusAggRow[]).forEach((row) => {
 const status = normalizeStatus(row.status);
 initialSummary[status] += row.count ?? 0;
 });

 const total = listRes.count ?? items.length;

 const applyStatusSort = (list: AdminPuppyListItem[], mode: AdminPuppySort) => {
 if (mode === "recent") return list;
 const priority =
 mode === "status-available"
 ? { available: 0, reserved: 1, coming_soon: 2, pending: 3, sold: 4, unavailable: 5 }
 : { reserved: 0, available: 1, sold: 2, coming_soon: 3, pending: 4, unavailable: 5 };
 return [...list].sort((a, b) => {
 const pa = priority[a.status] ?? 99;
 const pb = priority[b.status] ?? 99;
 if (pa !== pb) return pa - pb;
 return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
 });
 };

 const sortedItems = applyStatusSort(items, sort);

 return {
 items: sortedItems,
 total,
 hasMore: total > items.length,
 leadCounts,
 colorOptions,
 cityOptions,
 statusSummary: initialSummary,
 };
}
