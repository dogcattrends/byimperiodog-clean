"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/ui/toast";
import type { ShareablePuppy } from "@/lib/sharePuppy";
import { sharePuppy } from "@/lib/sharePuppy";

type Props = { puppy: ShareablePuppy; location?: "card" | "modal"; className?: string };

export default function ShareButton({ puppy, location = "card", className = "" }: Props) {
  const { push } = useToast();
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState("");

  async function onShare() {
    try {
      const res = await sharePuppy(puppy, location);
      if (res.method === "webshare") {
        push({ type: "success", message: "Compartilhado" });
        return;
      }
      if (res.method === "copy") {
        push({ type: "success", message: "Link copiado" });
        return;
      }
      // fallback: show small modal with input
      setFallbackUrl(res.url || "");
      setShowFallback(true);
    } catch (err) {
      // show fallback
      setFallbackUrl( (puppy.slug ?? puppy.id) ? (typeof window !== 'undefined' ? `${window.location.origin}/filhotes/${puppy.slug ?? puppy.id}` : '') : '');
      setShowFallback(true);
    }
  }

  async function onCopyFallback() {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(fallbackUrl);
        push({ type: 'success', message: 'Link copiado' });
      } else {
        push({ type: 'error', message: 'Não foi possível copiar automaticamente' });
      }
    } catch {
      push({ type: 'error', message: 'Não foi possível copiar o link' });
    } finally {
      setShowFallback(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Compartilhar este filhote"
        onClick={(event) => {
          event.stopPropagation();
          void onShare();
        }}
        className={"flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-600 shadow-lg ring-1 ring-black/5 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 hover:bg-emerald-50 " + className}
      >
        <Share2 className="h-5 w-5" aria-hidden />
      </button>

      {showFallback ? (
        <div role="dialog" aria-modal="true" aria-label="Link para compartilhar" className="fixed inset-0 z-50 grid place-items-center px-4">
          <div className="max-w-md w-full rounded-lg bg-white p-4 shadow-lg">
            <p className="text-sm font-medium">Copiar link</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={fallbackUrl} className="flex-1 rounded-md border px-3 py-2 text-sm" aria-label="Link de compartilhamento" />
              <button onClick={onCopyFallback} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Copiar</button>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => setShowFallback(false)} className="text-sm text-zinc-600">Fechar</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
