"use client";

import { BarChart, FileText, LogOut, Menu, PawPrint, Settings, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Dialog, DialogContent } from "../../../../src/components/ui/dialog";
import { cn } from "../../../../src/lib/cn";

type Props = {
  environment: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: (NavItem & { children?: NavItem[] })[] = [
  {
    label: "Filhotes / Estoque",
    href: "/admin/filhotes",
    icon: PawPrint,
    children: [
      { label: "Listar", href: "/admin/filhotes", icon: PawPrint },
      { label: "Novo filhote", href: "/admin/filhotes/novo", icon: PawPrint },
      { label: "Importar / Upload", href: "/admin/filhotes/import", icon: PawPrint },
      { label: "Mídias/Imagens", href: "/admin/filhotes/media", icon: PawPrint },
      { label: "Status/Disponibilidade", href: "/admin/filhotes/status", icon: PawPrint },
    ],
  },
  { label: "Leads", href: "/admin/leads", icon: Users },
  { label: "Blog (Sanity)", href: "/admin/blog", icon: FileText },
  { label: "Metricas", href: "/admin/analytics", icon: BarChart },
  { label: "Config", href: "/admin/config", icon: Settings },
];

export function AdminNav({ environment }: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderItems = (items: (NavItem & { children?: NavItem[] })[]) =>
    items.map((item) => {
      const active = pathname?.startsWith(item.href);
      const Icon = item.icon;
      if (item.children && item.children.length > 0) {
        const isOpen = pathname?.startsWith(item.href) || item.children.some((c) => pathname?.startsWith(c.href));
        return (
          <details key={item.label} open={!!isOpen} className="group">
            <summary
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer",
                isOpen ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "text-[var(--text)] hover:bg-[var(--surface)]"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </summary>
            <nav aria-label={`${item.label} - submenus`} className="mt-2 space-y-1 pl-6">
              {item.children.map((c) => {
                const cActive = pathname?.startsWith(c.href);
                const CIcon = c.icon ?? Icon;
                return (
                  <a
                    key={c.href}
                    href={c.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                      cActive ? "bg-emerald-100 text-emerald-800" : "text-[var(--text)] hover:bg-[var(--surface)]"
                    )}
                    aria-current={cActive ? "page" : undefined}
                  >
                    <CIcon className="h-3 w-3" aria-hidden />
                    <span className="text-sm">{c.label}</span>
                  </a>
                );
              })}
              <div className="mt-2 flex gap-2">
                <a href="/admin/filhotes/novo" className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  Novo filhote
                </a>
                <a href="/admin/filhotes/import" className="rounded-full border px-3 py-1 text-xs font-semibold">
                  Importar
                </a>
              </div>
            </nav>
          </details>
        );
      }
      return (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500",
            active ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "text-[var(--text)] hover:bg-[var(--surface)]",
          )}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="h-4 w-4" aria-hidden />
          <span>{item.label}</span>
        </a>
      );
    });

  return (
    <div className="flex h-full flex-col gap-4 px-4 py-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">By Imperio Dog</p>
        <p className="text-sm font-semibold text-[var(--text)]">Painel Admin</p>
        <p className="text-[11px] text-[var(--text-muted)]">{environment}</p>
      </div>

      <nav aria-label="Navegacao principal" className="flex-1 space-y-1">
        {renderItems(NAV_ITEMS)}
      </nav>

      <form action="/api/admin/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span>Sair</span>
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg md:hidden"
        aria-label="Abrir menu"
        aria-expanded={mobileMenuOpen}
      >
        <Menu className="h-6 w-6" aria-hidden />
      </button>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent title="Menu de Navegacao" className="max-w-sm">
          <nav aria-label="Navegacao principal" className="space-y-2">
            {renderItems(NAV_ITEMS)}
          </nav>

          <form action="/api/admin/logout" method="post" className="border-t border-[var(--border)] pt-4">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span>Sair</span>
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
