"use client";

import Image from "next/image";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

export type StoriesBarItem = {
  id: string;
  name?: string | null;
  cover?: string | null;
  originalIndex?: number;
};

type StoriesBarProps = {
  items: StoriesBarItem[];
  onSelect: (index: number) => void;
  className?: string;
  ariaLabel?: string;
};

const StoriesBar = forwardRef<HTMLDivElement, StoriesBarProps>(function StoriesBar(
  { items, onSelect, className, ariaLabel = "Stories de filhotes" },
  ref,
) {
  if (!items.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "stories-bar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 pt-1",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-300 hover:scrollbar-thumb-zinc-400",
        className,
      )}
      role="list"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const firstName = (item.name || "Filhote").split(" ")[0];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.originalIndex ?? index)}
            className="group flex w-[5.5rem] shrink-0 snap-start flex-col items-center gap-2 focus:outline-none"
            aria-label={`Abrir story de ${item.name || "filhote"}`}
          >
            <span className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full ring-2 ring-brand ring-offset-2 ring-offset-white transition group-hover:scale-[1.02]">
              {item.cover ? (
                <Image
                  src={item.cover}
                  alt={`Prévia do filhote ${item.name || "Filhote"}`}
                  fill
                  className="object-cover"
                  sizes="88px"
                  priority={index < 4}
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-zinc-100 text-xs text-zinc-400">
                  Sem foto
                </span>
              )}
            </span>
            <span className="max-w-[5.5rem] truncate text-center text-xs font-medium text-zinc-600">
              {firstName}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default StoriesBar;
