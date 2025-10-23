"use client";

import { cn } from "@/lib/cn";

export function AdminEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center shadow-sm",
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-emerald-700">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
