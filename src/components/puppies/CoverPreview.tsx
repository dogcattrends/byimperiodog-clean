// PATH: src/components/puppies/CoverPreview.tsx
"use client";
import Image from "next/image";
import React from "react";

export interface CoverPreviewProps {
 url?: string;
 onChange?: (url: string) => void;
 id?: string;
 label?: string;
}

export function CoverPreview({ url, onChange, id = "image_url", label = "Imagem (URL)" }: CoverPreviewProps) {
 const [open, setOpen] = React.useState(false);

 // close modal via Escape key for keyboard users
 React.useEffect(() => {
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") setOpen(false);
 };

 if (open) window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [open]);

 return (
 <div className="grid gap-2">
 <div className="grid gap-1">
 <label htmlFor={id} className="font-medium">{label}</label>
 <div className="flex gap-2">
 <input
 id={id}
 value={url || ""}
 placeholder="https://... .png"
 onChange={(e) => onChange && onChange(e.target.value)}
 className="flex-1 rounded-lg border px-3 py-2 bg-[var(--surface-2)] border-[var(--border)]"
 />
 {!!url && (
 <button
 type="button"
 aria-label="Limpar imagem"
 onClick={() => onChange && onChange("")}
 className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-[11px] hover:bg-[var(--surface-2)]"
 >
 Limpar
 </button>
 )}
 </div>
 </div>

 <button
 type="button"
 onClick={() => url && setOpen(true)}
 className={`relative overflow-hidden rounded-xl border ${url ? "border-[var(--border)]" : "border-dashed border-[var(--border)]"} bg-[var(--surface-2)]`}
 aria-label={url ? "Ampliar capa" : "Sem capa"}
 style={{ width: 180, height: 150 }}
 >
 {url ? (
 <Image src={url} alt="Preview" fill sizes="180px" className="object-cover" />
 ) : (
 <span className="absolute inset-0 grid place-items-center text-[11px] text-[var(--text-muted)]">Sem capa</span>
 )}
 </button>

 {open && url && (
 <div
 className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
 role="button"
 tabIndex={0}
 aria-label="Fechar visualização da capa"
 onClick={() => setOpen(false)}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 setOpen(false);
 }
 }}
 >
 {/* evitar fechar modal ao clicar dentro do conteúdo */}
 {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
 <div role="dialog" aria-modal="true" aria-label="Visualização da capa" tabIndex={-1} className="relative w-[90vw] max-w-3xl aspect-video bg-[var(--surface)] rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
 <Image src={url} alt="Capa" fill className="object-contain" sizes="90vw" />
 <button
 type="button"
 aria-label="Fechar"
 onClick={() => setOpen(false)}
 className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-1 text-white text-[12px]"
 >
 Fechar
 </button>
 </div>
 </div>
 )}
 </div>
 );
}

export default CoverPreview;

