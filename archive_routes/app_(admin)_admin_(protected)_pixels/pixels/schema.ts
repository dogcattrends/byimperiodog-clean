"use client";

import { z } from "zod";

// Util: normaliza undefined -> "" e aplica validacao condicional apenas se nao vazio
// Padroes de validacao por fornecedor:
// GTM: GTM-XXXX (alfa-num, 4-12)
// GA4: G-XXXXXXXX (alfa-num, 8-12)
// Meta Pixel: 8-20 digitos
// TikTok Pixel: alfanumerico 5-32
// Google Ads ID: AW-######## (8-12 digitos)
// Pinterest Tag: 5-25 digitos
// Hotjar ID: 5-10 digitos
// Clarity ID: 6-20 caracteres alfa-num + '_' '-'
// Meta Domain Verification: token 10-120 chars permitido (alfa-num =:_-)
function optionalPattern(
  pattern: RegExp,
  message: string,
  maxLen?: number
) {
  return z
    .union([z.string(), z.undefined()])
    .transform((val) => (val ?? "").trim())
    .refine((val) => (maxLen ? val.length <= maxLen : true), {
      message: maxLen ? `Use no maximo ${maxLen} caracteres.` : "",
    })
    .refine((val) => val === "" || pattern.test(val), {
      message,
    });
}

const gtmIdSchema = optionalPattern(/^(GTM-[A-Z0-9]{4,12})$/i, "Formato GTM invalido (ex: GTM-ABC1234).", 40);
const ga4IdSchema = optionalPattern(/^(G-[A-Z0-9]{8,12})$/i, "Formato GA4 invalido (ex: G-ABCDEF1234).", 40);
const metaPixelIdSchema = optionalPattern(/^\d{8,20}$/i, "Pixel Meta deve conter somente 8-20 digitos.");
const tiktokPixelIdSchema = optionalPattern(/^[A-Za-z0-9]{5,32}$/i, "Pixel TikTok deve ser alfanumerico (5-32).", 40);
const googleAdsIdSchema = optionalPattern(/^(AW-\d{8,12})$/i, "Google Ads ID invalido (ex: AW-123456789).", 40);
const pinterestIdSchema = optionalPattern(/^\d{5,25}$/i, "Pinterest Tag deve conter apenas digitos (5-25).");
const hotjarIdSchema = optionalPattern(/^\d{5,10}$/i, "Hotjar ID deve conter 5-10 digitos.");
const clarityIdSchema = optionalPattern(/^[A-Za-z0-9_-]{6,20}$/i, "Clarity ID invalido (6-20 chars).");
const labelSchema = optionalPattern(/^.{0,160}$/s, "Label excede limite.", 160);
const metaDomainVerificationSchema = optionalPattern(/^[A-Za-z0-9=:_-]{10,120}$/i, "Token de verificacao Meta invalido.");

export const environmentSchema = z.object({
  gtmId: gtmIdSchema,
  ga4Id: ga4IdSchema,
  metaPixelId: metaPixelIdSchema,
  tiktokPixelId: tiktokPixelIdSchema,
  googleAdsId: googleAdsIdSchema,
  googleAdsConversionLabel: labelSchema,
  pinterestId: pinterestIdSchema,
  hotjarId: hotjarIdSchema,
  clarityId: clarityIdSchema,
  metaDomainVerification: metaDomainVerificationSchema,
  analyticsConsent: z.boolean().default(false),
  marketingConsent: z.boolean().default(false),
}).refine((data) => data.analyticsConsent || data.marketingConsent, {
  message: "Marque pelo menos um tipo de consentimento.",
  path: ["analyticsConsent"],
});

export const pixelsFormSchema = z.object({
  production: environmentSchema,
  staging: environmentSchema,
});

export type PixelsFormValues = z.infer<typeof pixelsFormSchema>;
