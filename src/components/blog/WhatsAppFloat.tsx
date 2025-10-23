'use client';

import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

import { buildWhatsAppLink, WHATSAPP_MESSAGES } from '@/lib/whatsapp';

export default function WhatsAppFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappUrl = buildWhatsAppLink(WHATSAPP_MESSAGES.default);

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl transition-all hover:scale-110 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/50"
        aria-label="Abrir WhatsApp"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Popup de mensagem */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 animate-in slide-in-from-bottom-5 fade-in">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text)]">Byimperio Dog</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Normalmente responde em alguns minutos
                </p>
              </div>
            </div>
            
            <div className="mb-4 rounded-lg bg-[var(--surface-2)] p-3">
              <p className="text-sm text-[var(--text)]">
                👋 Olá! Tem alguma dúvida sobre Spitz Alemão? Estamos aqui para ajudar!
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-600"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle className="h-5 w-5" />
              Iniciar Conversa
            </a>
          </div>
        </div>
      )}
    </>
  );
}
