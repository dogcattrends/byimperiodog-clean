import { NextResponse } from "next/server";

import {
  findLeadDownloadToken,
  getGuideDownloadUrl,
  markLeadDownloadTokenUsed,
} from "@/lib/leadDownloadTokens";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("download:guia");

const redirectToGuia = (reason?: string) => {
  const query = reason ? `?token_error=${reason}` : "";
  return NextResponse.redirect(`/guia${query}`);
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    logger.warn("missing download token");
    return redirectToGuia("missing");
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const record = await findLeadDownloadToken(token);
  if (!record) {
    logger.warn("download token not found", { token });
    return redirectToGuia("invalid");
  }

  if (record.expires_at) {
    const expires = new Date(record.expires_at);
    if (Number.isFinite(expires.getTime()) && expires < new Date()) {
      logger.warn("download token expired", { token });
      return redirectToGuia("expired");
    }
  }

  await markLeadDownloadTokenUsed(record.id, { ipAddress: ip, userAgent });

  try {
    await supabaseAdmin()
      .from("analytics_events")
      .insert({
        name: "pdf_downloaded",
        path: "/download/guia",
        meta: { leadId: record.lead_id, token: record.token, version: record.version },
      });
  } catch (error) {
    logger.warn("failed to log download event", { error: String(error) });
  }

  const downloadUrl = getGuideDownloadUrl(record.version);
  return NextResponse.redirect(downloadUrl);
}
