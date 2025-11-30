"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { routes } from "@/lib/route";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const NAV_ITEMS = [
  { label: "Inicio", href: routes.home },
  { label: "Filhotes", href: routes.filhotes },
  { label: "Processo", href: routes.sobre },
  { label: "Blog", href: routes.blog },
  { label: "Contato", href: routes.contato },
];

const SUPPORT_ITEMS = [
  { label: "FAQ do tutor", href: "/faq-do-tutor" },
  { label: "Politica de privacidade", href: "/politica-de-privacidade" },
  { label: "Termos de uso", href: "/termos-de-uso" },
  { label: "Politica editorial", href: "/politica-editorial" },
];

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  const whatsapp = buildWhatsAppLink({
    message:
      "Ola! Quero falar com a By Imperio Dog sobre disponibilidade de Spitz Alemao Anao e proximos passos.",
    utmSource: "site",
    utmMedium: "footer",
    utmCampaign: "footer_whatsapp",
    utmContent: "footer_cta",
  });

  return (
    <footer className="mt-16 border-t border-emerald-100 bg-emerald-950 text-emerald-50" role="contentinfo">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
            By Imperio Dog
          </span>
          <p className="text-sm leading-relaxed text-emerald-100/80">
            Spitz Alemao Anao ate 22 cm, criado com responsabilidade, saude validada e mentoria vitalicia.
            Atendimento premium sob consulta para familias que valorizam transparencia.
          </p>
          <a
            href={whatsapp}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
          >
            <WhatsAppIcon className="h-4 w-4" aria-hidden />
            Falar com a criadora
          </a>
        </div>

        <nav aria-label="Navegacao" className="space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Navegacao</h3>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-[48px] items-center text-emerald-100/80 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Suporte" className="space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Suporte</h3>
          <ul className="space-y-2">
            {SUPPORT_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-[48px] items-center text-emerald-100/80 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Contato</h3>
          <p className="text-emerald-100/80">
            Atendimento sob consulta a partir de Sao Paulo - conversas individuais para alinhar rotina, investimento e socializacao antes da reserva.
          </p>
          <address className="not-italic space-y-1 text-emerald-100/60">
            <p>E-mail: contato@byimperiodog.com.br</p>
            <p>WhatsApp: (11) 98663-3239</p>
          </address>
        </div>
      </div>

      <div className="border-t border-emerald-800 py-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 text-xs text-emerald-200/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>&copy; 2013-{year || new Date().getFullYear()} By Imperio Dog. Todos os direitos reservados.</p>
          <p>Spitz Alemao Anao - saude validada, suporte premium e respeito as familias tutoras.</p>
        </div>
      </div>
    </footer>
  );
}