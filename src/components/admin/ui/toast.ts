export type AdminToastVariant = "success" | "error" | "info";
export type AdminToastOptions = { title: string; description?: string; variant?: AdminToastVariant };

/**
 * showAdminToast — implementação mínima sem dependências
 * Usa CustomEvent para permitir que um viewport real (se existir) consuma o evento; caso contrário, registra no console.
 */
export function showAdminToast(opts: AdminToastOptions) {
  if (typeof window !== "undefined") {
    const ev = new CustomEvent("admin:toast", { detail: opts });
    window.dispatchEvent(ev);
  }
  // Fallback para DX
  const tag = opts.variant === "error" ? "[Erro]" : opts.variant === "success" ? "[OK]" : "[Info]";
  // eslint-disable-next-line no-console
  console.log(`${tag} ${opts.title}${opts.description ? ` — ${opts.description}` : ""}`);
}
