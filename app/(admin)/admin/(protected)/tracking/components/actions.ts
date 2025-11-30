"use server";

import { revalidatePath } from "next/cache";

import { requireAdminLayout, logAdminAction } from "@/lib/adminAuth";
import { PixelEnvironmentConfig, sanitizePixelId, upsertPixelsSettings } from "@/lib/pixels";

import { pixelsFormSchema } from "./schema";

export async function savePixelsSettings(payload: unknown) {
  requireAdminLayout();

  const parsed = pixelsFormSchema.parse(payload);

  const toEnvironmentConfig = (input: {
    gtmId: string;
    ga4Id: string;
    metaPixelId: string;
    tiktokPixelId: string;
    googleAdsId: string;
    googleAdsConversionLabel: string;
    pinterestId: string;
    hotjarId: string;
    clarityId: string;
    metaDomainVerification: string;
    analyticsConsent: boolean;
    marketingConsent: boolean;
  }): PixelEnvironmentConfig => ({
    gtmId: sanitizePixelId(input.gtmId),
    ga4Id: sanitizePixelId(input.ga4Id),
    metaPixelId: sanitizePixelId(input.metaPixelId),
    tiktokPixelId: sanitizePixelId(input.tiktokPixelId),
    googleAdsId: sanitizePixelId(input.googleAdsId),
    googleAdsConversionLabel: input.googleAdsConversionLabel.trim()
      ? input.googleAdsConversionLabel.trim()
      : null,
    pinterestId: sanitizePixelId(input.pinterestId),
    hotjarId: sanitizePixelId(input.hotjarId),
    clarityId: sanitizePixelId(input.clarityId),
    metaDomainVerification: input.metaDomainVerification.trim()
      ? input.metaDomainVerification.trim()
      : null,
    analyticsConsent: input.analyticsConsent,
    marketingConsent: input.marketingConsent,
  });

  const production = toEnvironmentConfig(parsed.production);
  const staging = toEnvironmentConfig(parsed.staging);

  await upsertPixelsSettings({ production, staging });

  await logAdminAction({
    route: "/admin/pixels",
    method: "POST",
    action: "pixels_settings_updated",
    payload: {
      production,
      staging,
    },
  });

  revalidatePath("/admin/pixels");
  revalidatePath("/");

  return { ok: true };
}
