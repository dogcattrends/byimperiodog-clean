import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { normalizeRole, serializeRoleCookie } from "@/lib/rbac";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseAnon } from "@/lib/supabaseAnon";

type AdminRoleRow = { role: string | null };

function isWhitelistedAdmin(email: string | null | undefined): boolean {
  const raw = (process.env.ADMIN_LOGIN_WHITELIST || "").trim();
  if (!raw) return false;
  const candidate = (email || "").trim().toLowerCase();
  if (!candidate) return false;
  const list = raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(candidate);
}

async function getAdminRoleViaRest(opts: {
  userId: string;
  accessToken: string;
}): Promise<{ row: AdminRoleRow | null; kind: "ok" | "denied" | "error" }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { row: null, kind: "error" };
  }

  const baseUrl = supabaseUrl.replace(/\/+$/, "");
  const url = new URL(`${baseUrl}/rest/v1/admin_users`);
  url.searchParams.set("select", "role");
  url.searchParams.set("user_id", `eq.${opts.userId}`);
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${opts.accessToken}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401 || res.status === 403) {
    return { row: null, kind: "denied" };
  }
  if (!res.ok) {
    return { row: null, kind: "error" };
  }

  const json = (await res.json().catch(() => null)) as unknown;
  const role = Array.isArray(json) && json.length > 0 && typeof (json[0] as any)?.role === "string" ? (json[0] as any).role : null;
  if (!role) {
    return { row: null, kind: "denied" };
  }
  return { row: { role }, kind: "ok" };
}

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Credenciais obrigatorias" }, { status: 400 });
  }

  // Login via Supabase Auth (email/senha)
  const anon = supabaseAnon();
  const { data: authData, error: authError } = await (anon.auth as any).signInWithPassword({
    email: email.trim(),
    password,
  });
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
  }

  // Emergência/dev: bypass total do controle de admin (somente quando habilitado explicitamente)
  if (process.env.NEXT_PUBLIC_ADMIN_OPEN === "1") {
    const res = NextResponse.json({ ok: true });

    const displayName =
      (authData.user.user_metadata?.name as string | undefined) ||
      (authData.user.user_metadata?.full_name as string | undefined) ||
      authData.user.email?.split("@")[0] ||
      "Admin";

    cookies().set("admin_auth", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookies().set("adm", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookies().set("admin_email", authData.user.email ?? email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookies().set("admin_name", displayName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookies().set("admin_user_id", authData.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    const accessToken = (authData as any)?.session?.access_token as string | undefined;
    const refreshToken = (authData as any)?.session?.refresh_token as string | undefined;
    if (accessToken) {
      cookies().set("admin_sb_at", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }
    if (refreshToken) {
      cookies().set("admin_sb_rt", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }
    const roleCookie = serializeRoleCookie(normalizeRole("owner"));
    cookies().set(roleCookie.name, roleCookie.value, roleCookie.options);
    return res;
  }

  // Fallback seguro (dev/operacional): allowlist por email via .env.local
  // Útil quando SUPABASE_SERVICE_ROLE_KEY não está configurada e o projeto remoto tem RLS restritiva.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && isWhitelistedAdmin(authData.user.email)) {
    const res = NextResponse.json({ ok: true });

    const displayName =
      (authData.user.user_metadata?.name as string | undefined) ||
      (authData.user.user_metadata?.full_name as string | undefined) ||
      authData.user.email?.split("@")[0] ||
      "Admin";

    cookies().set("admin_auth", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookies().set("adm", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookies().set("admin_email", authData.user.email ?? email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookies().set("admin_name", displayName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    cookies().set("admin_user_id", authData.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    const accessToken = (authData as any)?.session?.access_token as string | undefined;
    const refreshToken = (authData as any)?.session?.refresh_token as string | undefined;
    if (accessToken) {
      cookies().set("admin_sb_at", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }
    if (refreshToken) {
      cookies().set("admin_sb_rt", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }
    const roleCookie = serializeRoleCookie(normalizeRole("owner"));
    cookies().set(roleCookie.name, roleCookie.value, roleCookie.options);
    return res;
  }

  // Verifica se usuario esta na tabela admin_users
  // Preferencia: service role (server-side). Fallback: REST com access_token do usuario (RLS).
  let adminRow: AdminRoleRow | null = null;
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (hasServiceRole) {
    const { data, error } = await supabaseAdmin().from("admin_users").select("role").eq("user_id", authData.user.id).maybeSingle();
    if (error) {
      return NextResponse.json({ error: "Erro ao validar permissoes" }, { status: 500 });
    }
    adminRow = (data as any) ?? null;
  } else {
    const accessToken = (authData as any)?.session?.access_token as string | undefined;
    if (!accessToken) {
      return NextResponse.json({ error: "Erro ao validar permissoes" }, { status: 500 });
    }
    const restCheck = await getAdminRoleViaRest({ userId: authData.user.id, accessToken });
    if (restCheck.kind === "error") {
      return NextResponse.json({ error: "Erro ao validar permissoes" }, { status: 500 });
    }
    if (restCheck.kind === "denied") {
      return NextResponse.json(
        {
          error:
            "Acesso negado (sem permissão em admin_users). Configure RLS para permitir leitura do próprio registro ou defina SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 403 },
      );
    }
    adminRow = restCheck.row;
  }

  if (!adminRow) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  // Cookies de sessao admin
  const displayName =
    (authData.user.user_metadata?.name as string | undefined) ||
    (authData.user.user_metadata?.full_name as string | undefined) ||
    authData.user.email?.split("@")[0] ||
    "Admin";

  cookies().set("admin_auth", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().set("adm", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().set("admin_email", authData.user.email ?? email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().set("admin_name", displayName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookies().set("admin_user_id", authData.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  const accessToken = (authData as any)?.session?.access_token as string | undefined;
  const refreshToken = (authData as any)?.session?.refresh_token as string | undefined;
  if (accessToken) {
    cookies().set("admin_sb_at", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }
  if (refreshToken) {
    cookies().set("admin_sb_rt", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }
  const roleCookie = serializeRoleCookie(normalizeRole(adminRow.role));
  cookies().set(roleCookie.name, roleCookie.value, roleCookie.options);
  return res;
}
