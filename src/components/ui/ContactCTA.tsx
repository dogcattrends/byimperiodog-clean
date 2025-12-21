"use client";

import classNames from "classnames";
import { ReactNode, MouseEventHandler } from "react";

type ContactCTAProps = {
  href: string;
  label: string;
  icon?: ReactNode;
  variant?: "solid" | "outline";
  target?: string;
  rel?: string;
  ariaLabel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function ContactCTA({
  href,
  label,
  icon,
  variant = "solid",
  target = "_blank",
  rel = "noreferrer noopener",
  ariaLabel,
}: ContactCTAProps) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className={classNames(
        "inline-flex min-h-[48px] items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold tracking-[0.25em] transition duration-200 ease-[var(--ease-standard)]",
        variant === "solid"
          ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--elevation-2)] hover:bg-[var(--accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
      )}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
