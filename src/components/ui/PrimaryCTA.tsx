"use client";

import classNames from "classnames";
import type { LinkProps } from "next/link";
import Link from "next/link";
import type { MouseEvent, MouseEventHandler, ReactNode } from "react";

import track from "@/lib/track";

export type TrackingMeta = {
 ctaId?: string;
 location?: string;
 deviceMode?: "mobile" | "desktop" | "modal";
 extra?: Record<string, unknown>;
};

export type PrimaryCTAProps = {
 children: ReactNode;
 href?: string;
 ariaLabel?: string;
 icon?: ReactNode;
 variant?: "solid" | "ghost";
 type?: "button" | "submit" | "reset";
 className?: string;
 tracking?: TrackingMeta;
 onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
 disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> &
 Omit<LinkProps, "href">;

const baseClass =
 "inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.3em] transition duration-200 ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] min-h-[48px]";

const variants = {
 solid: "bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--accent-hover)] shadow-[var(--elevation-2)]",
 ghost: "bg-white text-[var(--text)] hover:bg-[var(--surface-2)] shadow-[var(--elevation-1)] border-[var(--border)]",
};

const enrichTracking = (tracking?: TrackingMeta) => {
 if (!tracking) return undefined;
 const payload: Record<string, unknown> = {
 cta_id: tracking.ctaId,
 location: tracking.location,
 device_mode: tracking.deviceMode,
 ...tracking.extra,
 };
 return payload;
};

export default function PrimaryCTA({
 children,
 href,
 ariaLabel,
 icon,
 variant = "solid",
 className,
 tracking,
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

 const handleClick = (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
 if (disabled) {
 event.preventDefault();
 return;
 }
 const payload = enrichTracking(tracking);
 if (payload) {
 track.event?.("cta_click", payload);
 }
 onClick?.(event);
 };

 if (href) {
 return (
 <Link
 href={href}
 aria-label={ariaLabel}
 className={combinedClass}
 onClick={handleClick}
 {...(rest as unknown as Record<string, unknown>)}
 >
 {content}
 </Link>
 );
 }

 return (
 <button type="button" aria-label={ariaLabel} className={combinedClass} onClick={handleClick} disabled={disabled} {...rest}>
 {content}
 </button>
 );
}
