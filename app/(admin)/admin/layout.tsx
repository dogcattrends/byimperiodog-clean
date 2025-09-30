// app/(admin)/admin/layout.tsx
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { adminNoIndexMetadata } from '@/lib/seo.core';

// Evita indexação
export const metadata: Metadata = adminNoIndexMetadata;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Layout simplificado: as páginas admin usam AdminShell internamente.
// Layout base: não aplica mais guard nem providers (feito em (protected)/layout.tsx).
export default function AdminLayout({ children }: { children:ReactNode }){ return <>{children}</>; }

