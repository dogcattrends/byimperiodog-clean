import type { NextRequest } from "next/server";

import { hasServiceRoleKey, supabaseAdmin } from "./supabaseAdmin";
import { createSupabaseUserClient } from "./supabaseClient";

export type AdminDbMode = "service" | "user" | "missing_token";

export function supabaseAdminOrUser(req: NextRequest): {
  mode: AdminDbMode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any | null;
} {
  if (hasServiceRoleKey()) {
    return { mode: "service", client: supabaseAdmin() };
  }

  const token = req.cookies.get("admin_sb_at")?.value;
  if (!token) {
    return { mode: "missing_token", client: null };
  }

  return { mode: "user", client: createSupabaseUserClient(token) };
}
