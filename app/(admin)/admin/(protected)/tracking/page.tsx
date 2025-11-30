import { getPixelsSettings } from "@/lib/pixels";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { TrackingHubClient } from "./TrackingHubClient";

function toFormValues(settings: Awaited<ReturnType<typeof getPixelsSettings>>) {
  const envToForm = (env: any) => ({
    gtmId: env.gtmId || "",
    ga4Id: env.ga4Id || "",
    metaPixelId: env.metaPixelId || "",
    tiktokPixelId: env.tiktokPixelId || "",
    googleAdsId: env.googleAdsId || "",
    googleAdsConversionLabel: env.googleAdsConversionLabel || "",
    pinterestId: env.pinterestId || "",
    hotjarId: env.hotjarId || "",
    clarityId: env.clarityId || "",
    metaDomainVerification: env.metaDomainVerification || "",
    analyticsConsent: !!env.analyticsConsent,
    marketingConsent: !!env.marketingConsent,
  });
  return {
    production: envToForm(settings.production),
    staging: envToForm(settings.staging),
  };
}

async function getInitialTrackingSettings(userId: string) {
  try {
    const supa = supabaseAdmin();
    const { data } = await supa
      .from("tracking_settings")
      .select("facebook_pixel_id,ga_measurement_id,gtm_container_id,tiktok_pixel_id")
      .eq("user_id", userId)
      .maybeSingle();
    return data || {};
  } catch {
    return {};
  }
}

async function getIntegrationsStatus(userId: string) {
  try {
    const supa = supabaseAdmin();
    const { data } = await supa
      .from("integrations")
      .select("provider,access_token")
      .eq("user_id", userId);
    const status: Record<"facebook"|"google_analytics"|"google_tag_manager"|"tiktok", boolean> = {
      facebook: false,
      google_analytics: false,
      google_tag_manager: false,
      tiktok: false,
    };
    (data || []).forEach((row: any) => {
      const p = row.provider as keyof typeof status;
      if (p in status) status[p] = !!row.access_token;
    });
    return status;
  } catch {
    return { facebook: false, google_analytics: false, google_tag_manager: false, tiktok: false };
  }
}

function resolveUserId() {
  const envUser = (process.env.ADMIN_USER_ID || process.env.DEFAULT_ADMIN_USER_ID || "").trim();
  return envUser || "admin";
}

export default async function Page() {
  const userId = resolveUserId();
  const pixelsSettings = await getPixelsSettings();
  const formValues = toFormValues(pixelsSettings);
  const trackingSettings = await getInitialTrackingSettings(userId);
  const integrationsStatus = await getIntegrationsStatus(userId);

  return (
    <div className="space-y-10 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Tracking & Pixels Hub</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-2xl">
          Central unificada para configurar IDs de pixels, consentimento e integracoes OAuth para provedores de rastreamento. Use a secao de integracoes para conectar contas e auto-configurar identificadores quando possivel.
        </p>
      </header>
      <TrackingHubClient
        initialPixels={formValues}
        pixelsUpdatedAt={pixelsSettings.updated_at}
        initialTrackingSettings={trackingSettings as any}
        initialIntegrations={integrationsStatus}
      />
    </div>
  );
}
