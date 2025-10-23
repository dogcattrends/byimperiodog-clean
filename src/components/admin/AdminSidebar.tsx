"use client";

import { Home, FileText, Users, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Posts", href: "/admin/posts", icon: FileText },
  { label: "Comentários", href: "/admin/comentarios", icon: MessageSquare },
  { label: "Autores", href: "/admin/autores", icon: Users },
  { label: "Wizard", href: "/admin/cadastros/wizard", icon: Sparkles },
];

export default function AdminSidebar() {
  const pathname = usePathname() || "/admin";
  return (
    <nav className="sticky top-0 h-[100dvh] overflow-auto p-4" aria-label="Seções do admin">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex h-10 items-center rounded-full border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          Admin • By Império Dog
        </Link>
      </div>
      <ul className="space-y-1">
        {NAV.map((item) => {
          const ActiveIcon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
                  active ? "bg-emerald-100 text-emerald-900" : "text-zinc-700 hover:bg-emerald-50"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <ActiveIcon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
