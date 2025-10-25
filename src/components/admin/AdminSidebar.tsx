"use client";

import { FileText, Home, MessageSquare, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getClientAdminRole,
  hasPermission,
  type AdminPermission,
  type AdminRole,
} from "@/lib/rbac";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: AdminPermission;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: Home, permission: "dashboard:read" },
  { label: "Posts", href: "/admin/posts", icon: FileText, permission: "blog:read" },
  { label: "Comentarios", href: "/admin/comentarios", icon: MessageSquare, permission: "blog:write" },
  { label: "Autores", href: "/admin/autores", icon: Users, permission: "blog:write" },
  { label: "Wizard", href: "/admin/cadastros/wizard", icon: Sparkles, permission: "cadastros:write" },
];

export default function AdminSidebar() {
  const pathname = usePathname() || "/admin";
  const [role, setRole] = useState<AdminRole>(getClientAdminRole);

  useEffect(() => {
    setRole(getClientAdminRole());
  }, []);

  const items = NAV_ITEMS.filter((item) => !item.permission || hasPermission(role, item.permission));

  return (
    <nav className="sticky top-0 h-[100dvh] overflow-auto p-4" aria-label="Secoes do admin">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex h-10 items-center rounded-full border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          Admin - By Imperio Dog
        </Link>
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const ActiveIcon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
