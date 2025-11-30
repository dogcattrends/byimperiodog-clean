import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { respondWithError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { listFacebookPixels, listGAProperties, listGTMContainers, listTikTokPixels } from "@/lib/tracking/listResources";

const logger = createLogger("api:integrations:resources");

function getAuthenticatedUserId(req: NextRequest): string | null {
  // Padrão de autenticação do projeto: cookie "admin_auth" indica sessão admin válida.
  // Não há usuário específico persistido no cookie; usamos fallback de ambiente.
  const adminAuth = req.cookies.get("admin_auth")?.value;
  if (!adminAuth) return null;
  const envUserId = (process.env.ADMIN_USER_ID || process.env.DEFAULT_ADMIN_USER_ID || "").trim();
  return envUserId || "admin"; // fallback leve; ajuste conforme sua implementação de auth
}

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const provider = String(params?.provider || "").trim();
    if (!provider) {
      return NextResponse.json({ error: "Provider not specified" }, { status: 400 });
    }

    let data: Array<{ id: string; name: string; extra?: Record<string, any> }> = [];

    switch (provider) {
      case "facebook":
        data = await listFacebookPixels(userId);
        break;
      case "google_analytics":
        data = await listGAProperties(userId);
        break;
      case "google_tag_manager":
        data = await listGTMContainers(userId);
        break;
      case "tiktok":
        data = await listTikTokPixels(userId);
        break;
      default:
        return NextResponse.json({ error: "Provider not supported" }, { status: 404 });
    }

    if (!data || data.length === 0) {
      // Sem integrações ou sem recursos
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logger.error("Falha ao listar recursos do provedor", { error: String(error) });
    // Se o erro vier do Supabase sem integração encontrada, retorne 404
    // Caso contrário, 500
    return respondWithError(error);
  }
}
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { listResourcesByProvider } from "@/lib/tracking/resources";
import { ProviderKey } from "@/lib/tracking/providers/types";

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const provider = params.provider as ProviderKey;

  try {
    const resources = await listResourcesByProvider(provider);
    return NextResponse.json({ resources });
  } catch (error: any) {
    const message = error?.message || "failed_to_list_resources";
    const status = message === "integration_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
