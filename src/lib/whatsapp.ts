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
 : "Ola! Quero conversar sobre os Spitz Alemao Anao. Consultar valor.",
 contato: "Ola! Gostaria de tirar duvidas sobre o processo By Imperio Dog.",
 sobre: "Ola! Quero conhecer mais sobre a criadora e o acompanhamento vitalicio.",
} as const;

export type WhatsAppQualificationInput = {
 origin?: string;
 canonicalUrl?: string;
 puppyName?: string | null;
 puppyColor?: string | null;
 puppySex?: string | null;
 puppyLocation?: string | null;
 intent?: string;
};

export function buildQualifiedWhatsAppMessage(input: WhatsAppQualificationInput): string {
 const origin = input.origin?.trim();
 const canonicalUrl = input.canonicalUrl?.trim();

 const puppyName = input.puppyName?.trim();
 const puppyColor = input.puppyColor?.trim();
 const puppySex = input.puppySex?.trim();
 const puppyLocation = input.puppyLocation?.trim();

 const puppyParts = [puppyName ? `filhote ${puppyName}` : null, puppyColor, puppySex]
  .filter(Boolean)
  .join(" • ");

 const header = puppyParts
  ? `Olá! Vi o ${puppyParts}${puppyLocation ? ` — ${puppyLocation}` : ""} e quero informações.`
  : "Olá! Quero informações sobre filhotes de Spitz Alemão Anão Lulu da Pomerânia.";

 const originLine = origin ? `Origem: ${origin}.` : null;
 const intentLine = input.intent ? `Intenção: ${input.intent}.` : null;
 const linkLine = canonicalUrl ? `Link: ${canonicalUrl}` : null;

 const questions =
  "Para eu te enviar disponibilidade e valores, me diga: 1) cidade/UF; 2) preferência de sexo/cor; 3) prazo para levar; 4) faixa de investimento; 5) tem crianças ou outros pets?";

 return [header, originLine, intentLine, linkLine, questions].filter(Boolean).join(" ");
}

type LeadForMessage = {
 nome?: string | null;
 first_name?: string | null;
 name?: string | null;
 cidade?: string | null;
 estado?: string | null;
};

type PuppyForMessage = {
 name?: string | null;
 color?: string | null;
 sex?: string | null;
 price_cents?: number | null;
};

export type WhatsAppMessageTone = "premium" | "consultivo" | "objetivo" | string;

export type WhatsAppMessagePayload = {
 message: string;
 variations: string[];
 strategy: string;
 ctaLink: string;
};

const TONE_PRESETS: Record<string, { greeting: string; hook: string; promise: string; ctaLabel: string }> = {
 premium: {
 greeting: "Ola",
 hook: "Aqui e o concierge By Imperio Dog cuidando pessoalmente da sua experiencia.",
 promise: "Envio video privado e resumo completo em minutos.",
 ctaLabel: "Fale agora",
 },
 consultivo: {
 greeting: "Ola",
 hook: "Sou seu especialista dedicado para guiar cada passo.",
 promise: "Posso ajustar agenda, documentos e video conforme voce preferir.",
 ctaLabel: "Vamos alinhar",
 },
 objetivo: {
 greeting: "Ola",
 hook: "Mensagem direta do time By Imperio Dog.",
 promise: "Consigo confirmar video ou visita ainda hoje.",
 ctaLabel: "Responder agora",
 },
};

function pickPreset(tone?: WhatsAppMessageTone) {
 if (!tone) return TONE_PRESETS.premium;
 return TONE_PRESETS[tone] ?? TONE_PRESETS.premium;
}

function leadFirstName(lead?: LeadForMessage) {
 const candidate = lead?.first_name || lead?.nome || lead?.name || "cliente";
 return candidate.trim().split(" ")[0];
}

function describePuppy(puppy?: PuppyForMessage) {
 const name = puppy?.name?.trim();
 const color = puppy?.color?.trim();
 if (name && color) return `${name} ${color}`;
 if (name) return name;
 if (color) return `Spitz ${color}`;
 return "Spitz selecionado";
}

import { formatCentsToBRL } from "@/lib/price";

function formatPrice(price_cents?: number | null) {
 if (typeof price_cents !== "number" || Number.isNaN(price_cents)) return null;
 return formatCentsToBRL(price_cents);
}

export function generateWhatsAppMessage(
 lead: LeadForMessage,
 puppy: PuppyForMessage,
 tone: WhatsAppMessageTone = "premium",
): WhatsAppMessagePayload {
 const preset = pickPreset(tone);
 const name = leadFirstName(lead);
 const puppyLabel = describePuppy(puppy);
 const priceLabel = formatPrice(puppy?.price_cents);
 const city = lead?.cidade?.trim();
 const state = lead?.estado?.trim();
 const location = city || state ? [city, state].filter(Boolean).join("/") : null;

 const summaryParts = [
 preset.hook,
 `${puppyLabel}${priceLabel ? ` a partir de ${priceLabel}` : ""}.`,
 location ? `Atendo pessoalmente clientes em ${location}.` : null,
 preset.promise,
 ].filter(Boolean);

 const linkMessage = `Quero avancar sobre ${puppyLabel}`;
 const whatsappLink = buildWhatsAppLink({ message: linkMessage });
 const cta = `${preset.ctaLabel}: ${whatsappLink}`;

 const message = `${preset.greeting} ${name}! ${summaryParts.join(" ")} ${cta}`;

 const variations = [
 `Primeiro contato — ${preset.greeting} ${name}! ${puppyLabel} esta reservado para voce. ${cta}`,
 `Follow-up leve — ${name}, deixei o video do ${puppyLabel} pronto. Posso enviar agora? ${cta}`,
 `Follow-up forte — ${name}, consigo garantir prioridade do ${puppyLabel} apenas hoje. Confirme comigo: ${cta}`,
 `Urgencia — ${name}, ultima agenda premium para ver o ${puppyLabel} ainda hoje. ${cta}`,
 `Confirmacao da visita — ${name}, confirmando sua visita privada para conhecer o ${puppyLabel}. Qualquer ajuste, fale aqui: ${cta}`,
 `Reserva — ${name}, segue o acesso direto para finalizar a reserva do ${puppyLabel}. ${cta}`,
 ];

 const strategy = `Sequencia ${tone || "premium"} com CTA unico no WhatsApp, mensagens curtas e foco em resposta imediata.`;

 return { message, variations, strategy, ctaLink: whatsappLink };
}
