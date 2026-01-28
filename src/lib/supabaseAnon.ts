import { createSupabaseAnonClient } from "./supabaseClient";

let client: ReturnType<typeof createSupabaseAnonClient> | null = null;

export function supabaseAnon() {
 if (client) return client;
 client = createSupabaseAnonClient();
 return client;
}
