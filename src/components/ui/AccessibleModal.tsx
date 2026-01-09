"use client";

import * as Dialog from "@radix-ui/react-dialog";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useId } from "react";

type AccessibleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  restoreFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
};

const sizeClass = {
  sm: "max-w-[420px]",
  md: "max-w-[640px]",
  lg: "max-w-[820px]",
  xl: "max-w-[960px]",
};

function useScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);
}

export default function AccessibleModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  restoreFocusRef,
  className,
}: AccessibleModalProps) {
  const firstRender = useRef(true);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useScrollLock(open);

  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      // Ao abrir, tente focar o primeiro elemento interativo dentro do modal.
      // Se não houver, foca o botão de fechar como fallback.
      requestAnimationFrame(() => {
        try {
          const root = contentRef.current;
          if (root) {
            const focusable = root.querySelector<HTMLElement>(
              'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable) {
              focusable.focus();
              return;
            }
          }
          if (closeBtnRef.current) closeBtnRef.current.focus();
        } catch (e) {
          /* ignore */
        }
      });
    }

    if (!open && !firstRender.current && restoreFocusRef?.current) {
      restoreFocusRef.current.focus();
    }
    firstRender.current = false;
  }, [open, restoreFocusRef]);

  const panelClass = useMemo(
    () => classNames("relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl outline-none", sizeClass[size], className),
    [size, className],
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[1px]"
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-[95] flex items-stretch justify-center overflow-hidden p-0 sm:items-center sm:p-4">
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  className={classNames(
                    panelClass,
                    "flex h-[100dvh] min-h-0 flex-col rounded-none sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl",
                  )}
                  ref={contentRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={title ? titleId : undefined}
                  aria-describedby={description ? descId : undefined}
                >
                  <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-6 sm:py-4">
                    {title && (
                      <Dialog.Title id={titleId} className="text-base font-semibold tracking-tight text-[var(--text)]">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description id={descId} className="mt-1 text-xs text-[var(--text-muted)]">
                        {description}
                      </Dialog.Description>
                    )}
                    <Dialog.Close asChild>
                      <button
                        ref={closeBtnRef}
                        type="button"
                        className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white text-[var(--text)] shadow-sm transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 sm:top-4 sm:right-4 sm:h-8 sm:w-8"
                        aria-label="Fechar modal (Esc)"
                      >
                        <span aria-hidden>×</span>
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch] sm:px-6">{children}</div>
                  {footer && (
                    <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sm:pb-4">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
