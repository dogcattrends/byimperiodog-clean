import { createClient } from "@supabase/supabase-js";

import type { Database } from "../types/supabase";

type StubBuilder = {
  then?: (onFulfilled?: (val: unknown) => unknown, onRejected?: (err: unknown) => unknown) => Promise<unknown>;
  catch?: (onRejected?: (err: unknown) => unknown) => Promise<unknown>;
  finally?: (cb?: () => void) => Promise<unknown>;
  [key: string]: unknown;
};

const CHAINABLE_METHODS = [
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

export function makeStubBuilder(result: unknown = { data: null, error: null }): StubBuilder {
  const base = CHAINABLE_METHODS.reduce((acc, method) => Object.assign(acc, { [method]: () => acc }), {} as Record<string, unknown>);

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

type ClientFactoryOptions = {
  url?: string;
  key?: string;
  label?: string;
  warnOnceEnvFlag?: string;
};

function shouldWarn(label?: string) {
  return label === "supabaseAdmin";
}

function logMissing(label?: string) {
  if (!label || !shouldWarn(label)) return;
  const flag = "__SUPABASE_MISSING_LOGGED";
  if (process.env[flag]) return;
  // eslint-disable-next-line no-console
  console.warn(
    `[${label}] Credenciais Supabase ausentes; retornando stub. Configure NEXT_PUBLIC_SUPABASE_URL e a chave apropriada para habilitar funcionalidades.`
  );
  process.env[flag] = "1";
}

function makeMissingCredsError(label?: string) {
  const base = label ? `[${label}]` : "[supabase]";
  const hint = label === "supabaseAdmin" ? "Defina SUPABASE_SERVICE_ROLE_KEY (server-only)." : "Verifique as variáveis NEXT_PUBLIC_SUPABASE_URL/KEY.";
  return new Error(`supabase_offline_stub: ${base} credenciais ausentes. ${hint}`);
}

export function createSupabaseClient({ url, key, label }: ClientFactoryOptions) {
  if (!url || !key) {
    logMissing(label);
    if (shouldWarn(label)) {
      const error = makeMissingCredsError(label);
      const storageBucketStub = {
        upload: async () => ({ data: null as unknown, error }),
        remove: async () => ({ data: null as unknown, error }),
        createSignedUrl: async () => ({ data: null as unknown, error }),
        getPublicUrl: () => ({ data: { publicUrl: "" } as unknown }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {
        from: () => makeStubBuilder({ data: null, error }),
        storage: {
          from: () => storageBucketStub,
          getBucket: async () => ({ data: null as unknown, error }),
          createBucket: async () => ({ data: null as unknown, error }),
        },
      } as any;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { from: () => makeStubBuilder() } as any;
  }

  try {
    const client = createClient<Database>(url, key, { auth: { persistSession: false } });
    return new Proxy(client, {
      get(target, prop) {
        const orig = (target as unknown as Record<string, unknown>)[String(prop)];
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
    }) as ReturnType<typeof createClient<Database>>;
  } catch (e: unknown) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { from: () => makeStubBuilder({ data: null, error: e }) } as any;
    }
    throw e;
  }
}

export function createSupabaseAdminClient() {
  return createSupabaseClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    label: "supabaseAdmin",
  });
}

export function createSupabaseAnonClient() {
  return createSupabaseClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    label: "supabaseAnon",
  });
}

export function createSupabasePublicClient() {
  return createSupabaseClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    label: "supabasePublic",
  });
}

export function createSupabaseUserClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const label = "supabaseUser";
  if (!url || !anonKey || !accessToken) {
    const error = new Error(
      `supabase_offline_stub: [${label}] credenciais ausentes. Verifique NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY e o cookie de sessao.`,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { from: () => makeStubBuilder({ data: null, error }) } as any;
  }

  const client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  return new Proxy(client, {
    get(target, prop) {
      const orig = (target as unknown as Record<string, unknown>)[String(prop)];
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
  }) as ReturnType<typeof createClient<Database>>;
}
