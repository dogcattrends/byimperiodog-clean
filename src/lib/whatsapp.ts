/**
 * Helpers centralizados para gerar links e mensagens de WhatsApp.
 * Mantem compatibilidade com chamadas existentes que passam apenas a mensagem.
 */

export const WHATSAPP_NUMBER = "5511968633239";

export const WHATSAPP_LINK =
  process.env.NEXT_PUBLIC_WA_LINK || `https://wa.me/${WHATSAPP_NUMBER}`;

export type WhatsAppSource =
  | "footer"
  | "navbar"
  | "blog-float"
  | "blog-cta"
  | "blog-share"
  | "filhotes-card"
  | "contato"
  | "sobre"
  | "home-hero"
  | "home-cta"
  | "puppies-modal"
  | "other";

export type WhatsAppLinkOptions =
  | string
  | {
      message?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
    };

export function buildWhatsAppLink(options?: WhatsAppLinkOptions): string {
  try {
    const url = new URL(WHATSAPP_LINK);
    const opts =
      typeof options === "string"
        ? { message: options }
        : options || {};

    if (opts.message) url.searchParams.set("text", opts.message);
    if (opts.utmSource) url.searchParams.set("utm_source", opts.utmSource);
    if (opts.utmMedium) url.searchParams.set("utm_medium", opts.utmMedium);
    if (opts.utmCampaign) url.searchParams.set("utm_campaign", opts.utmCampaign);
    if (opts.utmContent) url.searchParams.set("utm_content", opts.utmContent);

    return url.toString();
  } catch {
    const message =
      typeof options === "string"
        ? options
        : options?.message;
    return message ? `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}` : WHATSAPP_LINK;
  }
}

export const WHATSAPP_MESSAGES = {
  default: "Ola! Tenho interesse em um Spitz Alemao Anao.",
  blog: (postTitle: string) =>
    `Ola! Li o artigo "${postTitle}" no blog da By Imperio Dog e quero receber orientacoes personalizadas.`,
  filhotes: (puppyName?: string) =>
    puppyName
      ? `Ola! Quero saber mais sobre o Spitz ${puppyName}. Poderia me enviar disponibilidade e valores?`
      : "Ola! Quero conversar sobre os Spitz Alemao Anao sob consulta.",
  contato: "Ola! Gostaria de tirar duvidas sobre o processo By Imperio Dog.",
  sobre: "Ola! Quero conhecer mais sobre a criadora e o acompanhamento vitalicio.",
} as const;
