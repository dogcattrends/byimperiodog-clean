"use client";

import { ChevronRight, Heart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import track from "@/lib/track";


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

// Número oficial atualizado
const WA_BASE = (process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/551196863239").replace(/\?.*$/, "");
// SITE_URL não é mais necessário para construir link da foto (foto removida da mensagem)
// const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br";

function fmtPrice(cents?: number | null) {
  return typeof cents === "number"
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
        cents / 100
      )
    : "Sob consulta";
}

const statusClass: Record<string, string> = {
  disponivel: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  reservado: "bg-amber-100 text-amber-800 ring-amber-300",
  vendido: "bg-rose-100 text-rose-800 ring-rose-300",
};

function buildWaLink({ action, name, color, gender }: { action: "info" | "video" | "visit"; name: string; color: string; gender: string }) {
  const base = `Olá! Vi o filhote ${name} (${color}, ${gender}) e gostaria de saber disponibilidade, valor e condições.`;
  const variants: Record<string,string> = {
    info: base,
    video: `Olá! Pode enviar vídeo atual do filhote ${name} (${color}, ${gender})?` ,
    visit: `Olá! Quero agendar visita para conhecer o filhote ${name} (${color}, ${gender}).`
  };
  return `${WA_BASE}?text=${encodeURIComponent(variants[action])}`;
}

export default function PuppyCard({ p, cover, onOpen }: { p: Puppy; cover?: string; onOpen?: () => void }) {
  const name = p.nome || p.name || "Filhote";
  const color = p.cor || p.color || "Cor indefinida";
  const gender = p.gender === "male" ? "Macho" : p.gender === "female" ? "Fêmea" : "Sexo indefinido";
  const price = fmtPrice(p.priceCents ?? p.price_cents);

  const label = p.status === "vendido" ? "Vendido" : p.status === "reservado" ? "Reservado" : "Disponível";

  const waInfo = buildWaLink({ action: "info", name, color, gender });
  const waVideo = buildWaLink({ action: "video", name, color, gender });
  const waVisit = buildWaLink({ action: "visit", name, color, gender });

  const [imgLoaded, setImgLoaded] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
  <article className="u-hover-card u-fade-in group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-md">
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          track.event?.("open_details", { placement: "card", puppy_id: p.id });
        }}
        className="block w-full text-left focus:outline-none"
        data-evt="card_click"
        data-id={p.id}
        aria-label={`Ver detalhes de ${name}`}
      >
  <div className="relative aspect-[9/16] w-full min-h-[180px] overflow-hidden bg-zinc-100">
          {!imgLoaded && cover && <div className="absolute inset-0 animate-pulse bg-zinc-200" />}
          {cover ? (
            <>
              <Image
                src={cover}
                alt={`Filhote ${name} | ${color}, ${gender}`}
                fill
                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                loading="lazy"
                className={`object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImgLoaded(true)}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08),transparent_60%)]" />
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-zinc-400">
              <span className="text-sm">Sem imagem</span>
            </div>
          )}

          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-all duration-200 ${statusClass[p.status || "disponivel"]}`}>
            {label}
          </span>

          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-900 shadow ring-1 ring-black/10 transition-all duration-200">
            {price}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLiked((prev) => !prev);
              track.event?.("puppy_like_toggle", { puppy_id: p.id, liked: !liked });
            }}
            aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className="absolute bottom-3 right-3 z-10 rounded-full bg-white/90 p-1.5 text-rose-500 shadow ring-1 ring-black/10 transition-all duration-200 hover:scale-110 hover:bg-white"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-rose-500" : "fill-none"}`} />
          </button>
        </div>
      </button>

      <div className="space-y-2 p-5">
        <h3 className="text-lg font-semibold text-zinc-800">{name}</h3>
        <p className="text-sm text-zinc-500">{color} • {gender}</p>

        <a
          href={waInfo}
          target="_blank"
          rel="noopener noreferrer"
          data-evt="share_click"
          data-id={`wa_info_${p.id}`}
          onClick={() => track.event?.("whatsapp_click", { placement: "card", action: "info", puppy_id: p.id })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          title="Conversar sobre este filhote no WhatsApp"
        >
          Quero esse filhote!
        </a>

        <div className="mt-3 grid grid-cols-3 gap-2 text-sm font-medium" data-evt="share_click" data-id={p.id}>
          <a
            href={waVideo}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track.event?.("whatsapp_click", { placement: "card", action: "video", puppy_id: p.id })}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 transition hover:bg-zinc-100"
            title="Pedir vídeo do filhote"
          >
            Vídeo
          </a>

          <a
            href={waVisit}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track.event?.("whatsapp_click", { placement: "card", action: "visit", puppy_id: p.id })}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 transition hover:bg-zinc-100"
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
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-800 transition hover:bg-zinc-100"
            data-evt="card_click"
            data-id={p.id}
            title="Ver detalhes"
          >
            Ver <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <p className="pt-3 text-xs italic leading-relaxed tracking-tight text-zinc-500">
          Criado com amor, vacinado e pronto para encher seu lar de alegria.
        </p>
      </div>
    </article>
  );
}
