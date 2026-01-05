import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

import { BRAND } from "@/domain/config";
import { formatPuppyMeta } from "@/domain/puppyMeta";
import { normalizePuppyFromDB } from "@/lib/catalog/normalize";
import { formatCurrency, getStatusLabel } from "@/lib/sharePuppy";
import { supabaseAnon } from "@/lib/supabaseAnon";

export const runtime = "edge";

const STATUS_COLORS: Record<string, string> = {
  Disponível: "#065f46",
  Reservado: "#92400e",
  Vendido: "#831843",
  Indisponível: "#b91c1c",
};

async function fetchPuppy(identifier: string) {
  const sb = supabaseAnon();
  const baseQuery = sb.from("puppies").select("*");
  const bySlug = await baseQuery.eq("slug", identifier).maybeSingle();
  if (bySlug.data) return bySlug.data;
  if (bySlug.error && bySlug.error.code) {
    // ignore: fallback to id
  }
  const byId = await sb.from("puppies").select("*").eq("id", identifier).maybeSingle();
  if (byId.data) return byId.data;
  return null;
}

export async function GET(req: Request, { params }: { params: { id?: string } }) {
  const identifier = params?.id;
  if (!identifier) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  try {
    const raw = await fetchPuppy(identifier);
    if (!raw) {
      return new NextResponse(`Filhote ${identifier} não encontrado`, { status: 404 });
    }
    const puppy = normalizePuppyFromDB(raw);
    const meta = formatPuppyMeta(puppy);
    const statusLabel = getStatusLabel(puppy.status);
    const badgeColor = STATUS_COLORS[statusLabel] || "#065f46";
    const priceLabel = formatCurrency(puppy.priceCents);
    const location = [puppy.city, puppy.state].filter(Boolean).join(" • ");
    const colorSexLabel = meta.combinedLabel || `${puppy.color} • ${puppy.sex === "female" ? "Fêmea" : "Macho"}`;
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
            background: "#f8fafc",
            fontFamily: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
            color: "#0f172a",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <span
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: badgeColor + "2b",
                  color: badgeColor,
                  fontSize: 16,
                  fontWeight: 600,
                  border: `1px solid ${badgeColor}`,
                }}
              >
                {statusLabel}
              </span>
              <div
                style={{
                  marginTop: 32,
                  fontSize: 68,
                  fontWeight: 700,
                  lineHeight: 1.05,
                }}
              >
                {puppy.name}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  marginTop: 24,
                }}
              >
                <span style={{ fontSize: 46, fontWeight: 600 }}>{priceLabel}</span>
                <span style={{ fontSize: 18, color: "#475569" }}>{location}</span>
              </div>
              <div style={{ marginTop: 16, fontSize: 28, color: "#0f172a" }}>{colorSexLabel}</div>
            </div>
            <div style={{ fontSize: 18, color: "#475569" }}>
              By {BRAND.name}
            </div>
          </div>
          <div
            style={{
              width: 420,
              borderRadius: 40,
              overflow: "hidden",
              background: heroImage ? `url(${heroImage}) center/cover no-repeat` : "#0f172a",
              position: "relative",
              boxShadow: "0 20px 55px rgba(15,23,42,0.35)",
            }}
          >
            {!heroImage && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  color: "#e0f2fe",
                }}
              >
                <div style={{ fontSize: 22, letterSpacing: 1.5 }}>Vídeo disponível</div>
                <div style={{ fontSize: 16 }}>Chame no WhatsApp para ver agora</div>
              </div>
            )}
            {heroImage && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(15,23,42,0.35), rgba(15,23,42,0.9))",
                }}
              />
            )}
            {!heroImage && (
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.8)",
                  backdropFilter: "blur(12px)",
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                Vídeo no WhatsApp • ver agora
              </div>
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error: any) {
    return new NextResponse(`Erro ao gerar cartão: ${error?.message ?? error}`, { status: 500 });
  }
}
