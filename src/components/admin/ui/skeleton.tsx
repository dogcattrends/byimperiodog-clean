"use client";

import { cn } from "@/lib/cn";

export function AdminSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} aria-hidden />;
}
