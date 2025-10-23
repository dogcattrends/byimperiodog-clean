/**
 * Centraliza a configuração e helpers do WhatsApp para toda a aplicação.
 * - Número oficial do WhatsApp (env + fallback)
 * - Helper para gerar links com mensagem e UTM
 * - Tipos para tracking de origem
 */

/**
 * Número do WhatsApp oficial da By Imperio Dog
 * Lê de NEXT_PUBLIC_WA_LINK ou fallback para número padrão
 */
export const WHATSAPP_NUMBER = '5511968633239'; // Número oficial

/**
 * Link base do WhatsApp
 */
export const WHATSAPP_LINK = process.env.NEXT_PUBLIC_WA_LINK || `https://wa.me/${WHATSAPP_NUMBER}`;

/**
 * Origens possíveis de CTAs do WhatsApp para tracking
 */
export type WhatsAppSource =
  | 'footer'
  | 'navbar'
  | 'blog-float'
  | 'blog-cta'
  | 'blog-share'
  | 'filhotes-card'
  | 'contato'
  | 'sobre'
  | 'home-hero'
  | 'home-cta'
  | 'puppies-modal'
  | 'other';

/**
 * Gera um link do WhatsApp com mensagem pré-preenchida
 * @param message - Mensagem opcional pré-preenchida
 * @returns URL completa do WhatsApp
 */
export function buildWhatsAppLink(message?: string): string {
  const baseUrl = WHATSAPP_LINK;
  if (!message) return baseUrl;

  const params = new URLSearchParams();
  params.set('text', message);
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Mensagens padrão por contexto
 */
export const WHATSAPP_MESSAGES = {
  default: 'Olá! Tenho interesse em um Spitz Alemão Anão.',
  blog: (postTitle: string) =>
    `Olá! Vi o artigo "${postTitle}" no blog e gostaria de saber mais sobre Spitz Alemão.`,
  filhotes: (puppyName?: string) =>
    puppyName
      ? `Olá! Tenho interesse no filhote ${puppyName}. Poderia me enviar mais informações?`
      : 'Olá! Tenho interesse nos filhotes disponíveis. Poderia me enviar mais informações?',
  contato: 'Olá! Gostaria de tirar algumas dúvidas sobre os filhotes.',
  sobre: 'Olá! Gostaria de conhecer mais sobre o By Imperio Dog.',
} as const;
