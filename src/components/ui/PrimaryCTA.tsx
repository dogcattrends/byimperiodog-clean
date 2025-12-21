"use client";

import React from "react";
import clsx from "clsx";
import { trackCTAClick } from "@/lib/events";

type PrimaryCTAProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  ctaName?: string;
  location?: string;
  loading?: boolean;
};

export default function PrimaryCTA({ children, ctaName = "primary", location = "top", disabled, loading, className, ...rest }: PrimaryCTAProps) {
  const isDisabled = disabled || loading;

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    try {
      trackCTAClick(ctaName, location);
    } catch {
      // silent
    }
    if (rest.onClick) rest.onClick(e as any);
  };

  return (
    <button
      type="button"
      aria-label={typeof children === "string" ? children : ctaName}
      disabled={isDisabled}
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
        isDisabled ? "bg-emerald-200 text-emerald-700 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700",
        className,
      )}
      {...rest}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
}
"use client";

import classNames from "classnames";
import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

export type PrimaryCTAProps = {
  children: ReactNode;
  href?: string;
  ariaLabel?: string;
  icon?: ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> &
  Omit<LinkProps, "href">;

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.3em] transition duration-200 ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] min-h-[48px]";

const variants = {
  solid: "bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--accent-hover)] shadow-[var(--elevation-2)]",
  ghost: "bg-white text-[var(--text)] hover:bg-[var(--surface-2)] shadow-[var(--elevation-1)] border-[var(--border)]",
};

export default function PrimaryCTA({
  children,
  href,
  ariaLabel,
  icon,
  variant = "solid",
  className,
  onClick,
  disabled,
  ...rest
}: PrimaryCTAProps) {
  const content = (
    <>
      {icon}
      <span className="leading-none">{children}</span>
    </>
  );

  const combinedClass = classNames(baseClass, variants[variant], className, {
    "cursor-not-allowed opacity-60": disabled,
  });

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={combinedClass}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={combinedClass}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {content}
    </button>
  );
}
