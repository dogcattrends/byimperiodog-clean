import { createLogger } from "./logger";
import { supabaseAdmin } from "./supabaseAdmin";

const logger = createLogger("lead-download-token");

function buildSupabasePublicObjectUrl(objectPath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = objectPath.replace(/^\//, "");
  return `${normalizedBase}/storage/v1/object/public/${bucket}/${normalizedPath}`;
}

const GUIDE_VERSION_PATHS: Record<string, string> = {
  v1:
    process.env.GUIDE_FILE_V1_PATH ||
    buildSupabasePublicObjectUrl("guides/guia.pdf") ||
    "/guia.pdf",
  v2:
    process.env.GUIDE_FILE_V2_PATH ||
    buildSupabasePublicObjectUrl("guides/guia-v2.pdf") ||
    "/guia-v2.pdf",
};

const CURRENT_VERSION = process.env.GUIDE_CURRENT_VERSION || "v1";
const DEFAULT_VERSION = GUIDE_VERSION_PATHS[CURRENT_VERSION] ? CURRENT_VERSION : "v1";
const DEFAULT_TTL_HOURS = Number(process.env.GUIDE_TOKEN_TTL_HOURS || "24");

export type GuideDownloadTokenRow = Record<string, unknown>;

function resolveVersion(proposed?: string) {
  if (proposed && GUIDE_VERSION_PATHS[proposed]) return proposed;
  if (GUIDE_VERSION_PATHS[DEFAULT_VERSION]) return DEFAULT_VERSION;
  return "v1";
}

export function getGuideVersionPath(version?: string) {
  const key = resolveVersion(version);
  return GUIDE_VERSION_PATHS[key] ?? GUIDE_VERSION_PATHS.v1;
}

export function getGuideDownloadUrl(version?: string) {
  const path = getGuideVersionPath(version);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    return new URL(path, base).toString();
  } catch {
    return `${base}${path}`;
  }
}

export async function createLeadDownloadToken(
  leadId: string | number,
  options?: {
    version?: string;
    ttlHours?: number;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) {
  const supabase = supabaseAdmin();
  const token = crypto.randomUUID().replaceAll("-", "");
  const version = resolveVersion(options?.version ?? CURRENT_VERSION);
  const ttl = options?.ttlHours ?? DEFAULT_TTL_HOURS;
  const expiresAt = new Date(Date.now() + ttl * 3600_000).toISOString();
  try {
    const { data, error } = await supabase
      .from("lead_download_tokens")
      .insert({
        lead_id: String(leadId),
        token,
        version,
        expires_at: expiresAt,
        ip_address: options?.ipAddress ?? null,
        user_agent: options?.userAgent ?? null,
      })
      .select("token,version,expires_at")
      .maybeSingle();
    if (error) {
      logger.warn("unable to create download token", { error: error.message });
      return null;
    }
    if (!data) return { token, expiresAt, version };
    return {
      token: data.token ?? token,
      expiresAt: data.expires_at ?? expiresAt,
      version: data.version ?? version,
    };
  } catch (error) {
    logger.warn("create token threw", { error: String(error) });
    return null;
  }
}

export async function findLeadDownloadToken(token: string) {
  if (!token) return null;
  const supabase = supabaseAdmin();
  try {
    const { data, error } = await supabase
      .from("lead_download_tokens")
      .select("*")
      .eq("token", token)
      .limit(1)
      .maybeSingle();
    if (error) {
      logger.warn("unable to lookup download token", { error: error.message });
      return null;
    }
    return data;
  } catch (error) {
    logger.warn("lookup token threw", { error: String(error) });
    return null;
  }
}

export async function markLeadDownloadTokenUsed(
  tokenId: string,
  metadata?: { userAgent?: string | null; ipAddress?: string | null },
) {
  if (!tokenId) return false;
  const supabase = supabaseAdmin();
  try {
    const { error } = await supabase
      .from("lead_download_tokens")
      .update({
        used_at: new Date().toISOString(),
        ip_address: metadata?.ipAddress ?? null,
        user_agent: metadata?.userAgent ?? null,
      })
      .eq("id", tokenId);
    if (error) {
      logger.warn("unable to mark token used", { error: error.message });
      return false;
    }
    return true;
  } catch (error) {
    logger.warn("mark token used threw", { error: String(error) });
    return false;
  }
}
