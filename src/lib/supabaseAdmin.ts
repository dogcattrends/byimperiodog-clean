/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
import { createSupabaseAdminClient } from "./supabaseClient";

export function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAdmin() {
  return createSupabaseAdminClient();
}
