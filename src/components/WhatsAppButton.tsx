'use client';

export default function WhatsAppFloatingButton() {
  return (
    <a
  href="https://wa.me/551196863239?text=Olá!%20Tenho%20interesse%20em%20um%20Spitz%20Alemão%20Anão."
      target="_blank"
      rel="noopener noreferrer"
      data-evt="share_click"
      data-id="wa_floating"
      className="fixed bottom-5 right-5 z-50 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg transition-all active:scale-95"
    >
      💬 Fale no WhatsApp
    </a>
  );
}
