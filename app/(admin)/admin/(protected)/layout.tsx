import { redirect } from "next/navigation";

import { ToastProvider } from "@/components/ui/toast";
import { requireAdminLayout } from "@/lib/adminAuth";

import { AdminNav } from "./AdminNav";
import { AdminTopbar } from "./AdminTopbar";



export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
 const adminIdentity = (() => {
 try {
 return requireAdminLayout();
 } catch {
 redirect("/admin/login");
 }
 })();

 const environment = process.env.NODE_ENV === "production" ? "Producao" : "Desenvolvimento";


 return (
 <ToastProvider>
 <div className="admin-container admin-scrollbar min-h-screen antialiased">
 <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
 <nav aria-label="Navegação principal" className="admin-sidebar">
 <AdminNav environment={environment} />
 </nav>

 <div className="flex flex-col">
 <header className="sticky top-0 z-40 border-b border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))/80] backdrop-blur-xl">
 <AdminTopbar environment={environment} userName={adminIdentity?.name ?? "Admin"} />
 </header>

 <main className="flex-1 px-4 py-6 md:px-8 lg:px-12" role="main">
 {children}
 </main>

 <footer className="border-t border-[rgb(var(--admin-border))] bg-[rgb(var(--admin-surface))] px-4 py-4 text-xs text-[rgb(var(--admin-text-soft))] md:px-8">
 <div className="flex items-center justify-between">
 <p>By Império Dog — Painel Operacional</p>
 <span className="admin-badge admin-badge-info">{environment}</span>
 </div>
 </footer>
 </div>
 </div>
 </div>
 </ToastProvider>
 );
}
