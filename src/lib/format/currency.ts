// PATH: src/lib/format/currency.ts
// Compat wrapper that delegates to central `formatCentsToBRL` and parsing helpers.
import { formatCentsToBRL, parseBRLToCents as parseDisplayToCents } from "@/lib/price";

export function formatBRL(value: number | string): string {
  if (value === null || value === undefined || value === "") return formatCentsToBRL(0);
  const num = typeof value === "string" ? Number(value) : value;
  if (!isFinite(num)) return formatCentsToBRL(0);
  // `formatCentsToBRL` expects cents; if value looks like a float (e.g., 1234.56), treat as BRL number
  if (Math.abs(num) >= 1 && Math.abs(num) < 1e12 && String(num).includes(".")) {
    // number likely in reais -> convert to cents
    return formatCentsToBRL(Math.round(num * 100));
  }
  // otherwise assume number already represents cents
  return formatCentsToBRL(Number(num));
}

// Converte string exibida (ex: "R$ 1.234,56") em centavos.
export function parseBRLToCents(display: string): number {
  return parseDisplayToCents(display);
}

export function centsToNumber(cents: number | null | undefined): number {
  if (!cents || cents <= 0) return 0;
  return cents / 100;
}

export function centsToBRL(cents: number | null | undefined): string {
  return formatBRL(centsToNumber(cents));
}
