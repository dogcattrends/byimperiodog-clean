"use client";

import { Share2, ImageIcon, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui";
import type { ShareablePuppy } from "@/lib/sharePuppy";
import { shareAsImage, shareLink, copyLink } from "@/lib/sharePuppy";

type Action = "share" | "image" | "copy";

type Props = {
  puppy: ShareablePuppy;
};

export default function ShareCTA({ puppy }: Props) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);

  const runAction = async (action: Action) => {
    setStatusMessage(null);
    setBusy(action);
    try {
      if (action === "share") {
        await shareLink(puppy);
        setStatusMessage("Compartilhado com sucesso.");
      } else if (action === "image") {
        await shareAsImage(puppy);
        setStatusMessage("Cartão pronto para compartilhar.");
      } else {
        await copyLink(puppy);
        setStatusMessage("Link copiado.");
      }
    } catch {
      setStatusMessage("Não foi possível completar essa ação.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-zinc-200 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">Compartilhar</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          variant="outline"
          size="md"
          className="gap-2 rounded-full"
          onClick={() => runAction("share")}
          disabled={busy === "share"}
          aria-label={`Compartilhar ${puppy.name}`}
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Compartilhar
        </Button>
        <Button
          variant="outline"
          size="md"
          className="gap-2 rounded-full"
          onClick={() => runAction("image")}
          disabled={busy === "image"}
          aria-label={`Compartilhar como imagem ${puppy.name}`}
        >
          <ImageIcon className="h-4 w-4" aria-hidden />
          Compartilhar como imagem
        </Button>
        <Button
          variant="ghost"
          size="md"
          className="gap-2 rounded-full border border-transparent"
          onClick={() => runAction("copy")}
          disabled={busy === "copy"}
          aria-label={`Copiar link do ${puppy.name}`}
        >
          <Link2 className="h-4 w-4" aria-hidden />
          Copiar link
        </Button>
      </div>
      {statusMessage && (
        <p className="text-xs text-zinc-600" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </div>
  );
}
