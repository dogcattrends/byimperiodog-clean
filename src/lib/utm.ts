export type PageType = "catalog" | "puppy" | "color" | "city" | "intent" | "blog";

export type LeadContext = {
  pageType: PageType;
  url: string;
  slug?: string;
  color?: string;
  city?: string;
  intent?: string;
};

export type CapturedUtm = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
};

export function captureUtmFromLocation(): CapturedUtm {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    gclid: params.get("gclid"),
    fbclid: params.get("fbclid"),
  };
}

export function withUTM(baseUrl: string, params: Record<string, string | undefined>) {
  const url = new URL(baseUrl, typeof window !== "undefined" ? window.location.origin : "https://byimperiodog.com.br");
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  return url.toString();
}

export function whatsappLeadUrl(phoneE164: string, context: LeadContext) {
  const base = `https://wa.me/${phoneE164}`;
  const text = `Olá! Tenho interesse em Spitz. Página: ${context.pageType}${context.slug ? `/${context.slug}` : ""}${context.color ? ` | cor: ${context.color}` : ""}${context.city ? ` | cidade: ${context.city}` : ""}${context.intent ? ` | intenção: ${context.intent}` : ""}`;
  return withUTM(base, {
    utm_source: "site",
    utm_medium: "whatsapp_button",
    utm_campaign: "lead_funnel",
    utm_content: context.pageType,
    text,
  });
}
