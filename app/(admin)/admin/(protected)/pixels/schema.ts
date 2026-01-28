import { z } from 'zod';

// Helper to coerce undefined/null to empty string and then validate
const emptyToString = () => z.preprocess((v) => (v == null ? '' : String(v)), z.string()).default('');

export const environmentSchema = z
 .object({
 gtmId: emptyToString(),
 ga4Id: emptyToString(),
 metaPixelId: emptyToString(),
 tiktokPixelId: emptyToString(),
 googleAdsId: emptyToString(),
 googleAdsConversionLabel: emptyToString(),
 pinterestId: emptyToString(),
 hotjarId: emptyToString(),
 clarityId: emptyToString(),
 metaDomainVerification: emptyToString(),
 analyticsConsent: z.boolean().default(true),
 marketingConsent: z.boolean().default(false),
 })
 .superRefine((obj, ctx) => {
 // Patterns: allow empty string (meaning not set) or strict formats
 const patterns: Array<[string, RegExp]> = [
 ['gtmId', /^$|^GTM-[A-Z0-9-]{4,}$/i],
 ['ga4Id', /^$|^G-[A-Z0-9]{8,15}$/i],
 ['metaPixelId', /^$|^[0-9]{6,20}$/],
 ['tiktokPixelId', /^$|^[A-Za-z0-9]{4,}$/],
 ['googleAdsId', /^$|^AW-[0-9]{6,}$/],
 ['pinterestId', /^$|^[0-9]{5,16}$/],
 ['hotjarId', /^$|^[0-9]{5,10}$/],
 ['clarityId', /^$|^[A-Za-z0-9]{6,}$/],
 ['metaDomainVerification', /^$|^[A-Za-z0-9_-]{8,}$/],
 ];

 for (const [key, re] of patterns) {
 const val = (obj as Record<string, unknown>)[key];
 if (typeof val === "string" && !re.test(val)) {
 ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${key} is invalid`, path: [key] });
 }
 }

 // Aggregate consent rule: at least one of analytics or marketing must be true
 if (!obj.analyticsConsent && !obj.marketingConsent) {
 ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one consent must be selected', path: ['analyticsConsent'] });
 }
 });

export type EnvironmentSchema = z.infer<typeof environmentSchema>;
