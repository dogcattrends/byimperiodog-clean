import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { respondWithError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:tracking:select");

function getAuthenticatedUserId(req: NextRequest): string | null {
  const adminAuth = req.cookies.get("admin_auth")?.value;
  if (!adminAuth) return null;
  const envUserId = (process.env.ADMIN_USER_ID || process.env.DEFAULT_ADMIN_USER_ID || "").trim();
  return envUserId || "admin";
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { provider, resourceId } = await req.json();
    if (!provider || !resourceId) {
      return NextResponse.json({ error: "provider e resourceId são obrigatórios" }, { status: 400 });
    }

    const supa = supabaseAdmin();
    // Upsert em tracking_settings
    const patch: Record<string, string> = {};
    switch (provider) {
      case "facebook":
        patch["facebook_pixel_id"] = resourceId;
        break;
      case "google_analytics":
        patch["ga_measurement_id"] = resourceId;
        break;
      case "google_tag_manager":
        patch["gtm_container_id"] = resourceId;
        break;
      case "tiktok":
        patch["tiktok_pixel_id"] = resourceId;
        break;
      default:
        return NextResponse.json({ error: "Provider not supported" }, { status: 404 });
    }

    const { data, error } = await supa
      .from("tracking_settings")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
      .select("facebook_pixel_id,ga_measurement_id,gtm_container_id,tiktok_pixel_id")
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logger.error("Falha ao selecionar tracking", { error: String(error) });
    return respondWithError(error);
  }
}
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { listResourcesByProvider } from "@/lib/tracking/resources";
import { ProviderKey } from "@/lib/tracking/providers/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  provider: ProviderKey;
  resourceId: string;
};

const FIELD_MAP: Record<ProviderKey, { idField: string; flagField: string }> = {
  facebook: { idField: "facebook_pixel_id", flagField: "is_facebook_pixel_enabled" },
  google_analytics: { idField: "ga_measurement_id", flagField: "is_ga_enabled" },
  google_tag_manager: { idField: "gtm_container_id", flagField: "is_gtm_enabled" },
  tiktok: { idField: "tiktok_pixel_id", flagField: "is_tiktok_enabled" },
};

const DEFAULT_USER_ID = process.env.INTEGRATIONS_DEFAULT_USER_ID;

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const body = (await req.json()) as Body;
  const map = FIELD_MAP[body.provider];
  if (!map) {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }
  const userId = DEFAULT_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "missing_user" }, { status: 400 });
  }

  try {
    const resources = await listResourcesByProvider(body.provider, userId);
    const exists = resources.some((r) => r.id === body.resourceId);
    if (!exists) {
      return NextResponse.json({ error: "resource_not_found" }, { status: 400 });
    }

    const payload: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    payload[map.idField] = body.resourceId;
    payload[map.flagField] = true;

    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("tracking_settings")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ settings: data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "save_failed" }, { status: 500 });
  }
}
