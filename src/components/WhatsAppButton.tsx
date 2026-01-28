'use client';

import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function WhatsAppFloatingButton() {
 const whatsappLink = buildWhatsAppLink({
  message: "Ola! Vim pelo botao flutuante e quero falar sobre filhotes disponiveis.",
  utmSource: "site",
  utmMedium: "floating",
  utmCampaign: "whatsapp",
  utmContent: "floating",
 });
 return (
 <a
 href={whatsappLink}
 target="_blank"
 rel="noopener noreferrer"
 data-evt="share_click"
 data-id="wa_floating"
 className="fixed bottom-5 right-5 z-50 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
 aria-label="Conversar no WhatsApp com a equipe By Império Dog"
 >
 Fale no WhatsApp
 </a>
 );
}
