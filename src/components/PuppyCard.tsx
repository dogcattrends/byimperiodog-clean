"use client";

import { ChevronRight, Heart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { PUPPY_CARD_SIZES } from "@/lib/image-sizes";
import track from "@/lib/track";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Puppy = {
  id: string;
  nome?: string | null;
  name?: string | null;
  cor?: string | null;
  color?: string | null;
  gender?: "male" | "female" | string | null;
  status?: "disponivel" | "reservado" | "vendido" | string | null;
  price_cents?: number | null;
  priceCents?: number | null;
};

function fmtPrice(cents?: number | null) {
  return typeof cents === "number"
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(cents / 100)
    : "Sob consulta";
}

const statusClass: Record<string, string> = {
  disponivel: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  reservado: "bg-amber-100 text-amber-800 ring-amber-300",
  vendido: "bg-rose-100 text-rose-800 ring-rose-300",
};

function buildWaLink(action: "info" | "video" | "visit", name: string, color: string, gender: string) {
  const messageMap: Record<typeof action, string> = {
    info: `Ola! Vi o filhote ${name} (${color}, ${gender}) e quero entender disponibilidade, valor e condicoes.`,
    video: `Ola! Pode me enviar video atualizado do filhote ${name} (${color}, ${gender})?`,
    visit: `Ola! Quero agendar visita para conhecer o filhote ${name} (${color}, ${gender}).`,
  };

  return buildWhatsAppLink({
    message: messageMap[action],
    utmSource: "site",
    utmMedium: "grid_filhotes",
    utmCampaign: "puppies_cta",
    utmContent: action,
  });
}

export default function PuppyCard({ p, cover, onOpen }: { p: Puppy; cover?: string; onOpen?: () => void }) {
  const name = p.nome || p.name || "Filhote";
  const color = p.cor || p.color || "cor em avaliacao";
  const gender = p.gender === "male" ? "macho" : p.gender === "female" ? "femea" : "sexo em avaliacao";
  const price = fmtPrice(p.priceCents ?? p.price_cents);

  const label = p.status === "vendido" ? "Vendido" : p.status === "reservado" ? "Reservado" : "Disponivel";

  const waInfo = buildWaLink("info", name, color, gender);
  const waVideo = buildWaLink("video", name, color, gender);
  const waVisit = buildWaLink("visit", name, color, gender);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm ring-1 ring-transparent transition-all duration-200 hover:shadow-lg hover:ring-[var(--brand)]/20">
      {/* ================================================================ */}
      {/* IMAGEM 4:3 Otimizada (aspect-[4/3] maior e centralizada) */}
      {/* ================================================================ */}
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          track.event?.("open_details", { placement: "card", puppy_id: p.id });
        }}
        className="relative block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
        data-evt="card_click"
        data-id={p.id}
        aria-label={`Ver detalhes de ${name}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
          {!imgLoaded && cover ? <div className="absolute inset-0 animate-pulse bg-zinc-200" /> : null}
          {cover ? (
            <>
              <Image
                src={cover}
                alt={`Filhote Spitz Alemão ${name} - ${color}, ${gender}, ${label.toLowerCase()}`}
                fill
                sizes={PUPPY_CARD_SIZES}
                loading="lazy"
                className={`object-cover transition-all duration-300 ${imgLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"}`}
                onLoad={() => setImgLoaded(true)}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjRmNGY1Ii8+PC9zdmc+"
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-zinc-400">Sem imagem</div>
          )}

          {/* Badges - Melhor contraste */}
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 backdrop-blur-sm transition-all duration-200 ${statusClass[p.status || "disponivel"]}`}
          >
            {label}
          </span>

          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200">
            {price}
          </span>

          {/* Botão de Favoritar - Tap target ≥48px */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLiked((prev) => !prev);
              track.event?.("puppy_like_toggle", { puppy_id: p.id, liked: !liked, placement: "grid" });
            }}
            aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className="absolute bottom-3 right-3 z-10 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white/95 p-2 text-rose-500 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-rose-500" : "fill-none"}`} aria-hidden="true" />
          </button>
        </div>
      </button>

      {/* ================================================================ */}
      {/* CONTEÚDO - line-clamp e espaçamento */}
      {/* ================================================================ */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-zinc-800">{name}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {color} • {gender}
          </p>
        </div>

        {/* CTA Principal - Tap target ≥48px */}
        <a
          href={waInfo}
          target="_blank"
          rel="noopener noreferrer"
          data-evt="share_click"
          data-id={`wa_info_${p.id}`}
          onClick={() => track.event?.("whatsapp_click", { placement: "card", action: "info", puppy_id: p.id })}
          className="mt-auto flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[var(--brand)]/90 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
          title="Conversar sobre este filhote no WhatsApp"
        >
          Quero esse filhote
        </a>

        {/* CTAs Secundários - Tap targets ≥48px */}
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold" data-evt="share_click" data-id={p.id}>
          <a
            href={waVideo}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track.event?.("whatsapp_click", { placement: "card", action: "video", puppy_id: p.id })}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-200 px-2 py-2.5 text-zinc-700 transition-all duration-200 hover:bg-zinc-50 hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
            title="Pedir vídeo do filhote"
          >
            Vídeo
          </a>

          <a
            href={waVisit}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track.event?.("whatsapp_click", { placement: "card", action: "visit", puppy_id: p.id })}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-200 px-2 py-2.5 text-zinc-700 transition-all duration-200 hover:bg-zinc-50 hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
            title="Agendar visita"
          >
            Visita
          </a>

          <button
            type="button"
            onClick={() => {
              onOpen?.();
              track.event?.("open_details", { placement: "card", puppy_id: p.id });
            }}
            className="flex min-h-[44px] items-center justify-center gap-1 rounded-lg border border-zinc-200 px-2 py-2.5 text-zinc-800 transition-all duration-200 hover:bg-zinc-50 hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1"
            data-evt="card_click"
            data-id={p.id}
            title="Ver detalhes completos"
          >
            Ver <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-zinc-500">
          Criado com acompanhamento veterinário, socialização guiada e mentoria vitalícia.
        </p>
      </div>
    </article>
  );
}
