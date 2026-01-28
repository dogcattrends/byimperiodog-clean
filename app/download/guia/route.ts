import { NextResponse } from "next/server";

import {
 findLeadDownloadToken,
 getGuideStorageObjectPath,
 markLeadDownloadTokenUsed,
} from "@/lib/leadDownloadTokens";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

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

 const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
 const objectPath = getGuideStorageObjectPath(record.version);

 const sb = supabaseAdmin();
 try {
  const { data, error } = await sb.storage.from(bucket).download(objectPath);
  if (error || !data) {
   logger.warn("unable to download guide from storage", {
	bucket,
	objectPath,
	error: error ? String((error as unknown as { message?: string })?.message ?? error) : "missing-data",
   });
   return redirectToGuia("file");
  }

  const arrayBuffer = await data.arrayBuffer();
  const filename = record.version === "v2" ? "guia-v2.pdf" : "guia.pdf";

  return new NextResponse(Buffer.from(arrayBuffer), {
   headers: {
	"Content-Type": "application/pdf",
	"Content-Disposition": `attachment; filename="${filename}"`,
	"Cache-Control": "no-store, max-age=0",
   },
  });
 } catch (error) {
  logger.warn("guide download threw", { error: String(error), bucket, objectPath });
  return redirectToGuia("file");
 }
}
