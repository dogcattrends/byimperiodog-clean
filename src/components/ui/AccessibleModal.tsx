"use client";

import * as Dialog from "@radix-ui/react-dialog";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useMemo, useRef } from "react";

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
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useScrollLock(open);

  useEffect(() => {
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
            <div className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto p-4">
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  className={panelClass}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
                    {title && (
                      <Dialog.Title className="text-base font-semibold tracking-tight text-[var(--text)]">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="mt-1 text-xs text-[var(--text-muted)]">
                        {description}
                      </Dialog.Description>
                    )}
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white text-[var(--text)] shadow-sm transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                        aria-label="Fechar modal"
                      >
                        <span aria-hidden>×</span>
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-7rem)]">{children}</div>
                  {footer && (
                    <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--surface)]">
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
