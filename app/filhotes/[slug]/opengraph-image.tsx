import { ImageResponse } from "next/og";

import { BRAND } from "@/domain/config";
import { formatPuppyMeta } from "@/domain/puppyMeta";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { formatCurrency, getStatusLabel } from "@/lib/sharePuppy";
import { supabasePublic } from "@/lib/supabasePublic";

export const runtime = "edge";

const STATUS_COLORS: Record<string, string> = {
  Disponível: "#10b981",
  Reservado: "#f97316",
  Vendido: "#9333ea",
  Indisponível: "#ef4444",
};

async function fetchPuppy(identifier: string) {
  const sb = supabasePublic();
  const { data: bySlug } = await sb.from("puppies").select("*").eq("slug", identifier).maybeSingle();
  if (bySlug) return normalizePuppyFromDB(bySlug);
  const { data: byId } = await sb.from("puppies").select("*").eq("id", identifier).maybeSingle();
  if (byId) return normalizePuppyFromDB(byId);
  return null;
}

export async function GET(_req: Request, { params }: { params: { slug?: string } }) {
  const slug = params?.slug;
  if (!slug) {
    return new Response("Slug ausente", { status: 400 });
  }

  const puppy = await fetchPuppy(slug);
  if (!puppy) {
    return new Response("Filhote não encontrado", { status: 404 });
  }

  const statusLabel = getStatusLabel(puppy.status);
  const badgeColor = STATUS_COLORS[statusLabel] ?? STATUS_COLORS.Disponível;
  const priceLabel = formatCurrency(puppy.priceCents);
  const meta = formatPuppyMeta(puppy);
  const colorSex = meta.combinedLabel ?? `${puppy.color} • ${puppy.sex === "female" ? "Fêmea" : "Macho"}`;
  const location = [puppy.city, puppy.state].filter(Boolean).join(" • ");
  const heroImage = puppy.images?.[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "stretch",
          padding: 48,
          boxSizing: "border-box",
          background: "#0f172a",
          color: "#f8fafc",
          fontFamily: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              padding: "6px 18px",
              borderRadius: 999,
              border: `1px solid ${badgeColor}`,
              background: `${badgeColor}20`,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            {statusLabel}
          </span>
          <div>
            <div
              style={{
                fontSize: 70,
                fontWeight: 700,
                lineHeight: 1.05,
              }}
            >
              {puppy.name}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 42,
                fontWeight: 600,
              }}
            >
              {priceLabel}
            </div>
          </div>
          <div>
            {location && (
              <div style={{ fontSize: 24, color: "#e2e8f0" }}>{location}</div>
            )}
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 500 }}>{colorSex}</div>
          </div>
          <div style={{ fontSize: 18, color: "#cbd5f5" }}>{BRAND.name}</div>
        </div>
        <div
          style={{
            width: 420,
            borderRadius: 36,
            overflow: "hidden",
            background: heroImage ? `url(${heroImage}) center/cover no-repeat` : "linear-gradient(180deg, #1e293b, #020617)",
            position: "relative",
          }}
        >
          {!heroImage && (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                color: "#e0f2fe",
                padding: 24,
              }}
            >
              <span style={{ fontSize: 24, letterSpacing: 1.2, fontWeight: 600 }}>Vídeo disponível</span>
              <span style={{ textAlign: "center", fontSize: 16 }}>Chame no WhatsApp para ver agora</span>
            </div>
          )}
          {heroImage && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(15,23,42,0.2), rgba(2,6,23,0.85))",
              }}
            />
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

// Next expects a default export for some runtime entry points; re-export the GET handler as default.
export default GET;
