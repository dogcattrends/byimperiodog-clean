"use client";

import { Activity, FileText, Globe2, LogOut, Menu, PawPrint, Plus, Settings, Share2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

type NavSection = {
 label: string;
 items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
 {
 label: "Operação",
 items: [
 { label: "Filhotes", href: "/admin/filhotes", icon: PawPrint },
 { label: "Leads", href: "/admin/leads", icon: Users },
 ],
 },
 {
 label: "Conteúdo",
 items: [
  { label: "Blog (Sanity)", href: "/admin/blog", icon: FileText },
  { label: "Guia (PDF)", href: "/admin/guia", icon: FileText },
 ],
 },
 {
 label: "Config",
 items: [
 { label: "Tracking", href: "/admin/tracking", icon: Activity },
 { label: "Webhooks", href: "/admin/webhooks", icon: Share2 },
 { label: "SEO", href: "/admin/seo", icon: Globe2 },
 { label: "Geral", href: "/admin/config", icon: Settings },
 ],
 },
];

export function AdminNav({ environment }: Props) {
 const pathname = usePathname();
 const router = useRouter();
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const [mounted, setMounted] = useState(false);
 const [loggingOut, setLoggingOut] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 const handleLogout = async () => {
 if (loggingOut) return;
 setLoggingOut(true);
 try {
 await fetch("/api/admin/logout", { method: "POST", cache: "no-store" });
 } finally {
 setMobileMenuOpen(false);
 router.push("/admin/login?logout=1");
 setLoggingOut(false);
 }
 };

 const renderSections = (sections: NavSection[]) =>
 sections.map((section) => (
 <div key={section.label} className="space-y-1">
 <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--admin-text-soft))]">
 {section.label}
 </p>
 <div className="space-y-1">
 {section.items.map((item) => {
 const active = pathname?.startsWith(item.href);
 const Icon = item.icon;
 return (
 <a
 key={item.href}
 href={item.href}
 className={cn("admin-nav-item", active && "active")}
 aria-current={active ? "page" : undefined}
 >
 <Icon className="h-5 w-5" aria-hidden />
 <span>{item.label}</span>
 </a>
 );
 })}
 </div>
 </div>
 ));

 return (
 <div className="flex h-full flex-col gap-6 px-5 py-6">
 {/* Brand header */}
 <div className="space-y-2">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--admin-brand))] to-[rgb(var(--admin-accent))] shadow-lg">
 <span className="text-lg font-bold text-[rgb(var(--admin-bg))]">BD</span>
 </div>
 <div>
 <p className="text-xs font-bold uppercase tracking-[0.15em] text-[rgb(var(--admin-brand-bright))]">By Império Dog</p>
 <p className="text-[11px] font-medium text-[rgb(var(--admin-text-muted))]">Painel Admin</p>
 </div>
 </div>
 <div className="admin-divider" />
 <div className="flex items-center gap-2">
 <div className="h-2 w-2 animate-pulse rounded-full bg-[rgb(var(--admin-success))]" />
 <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--admin-text-soft))]">{environment}</p>
 </div>
 </div>

 {/* Navigation */}
 <nav aria-label="Navegacao principal" className="flex-1 space-y-4 admin-scrollbar overflow-y-auto" suppressHydrationWarning>
 {mounted ? renderSections(NAV_SECTIONS) : null}
 </nav>

 <div className="space-y-2">
 <a
 href="/admin/filhotes/novo"
 className="admin-btn admin-btn-primary inline-flex w-full items-center justify-center gap-2 text-sm"
 >
 <Plus className="h-4 w-4" aria-hidden />
 Novo filhote
 </a>
 <a
 href="/admin/leads"
 className="admin-btn admin-btn-secondary inline-flex w-full items-center justify-center gap-2 text-sm"
 >
 Leads em andamento
 </a>
 </div>

 {/* Logout */}
 <button
 type="button"
 onClick={handleLogout}
 disabled={loggingOut}
 className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[rgb(var(--admin-danger))] transition-all hover:bg-[rgba(239,68,68,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--admin-danger))] disabled:opacity-70"
 >
 <LogOut className="h-4 w-4" aria-hidden />
 <span>{loggingOut ? "Saindo..." : "Sair"}</span>
 </button>

 {/* Mobile menu button */}
 <button
 type="button"
 onClick={() => setMobileMenuOpen(true)}
 className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgb(var(--admin-brand))] to-[rgb(var(--admin-brand-dim))] text-white shadow-2xl admin-glow md:hidden"
 aria-label="Abrir menu"
 aria-expanded={mobileMenuOpen}
 >
 <Menu className="h-6 w-6" aria-hidden />
 </button>

 <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
 <DialogContent title="Menu de Navegacao" className="admin-glass-card max-w-sm border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))]">
 <nav aria-label="Navegacao principal" className="space-y-4" suppressHydrationWarning>
 {mounted ? renderSections(NAV_SECTIONS) : null}
 </nav>

 <div className="border-t border-[rgb(var(--admin-border))] pt-4">
 <button
 type="button"
 onClick={handleLogout}
 disabled={loggingOut}
 className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[rgb(var(--admin-danger))] transition-all hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-70"
 >
 <LogOut className="h-4 w-4" aria-hidden />
 <span>{loggingOut ? "Saindo..." : "Sair"}</span>
 </button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
