'use client';

export default function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/5511968633239?text=Ol%C3%A1!%20Tenho%20interesse%20em%20um%20Spitz%20Alem%C3%A3o%20An%C3%A3o."
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
