'use client';

import { ArrowRight, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';

import { buildWhatsAppLink, WHATSAPP_MESSAGES } from '@/lib/whatsapp';

interface BlogCTAsProps {
  postTitle: string;
  category?: string | null;
}

export default function BlogCTAs({ postTitle, category }: BlogCTAsProps) {
  const whatsappUrl = buildWhatsAppLink(WHATSAPP_MESSAGES.blog(postTitle));

  // CTAs relevantes baseados na categoria
  const isAboutPuppies = category?.toLowerCase().includes('filhote') || 
                        postTitle.toLowerCase().includes('filhote');
  
  const isAboutCare = category?.toLowerCase().includes('cuidado') || 
                     category?.toLowerCase().includes('saúde') ||
                     postTitle.toLowerCase().includes('cuidado');

  return (
    <div className="mt-12 space-y-6">
      {/* CTA Principal - WhatsApp */}
      <div className="rounded-2xl border-2 border-emerald-600 bg-gradient-to-br from-emerald-50 to-green-50 p-8 shadow-lg dark:from-emerald-950/30 dark:to-green-950/30">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <MessageCircle className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-2xl font-bold text-[var(--text)]">
              Tem dúvidas sobre Spitz Alemão?
            </h3>
            <p className="text-[var(--text-muted)]">
              Fale diretamente conosco pelo WhatsApp! Nossa equipe está pronta para ajudar você.
            </p>
          </div>
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <Phone className="h-5 w-5" />
            Falar no WhatsApp
          </a>
        </div>
      </div>

      {/* CTAs condicionais */}
      <div className="grid gap-6 md:grid-cols-2">
        {isAboutPuppies && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h4 className="mb-2 text-lg font-bold text-[var(--text)]">
              Filhotes Disponíveis
            </h4>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Conheça nossos filhotes Spitz Alemão disponíveis.
            </p>
            <Link 
              href="/filhotes" 
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)]"
            >
              Ver Filhotes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {isAboutCare && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h4 className="mb-2 text-lg font-bold text-[var(--text)]">
              Guia Completo de Cuidados
            </h4>
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Baixe nosso guia completo sobre cuidados com Spitz Alemão.
            </p>
            <Link 
              href="/contato?assunto=guia" 
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)]"
            >
              Solicitar Guia Grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h4 className="mb-2 text-lg font-bold text-[var(--text)]">
            Mais Artigos sobre Spitz
          </h4>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            Explore nosso blog com dicas, guias e novidades sobre a raça.
          </p>
          <Link 
            href="/blog" 
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)]"
          >
            Ver Mais Artigos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h4 className="mb-2 text-lg font-bold text-[var(--text)]">
            Conheça Nosso Canil
          </h4>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            Saiba mais sobre nossa história e compromisso com a raça.
          </p>
          <Link 
            href="/sobre" 
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)]"
          >
            Sobre Nós
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* CTA de Newsletter */}
      <div className="rounded-xl border border-[var(--border)] bg-gradient-to-r from-[var(--surface)] to-[var(--surface-2)] p-8">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-2 text-xl font-bold text-[var(--text)]">
            📧 Receba dicas exclusivas sobre Spitz Alemão
          </h3>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            Cadastre-se em nossa newsletter e receba conteúdos exclusivos, dicas de cuidados e novidades sobre filhotes.
          </p>
          <form className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              required
            />
            <button 
              type="submit" 
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Inscrever-se
            </button>
          </form>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Não enviamos spam. Você pode cancelar a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
