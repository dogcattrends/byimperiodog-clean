import type { ReactNode } from 'react';
import { redirectIfAuthed } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AuthLayout({ children }: { children: ReactNode }) {
  redirectIfAuthed();
  return <>{children}</>;
}
