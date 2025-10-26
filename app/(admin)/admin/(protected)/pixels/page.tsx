import { PixelsForm } from "./PixelsForm";
import { getPixelsSettings, type PixelEnvironmentConfig } from "@/lib/pixels";

function configToForm(config: PixelEnvironmentConfig) {
  return {
    gtmId: config.gtmId ?? "",
    ga4Id: config.ga4Id ?? "",
    metaPixelId: config.metaPixelId ?? "",
    tiktokPixelId: config.tiktokPixelId ?? "",
    googleAdsId: config.googleAdsId ?? "",
    googleAdsConversionLabel: config.googleAdsConversionLabel ?? "",
    pinterestId: config.pinterestId ?? "",
    hotjarId: config.hotjarId ?? "",
    clarityId: config.clarityId ?? "",
    metaDomainVerification: config.metaDomainVerification ?? "",
    analyticsConsent: config.analyticsConsent,
    marketingConsent: config.marketingConsent,
  };
}

export default async function PixelsPage() {
  const settings = await getPixelsSettings();

  const initialValues = {
    production: configToForm(settings.production),
    staging: configToForm(settings.staging),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <PixelsForm initialValues={initialValues} updatedAt={settings.updated_at} />
    </div>
  );
}
