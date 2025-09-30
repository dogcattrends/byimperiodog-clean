import type { ReactNode } from 'react';
import { requireAdminLayout } from '@/lib/adminAuth';
import { ToastProvider } from '@/components/ui/toast';
import { Sidebar } from '@/components/dashboard/Sidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  requireAdminLayout();
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-[var(--accent)] px-3 py-2 text-[var(--accent-contrast)]">Pular para conteúdo</a>
        <div className="lg:flex lg:items-stretch">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            {children}
            <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-[11px] text-[var(--text-muted)]">© {new Date().getFullYear()} By Império Dog</footer>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
