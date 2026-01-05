/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/supabase";

// Generic chainable stub builder that preserves chaining and
// resolves to a safe { data, error } object at the end of the chain.
type StubBuilder = {
  then?: (onFulfilled?: (val: unknown) => unknown, onRejected?: (err: unknown) => unknown) => Promise<unknown>;
  catch?: (onRejected?: (err: unknown) => unknown) => Promise<unknown>;
  finally?: (cb?: () => void) => Promise<unknown>;
  [key: string]: unknown;
};

// Generic chainable stub builder that preserves chaining and
// resolves to a safe { data, error } object at the end of the chain.
function makeStubBuilder(result: unknown = { data: null, error: null }): StubBuilder {
  const methods = [
    'select',
    'maybeSingle',
    'single',
    'eq',
    'in',
    'order',
    'limit',
    'insert',
    'update',
    'delete',
    'rpc',
    'ilike',
    'like',
    'neq',
    'upsert',
  ];

  const base = methods.reduce((acc, m) => Object.assign(acc, { [m]: (..._args: unknown[]) => acc }), {} as Record<string, unknown>);

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

export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Always return a chainable stub builder when envs are missing.
    // Fallback typed as `any` so callers can use arbitrary table names.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      from: (_: string) => makeStubBuilder(),
    } as any;
  }

  try {
    const client = createClient<Database>(url, anon, { auth: { persistSession: false } });
    return new Proxy(client, {
      get(target, prop) {
        const orig = (target as any)[prop];
        if (prop === 'from' && typeof orig === 'function') {
          return (table: string) => {
            try {
              const builder = orig.call(target, table);
              if (builder && typeof builder === 'object') return builder;
              return makeStubBuilder();
            } catch (e: any) {
              return makeStubBuilder({ data: null, error: e });
            }
          };
        }
        return orig;
      },
    }) as any;
  } catch (e: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      from: (_: string) => makeStubBuilder({ data: null, error: e }),
    } as any;
  }
}
