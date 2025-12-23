import type { Puppy } from "./types";

// Aceita snake_case do banco e normaliza para o app
export function mapRowToPuppy(row: unknown): Puppy {
  const r = row as Record<string, unknown>;
  const midiaRaw = r?.midia ?? r?.images ?? [];
  const media = Array.isArray(midiaRaw) ? (midiaRaw as unknown[]) : typeof midiaRaw === 'string' ? JSON.parse(String(midiaRaw)) : [];
  const mediaUrls = Array.isArray(media) ? (media as unknown[])
    .map((item) => (typeof item === 'string' ? item : ((item as Record<string, unknown>)?.url as string | undefined)))
    .filter((u): u is string => typeof u === 'string' && !!u)
    : [];
  const first = mediaUrls[0] ?? (r?.image_url as string) ?? "/placeholder.webp";

  const name = (r.nome as string) ?? (r.name as string) ?? "Filhote";
  const color = (r.cor as string) ?? (r.color as string) ?? null;
  const rawGender = String(r.gender ?? r.sexo ?? r.sex ?? '').toLowerCase();
  const gender = rawGender.startsWith('f') ? 'female' : rawGender.startsWith('m') ? 'male' : null;
  const rawPrice = (r.price_cents as number) ?? (r.preco_cents as number) ?? (r.preco as number) ?? null;
  const priceCents = rawPrice == null ? null : Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : null;
  const rawStatus = String((r.status as string) ?? 'disponivel').toLowerCase();
  const status = rawStatus === 'reservado' ? 'reservado' : rawStatus === 'vendido' ? 'vendido' : 'disponivel';

  return {
    id: String(r.id ?? r._id ?? ''),
    name,
    color,
    gender,
    priceCents,
    status: status as Puppy['status'],
    imageUrl: first,
    createdAt: (r.created_at as string) ?? null,

    // extras para o modal
    descricao: (r.descricao as string) ?? null,
    nascimento: (r.nascimento as string) ?? null,
    delivery: (r.delivery as string) ?? null,
    midia: mediaUrls.length > 0 ? mediaUrls : null,
  };
}

// Extrai URLs de imagem de um campo "midia" heterogêneo
export function extractImageUrls(midia: unknown): string[] {
  if (Array.isArray(midia)) {
    return (midia as unknown[]).filter((u): u is string => typeof u === "string" && !!u);
  }
  if (typeof midia === "string") {
    try {
      const parsed = JSON.parse(midia);
      if (Array.isArray(parsed)) {
        return parsed.filter((u): u is string => typeof u === "string" && !!u);
      }
    } catch {
      // retorna string única se parecer URL
      if (/^https?:\/\//.test(midia)) return [midia];
    }
  }
  return [];
}
