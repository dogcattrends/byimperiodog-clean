"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminLayout } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/adminAuth";
import {
  PixelEnvironmentConfig,
  sanitizePixelId,
  upsertPixelsSettings,
} from "@/lib/pixels";

const idPattern = /^[A-Za-z0-9._:-]*$/;

const idSchema = z
  .string()
  .trim()
  .max(80, "Use no máximo 80 caracteres.")
  .regex(idPattern, "Use apenas letras, números, '.', '_', '-' ou ':'.")
  .optional()
  .transform((value) => value ?? "");

const labelSchema = z
  .string()
  .trim()
  .max(160, "Use no máximo 160 caracteres.")
  .optional()
  .transform((value) => value ?? "");

const environmentSchema = z.object({
  gtmId: idSchema,
  ga4Id: idSchema,
  metaPixelId: idSchema,
  tiktokPixelId: idSchema,
  googleAdsId: idSchema,
  googleAdsConversionLabel: labelSchema,
  pinterestId: idSchema,
  hotjarId: idSchema,
  clarityId: idSchema,
  metaDomainVerification: labelSchema,
  analyticsConsent: z.boolean(),
  marketingConsent: z.boolean(),
});

export const pixelsFormSchema = z.object({
  production: environmentSchema,
  staging: environmentSchema,
});

export type PixelsFormValues = z.infer<typeof pixelsFormSchema>;

function toEnvironmentConfig(input: z.infer<typeof environmentSchema>): PixelEnvironmentConfig {
  const normalize = (value: string) => {
    const id = sanitizePixelId(value);
    return id;
  };

  return {
    gtmId: normalize(input.gtmId),
    ga4Id: normalize(input.ga4Id),
    metaPixelId: normalize(input.metaPixelId),
    tiktokPixelId: normalize(input.tiktokPixelId),
    googleAdsId: normalize(input.googleAdsId),
    googleAdsConversionLabel: input.googleAdsConversionLabel?.trim()
      ? input.googleAdsConversionLabel.trim()
      : null,
    pinterestId: normalize(input.pinterestId),
    hotjarId: normalize(input.hotjarId),
    clarityId: normalize(input.clarityId),
    metaDomainVerification: input.metaDomainVerification?.trim()
      ? input.metaDomainVerification.trim()
      : null,
    analyticsConsent: input.analyticsConsent,
    marketingConsent: input.marketingConsent,
  };
}

export async function savePixelsSettings(payload: unknown) {
  requireAdminLayout();

  const parsed = pixelsFormSchema.parse(payload);

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
