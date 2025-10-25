import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { respondWithError } from "@/lib/errors";
import { rateLimit } from "@/lib/limiter";
import { createLogger } from "@/lib/logger";
import { normalizeRole, serializeRoleCookie } from "@/lib/rbac";

const logger = createLogger("api:admin:login");

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  try {
    await rateLimit(req, { identifier: "admin-login", limit: 6, windowMs: 60_000 });

    const { password } = await req.json().catch(() => ({}));
    if (password && process.env.ADMIN_PASS && safeEqual(password, process.env.ADMIN_PASS)) {
      const res = NextResponse.json({ ok: true });
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      };
      res.cookies.set("admin_auth", "1", cookieOptions);
      res.cookies.set("adm", "true", cookieOptions);

      const role = normalizeRole(process.env.ADMIN_DEFAULT_ROLE);
      const serializedRole = serializeRoleCookie(role);
      res.cookies.set(serializedRole.name, serializedRole.value, serializedRole.options);

      return res;
    }

    return NextResponse.json({ ok: false, error: "Senha invalida" }, { status: 401 });
  } catch (error) {
    logger.warn("Falha ao autenticar admin", { error: String(error) });
    return respondWithError(error);
  }
}
