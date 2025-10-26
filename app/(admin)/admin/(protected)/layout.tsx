import type { ReactNode } from 'react';
import { requireAdminLayout } from '@/lib/adminAuth';
import { ToastProvider } from '@/components/ui/toast';
import AdminBodyClass from '@/components/admin/AdminBodyClass';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  requireAdminLayout();
  return (
    <ToastProvider>
      <AdminBodyClass />
      {children}
    </ToastProvider>
  );
}
