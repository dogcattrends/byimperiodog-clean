"use client";

import Image from "next/image";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";
import { STORY_AVATAR_SIZES } from "@/lib/image-sizes";
import { optimizePuppyThumb } from "@/lib/optimize-image";
import passthroughImageLoader from "@/lib/passthrough-image-loader";

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
        "stories-bar flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-3 pt-2 -mx-2",
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
            className="group flex min-h-[96px] min-w-[88px] shrink-0 snap-start flex-col items-center gap-2 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 rounded-2xl"
            aria-label={`Ver story de ${item.name || "filhote"}`}
          >
            <span className="relative aspect-square h-20 w-20 overflow-hidden rounded-full ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-white transition-transform group-hover:scale-105 group-focus-visible:ring-[var(--brand)] group-focus-visible:ring-offset-4 shadow-sm">
              {item.cover ? (
                <Image
                  loader={passthroughImageLoader}
                  src={optimizePuppyThumb(item.cover) || item.cover}
                  alt={`Prévia de ${item.name || "Filhote"}`}
                  fill
                  className="object-cover"
                  sizes={STORY_AVATAR_SIZES}
                  priority={index < 4}
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-zinc-100 text-xs text-zinc-400">
                  Sem foto
                </span>
              )}
            </span>
            <span className="max-w-[5.5rem] truncate text-center text-xs font-medium text-zinc-600 group-hover:text-[var(--brand)] transition-colors">
              {firstName}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default StoriesBar;
