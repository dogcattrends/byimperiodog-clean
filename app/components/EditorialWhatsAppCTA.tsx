"use client";
import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export function EditorialWhatsAppCTA() {
  const waLink = buildWhatsAppLink({
    message:
      "Olá! Li o editorial sobre perfil ideal do Spitz Alemão - Lulu da Pomerânia Anão e quero conversar sobre filhotes disponíveis. Pode me orientar?",
    utmSource: "site",
    utmMedium: "editorial",
    utmCampaign: "whatsapp",
    utmContent: "editorial-cta"
  });
  return (
    <div className="mt-8 flex flex-col items-center w-full max-w-xl mx-auto">
      <div className="flex flex-col items-center gap-2 w-full sm:flex-row sm:justify-center sm:gap-4">
        <TrackedLink
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md hover:bg-green-700 hover:scale-105 hover:brightness-110 focus:scale-105 focus:brightness-110 transition-all duration-200 border border-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 sm:px-4 sm:py-2 sm:text-base max-w-full"
          aria-label="Abrir conversa no WhatsApp sobre o Spitz Alemão - Lulu da Pomerânia Anão. Atendimento humano, sem compromisso."
          tabIndex={0}
          analyticsEvent="cta_click"
          analyticsPayload={{
            placement: "editorial",
            cta: "whatsapp",
            context: "perfil-ideal",
            label: "Quero conversar no WhatsApp"
          }}
        >
          <WAIcon size={20} className="h-5 w-5 text-white drop-shadow-sm" aria-hidden />
          Quero conversar no WhatsApp
        </TrackedLink>
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-300 shadow-sm mt-2 sm:mt-0 whitespace-nowrap">Atendimento Humano</span>
      </div>
      <span className="mt-2 text-xs text-zinc-500 text-center max-w-md">Tire dúvidas, receba orientação e descubra se o Spitz Alemão - Lulu da Pomerânia Anão é o perfil ideal para sua família. Atendimento humano, sem compromisso.</span>
    </div>
  );
}
export default EditorialWhatsAppCTA;
