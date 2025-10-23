"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/cn";

export function AdminTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={120}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={cn(
              "z-[9999] max-w-xs rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg",
              "data-[state=delayed-open]:animate-fade-in data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
            )}
            sideOffset={6}
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-emerald-100" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
