import { BarChart3, Webhook, FlaskConical } from "lucide-react";
import Link from "next/link";

import { getPixelsSettings, type PixelEnvironmentConfig } from "@/lib/pixels";

import { PixelsForm } from "./PixelsForm";

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

const ADVANCED_FEATURES = [
  {
    title: "Analytics Dashboard",
    description: "Visualize métricas e conversões em tempo real",
    href: "/admin/analytics",
    icon: BarChart3,
    color: "bg-blue-100 text-blue-800",
  },
  {
    title: "Webhooks",
    description: "Notificações automáticas de conversões e eventos",
    href: "/admin/webhooks",
    icon: Webhook,
    color: "bg-green-100 text-green-800",
  },
  {
    title: "A/B Testing",
    description: "Teste diferentes configurações de pixels",
    href: "/admin/pixel-experiments",
    icon: FlaskConical,
    color: "bg-purple-100 text-purple-800",
  },
];

export default async function PixelsPage() {
  const settings = await getPixelsSettings();

  const initialValues = {
    production: configToForm(settings.production),
    staging: configToForm(settings.staging),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-emerald-50 to-blue-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">
          Funcionalidades Avançadas
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ADVANCED_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-white p-4 transition hover:shadow-md"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text)] group-hover:text-[var(--accent)]">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {feature.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <PixelsForm initialValues={initialValues} updatedAt={settings.updated_at} />
    </div>
  );
}
