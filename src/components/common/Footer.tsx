"use client";

import Link from "next/link";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { routes } from "@/lib/route";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const NAV_ITEMS = [
  { label: "Início", href: routes.home },
  { label: "Filhotes", href: routes.filhotes },
  { label: "Processo", href: routes.sobre },
  { label: "Blog", href: routes.blog },
  { label: "Contato", href: routes.contato },
];

const SUPPORT_ITEMS = [
  { label: "FAQ do tutor", href: "/faq-do-tutor" },
  { label: "Política de privacidade", href: "/politica-de-privacidade" },
  { label: "Termos de uso", href: "/termos-de-uso" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const whatsapp = buildWhatsAppLink({
    message:
      "Olá! Quero falar com a By Império Dog sobre disponibilidade de Spitz Alemão Anão e próximos passos.",
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
            By Império Dog
          </span>
          <p className="text-sm leading-relaxed text-emerald-100/80">
            Spitz Alemão Anão até 22 cm, criado com responsabilidade, saúde validada e mentoria
            vitalícia. Atendimento premium sob consulta para famílias que valorizam transparência.
          </p>
          <a
            href={whatsapp}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
          >
            <WhatsAppIcon className="h-4 w-4" aria-hidden />
            Falar com a criadora
          </a>
        </div>

        <nav aria-label="Navegação" className="space-y-3 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
            Navegação
          </h3>
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
            Suporte
          </h3>
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
            Contato
          </h3>
          <p className="text-emerald-100/80">
            Atendimento sob consulta a partir de São Paulo – conversas individuais para alinhar
            rotina, investimento e socialização antes da reserva.
          </p>
          <address className="not-italic space-y-1 text-emerald-100/60">
            <p>E-mail: contato@byimperiodog.com.br</p>
            <p>WhatsApp: (11) 98663-3239</p>
          </address>
        </div>
      </div>

      <div className="border-t border-emerald-800 py-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 text-xs text-emerald-200/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {year} By Império Dog. Todos os direitos reservados.</p>
          <p>Spitz Alemão Anão – saúde validada, suporte premium e respeito às famílias tutoras.</p>
        </div>
      </div>
    </footer>
  );
}
