"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import passthroughImageLoader from "@/lib/passthrough-image-loader";

export type StorySlide = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
};

export type Story = {
  id: string;
  title: string;
  slides: StorySlide[];
};

interface StoriesViewerProps {
  stories: Story[];
  open: boolean;
  initialIndex: number;
  onOpenChange: (open: boolean) => void;
}

export function StoriesViewer({ stories, open, initialIndex, onOpenChange }: StoriesViewerProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [initialIndex, open]);

  const story = stories[index];
  const slide = story?.slides?.[0];

  const next = () => setIndex((prev) => (prev + 1) % stories.length);
  const prev = () => setIndex((prev) => (prev - 1 + stories.length) % stories.length);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 py-10 outline-none",
            "sm:px-8",
          )}
        >
          <Dialog.Close
            aria-label="Fechar stories"
            className="fixed top-4 right-4 md:top-6 md:right-6 z-[10000] inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white text-xl font-bold shadow-lg transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            ×
          </Dialog.Close>

          <div className="flex w-full max-w-[min(90vw,520px)] flex-col items-center gap-6 text-white">
            <div className="flex w-full items-center justify-between text-xs uppercase tracking-[0.3em] text-zinc-200">
              <button
                type="button"
                onClick={prev}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 px-3 text-xs transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Story anterior"
              >
                Anterior
              </button>
              <span className="pointer-events-none text-zinc-100">
                {index + 1} de {stories.length}
              </span>
              <button
                type="button"
                onClick={next}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 px-3 text-xs transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Próximo story"
              >
                Próximo
              </button>
            </div>

            <div className="relative flex aspect-[9/16] w-full max-h-[75vh] items-center justify-center overflow-hidden rounded-3xl bg-black/60 shadow-2xl">
              {slide ? (
                <Image
                  loader={passthroughImageLoader}
                  src={slide.imageUrl}
                  alt={slide.description ?? slide.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 90vw, 520px"
                  priority
                />
              ) : (
                <span className="text-sm text-zinc-300">Imagem indisponível</span>
              )}
            </div>

            <div className="w-full text-center">
              <h2 className="text-lg font-semibold">{story?.title}</h2>
              {slide?.description ? <p className="mt-1 text-sm text-zinc-200">{slide.description}</p> : null}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default StoriesViewer;
