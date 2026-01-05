/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/supabase";

type StubBuilder = {
  then?: (onFulfilled?: (val: unknown) => unknown, onRejected?: (err: unknown) => unknown) => Promise<unknown>;
  catch?: (onRejected?: (err: unknown) => unknown) => Promise<unknown>;
  finally?: (cb?: () => void) => Promise<unknown>;
  [key: string]: unknown;
};

function makeStubBuilder(result: unknown = { data: null, error: null }): StubBuilder {
  const methods = [
    "select",
    "maybeSingle",
    "single",
    "eq",
    "neq",
    "lte",
    "gte",
    "lt",
    "gt",
    "in",
    "or",
    "order",
    "limit",
    "range",
    "insert",
    "update",
    "delete",
    "upsert",
    "rpc",
    "ilike",
    "like",
  ];

  const base = methods.reduce((acc, m) => {
    return Object.assign(acc, {
      [m]: (..._args: unknown[]) => acc,
    });
  }, {} as Record<string, unknown>);

  const builder: StubBuilder = Object.assign(base, {
    then: (onFulfilled?: (val: unknown) => unknown, onRejected?: (err: unknown) => unknown) =>
      Promise.resolve(result).then(
        (v) => (onFulfilled ? onFulfilled(v as unknown) : v),
        (e) => (onRejected ? onRejected(e as unknown) : undefined)
      ),
    catch: (onRejected?: (err: unknown) => unknown) =>
      Promise.resolve(result).catch((e) => (onRejected ? onRejected(e as unknown) : undefined)),
    finally: (cb?: () => void) => Promise.resolve(result).finally(() => cb?.()),
  });

  return builder;
}

export function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (!process.env.__SUPABASE_MISSING_LOGGED) {
      console.warn(
        "[supabaseAdmin] Credenciais Supabase ausentes; retornando stub. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para habilitar recursos administrativos."
      );
      process.env.__SUPABASE_MISSING_LOGGED = "1";
    }
    // fallback stub — intentionally typed as `any` so callers can use arbitrary table names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { from: (_: string) => makeStubBuilder({ data: [], error: null }) } as any;
  }

  try {
    const client = createClient<Database>(url, key, { auth: { persistSession: false } });
    return new Proxy(client, {
      get(target, prop) {
        const orig = (target as unknown as Record<string, unknown>)[String(prop)] as unknown;
        if (prop === "from" && typeof orig === "function") {
          return (table: string) => {
            try {
              const fn = orig as (...args: unknown[]) => unknown;
              const builder = fn.call(target, table);
              if (builder && typeof builder === "object") return builder;
              return makeStubBuilder();
            } catch (e: unknown) {
              return makeStubBuilder({ data: null, error: e });
            }
          };
        }
        return orig;
      },
    }) as any;
  } catch (e: unknown) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { from: (_: string) => makeStubBuilder({ data: [], error: null }) } as any;
    }
    throw e;
  }
}
