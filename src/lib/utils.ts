// src/lib/utils.ts
import { formatCentsToBRL } from "@/lib/price";

export function fmtPrice(price: number | null | undefined) {
 if (typeof price !== "number") return "Consultar valor";
 return formatCentsToBRL(price);
}
