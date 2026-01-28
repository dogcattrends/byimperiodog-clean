import { formatCentsToBRL } from "@/lib/price";

export const formatBRL = (cents?: number | null) =>
 typeof cents === "number" ? formatCentsToBRL(cents) : "Consultar valor";

export const formatDate = (iso?: string | null) => {
 if (!iso) return "—";
 try {
 return new Intl.DateTimeFormat("pt-BR", {
 dateStyle: "medium",
 timeZone: "UTC",
 }).format(new Date(iso));
 } catch {
 return "—";
 }
};

export const titleCasePt = (input?: string | null) => {
 const value = String(input ?? "").trim();
 if (!value) return "";
 return value
 .replace(/-/g, " ")
 .split(/\s+/g)
 .filter(Boolean)
 .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
 .join(" ");
};
