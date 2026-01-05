import { createClient } from '@supabase/supabase-js';

import type { Database } from '../types/supabase';

type StubBuilder = {
  then?: (onFulfilled?: (val: unknown) => unknown, onRejected?: (err: unknown) => unknown) => Promise<unknown>;
  catch?: (onRejected?: (err: unknown) => unknown) => Promise<unknown>;
  finally?: (cb?: () => void) => Promise<unknown>;
  [key: string]: unknown;
};

function makeStubBuilder(result: unknown = { data: null, error: null }): StubBuilder {
  const methods = [
    'select', 'maybeSingle', 'single', 'eq', 'in', 'order', 'limit',
    'insert', 'update', 'delete', 'rpc', 'ilike', 'like', 'neq', 'upsert'
  ];

  const base = methods.reduce(
    (acc, m) =>
      Object.assign(acc, {
        [m]: (..._args: unknown[]) => {
          void _args;
          return acc;
        },
      }),
    {} as Record<string, unknown>
  );

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

let client: ReturnType<typeof createClient<Database>> | null = null;
export function supabaseAnon(){
  if(client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  /* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
  if(!url || !key){
    // fallback stub — allow arbitrary table names during local/test envs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { from: (_: string) => makeStubBuilder({ data: [], error: null }) } as any;
  }

  try{
    client = createClient<Database>(url, key, { auth: { persistSession:false } });
    return client;
  }catch(e){
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { from: (_: string) => makeStubBuilder({ data: [], error: null }) } as any;
  }
}
