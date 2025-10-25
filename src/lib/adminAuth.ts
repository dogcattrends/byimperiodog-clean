import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_ROLE,
  getRoleFromCookies,
  getRoleFromHeaders,
  hasPermission,
  type AdminPermission,
  type AdminRole,
} from "@/lib/rbac";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createLogger } from "@/lib/logger";

type LayoutGuardOptions = {
  permission?: AdminPermission;
};

type ApiGuardOptions = {
  permission?: AdminPermission;
};

function isAuthenticatedCookie(store = cookies()) {
  const adm = store.get("adm")?.value;
  const legacy = store.get("admin_auth")?.value;
  return adm === "true" || adm === "1" || legacy === "1";
}

function resolveRoleFromRequest(req: Request | NextRequest): AdminRole {
  if (req instanceof NextRequest) {
    return getRoleFromCookies(req.cookies);
  }
  return getRoleFromHeaders(req.headers);
}

export function requireAdminLayout(options: LayoutGuardOptions = {}) {
  const store = cookies();
  if (!isAuthenticatedCookie(store)) redirect("/admin/login");

  const role = getRoleFromCookies(store);
  if (options.permission && !hasPermission(role, options.permission)) {
    redirect("/admin?permission=denied");
  }
}

export function redirectIfAuthed() {
  if (isAuthenticatedCookie()) redirect("/admin/dashboard");
}

export function requireAdminApi(req: Request | NextRequest, options: ApiGuardOptions = {}) {
  const expected = process.env.NEXT_PUBLIC_ADMIN_PASS || process.env.ADMIN_PASS;
  if (!expected) {
    if (options.permission) {
      const role = resolveRoleFromRequest(req);
      if (!hasPermission(role, options.permission)) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }
    return null;
  }

  try {
    const nreq = req as NextRequest;
    const cookieAuth =
      (nreq.cookies?.get?.("admin_auth")?.value) === "1" ||
      (nreq.cookies?.get?.("adm")?.value) === "true";
    if (cookieAuth) {
      if (options.permission) {
        const role = resolveRoleFromRequest(req);
        if (!hasPermission(role, options.permission)) {
          return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
        }
      }
      return null;
    }
  } catch {
    // ignore cookie access failures on generic Request
  }

  const pass = req.headers.get("x-admin-pass");
  if (pass === expected) {
    if (options.permission) {
      const role = resolveRoleFromRequest(req);
      if (!hasPermission(role, options.permission)) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }
    return null;
  }

  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export function requireAdmin(req: Request | NextRequest, options: ApiGuardOptions = {}) {
  return requireAdminApi(req, options);
}

export async function logAdminAction(params: {
  route: string;
  method: string;
  action?: string;
  payload?: unknown;
  actor?: string;
  ip?: string;
}) {
  try {
    const sb = supabaseAdmin();
    await sb.from("admin_actions").insert([
      {
        route: params.route,
        method: params.method,
        action: params.action ?? null,
        payload: params.payload ?? null,
        actor: params.actor ?? null,
        ip: params.ip ?? null,
      },
    ]);
  } catch (error) {
    createLogger("admin:actions").warn("Falha ao registrar acao administrativa", {
      route: params.route,
      method: params.method,
      error: String(error),
    });
  }
}

export function resolveAdminContext(req: Request | NextRequest) {
  const role = resolveRoleFromRequest(req) ?? DEFAULT_ROLE;
  return { role };
}
