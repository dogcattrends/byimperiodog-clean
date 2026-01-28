"use client";

import type { ReactNode } from "react";

type Props = {
 title: string;
 description: string;
 primaryAction?: ReactNode;
 secondaryActions?: ReactNode[];
 children: ReactNode;
};

export function AdminPageLayout({
 title,
 description,
 children,
 primaryAction,
 secondaryActions = [],
}: Props) {
 return (
 <section className="space-y-6">
 <header className="admin-glass-card admin-card-gradient px-6 py-6">
 <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-text-muted">Operação</p>
 <h1 className="mt-2 text-3xl font-semibold leading-tight admin-text">{title}</h1>
 <p className="mt-1 max-w-2xl text-sm admin-text-muted">{description}</p>
 </div>
 <div className="flex flex-wrap items-center gap-3 text-sm">
 {secondaryActions.map((action, index) => (
 <span key={`secondary-${index}`}>{action}</span>
 ))}
 {primaryAction && <span className="order-last">{primaryAction}</span>}
 </div>
 </div>
 </header>
 <div className="space-y-6">{children}</div>
 </section>
 );
}
