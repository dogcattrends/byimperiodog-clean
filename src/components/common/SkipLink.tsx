"use client";

import Link from "next/link";

type SkipLinkProps = {
  href?: string;
  children?: React.ReactNode;
  className?: string;
};

export function SkipLink({
  href = "#conteudo-principal",
  children = "Ir direto para o conteúdo principal",
  className,
}: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={`skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition focus:outline-none focus:ring-2 focus:ring-brand/80 ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

export default SkipLink;
