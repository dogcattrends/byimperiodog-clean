import "server-only";

export const PUPPIES_TABLE_LEGACY = "puppies" as const;
export const PUPPIES_TABLE_V2 = "puppies_v2" as const;

export type PuppiesReadTable = typeof PUPPIES_TABLE_LEGACY | typeof PUPPIES_TABLE_V2;

type SupabaseResponseLike = { error?: unknown };

function stringifySupabaseError(error: unknown): string | undefined {
 if (!error) return undefined;
 if (typeof error === "string") return error;
 if (error instanceof Error) return error.message;
 const maybeMessage = (error as { message?: unknown } | null)?.message;
 if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
 try {
 return JSON.stringify(error);
 } catch {
 return String(error);
 }
}

function parseTruthy(raw: string | undefined | null): boolean {
 const v = (raw ?? "").toLowerCase().trim();
 return v === "v2" || v === "puppies_v2" || v === "2" || v === "true" || v === "1";
}

export function shouldPreferPuppiesV2(): boolean {
 return parseTruthy(process.env.PUPPIES_READ_SOURCE);
}

export function shouldPreferPuppiesV2FromEnv(envVar: string): boolean {
 return parseTruthy(process.env[envVar]);
}

export async function withFallbackTable<R extends SupabaseResponseLike>(opts: {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 sb: any;
 primary: string;
 fallback: string;
 query: (table: string) => Promise<R>;
}): Promise<
 R & {
 table: string;
 usedFallback: boolean;
 firstError?: string;
 }
> {
 const first = await opts.query(opts.primary);
 if (!first?.error) {
 return Object.assign(first, { table: opts.primary, usedFallback: false });
 }

 const fallback = await opts.query(opts.fallback);
 return Object.assign(fallback, {
 table: opts.fallback,
 usedFallback: true,
 firstError: stringifySupabaseError(first.error),
 });
}

export async function withPuppiesReadTable<R extends SupabaseResponseLike>(opts: {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 sb: any;
 preferV2?: boolean;
 query: (table: PuppiesReadTable) => Promise<R>;
}): Promise<
 R & {
 table: PuppiesReadTable;
 usedFallback: boolean;
 firstError?: string;
 }
> {
 const preferV2 = opts.preferV2 ?? shouldPreferPuppiesV2();

 if (!preferV2) {
 const res = await opts.query(PUPPIES_TABLE_LEGACY);
 return Object.assign(res, { table: PUPPIES_TABLE_LEGACY, usedFallback: false });
 }

 const res = await withFallbackTable({
 sb: opts.sb,
 primary: PUPPIES_TABLE_V2,
 fallback: PUPPIES_TABLE_LEGACY,
 query: opts.query as (table: string) => Promise<R>,
 });

 return res as unknown as R & {
 table: PuppiesReadTable;
 usedFallback: boolean;
 firstError?: string;
 };
}
