export interface RawPuppy {
  id?: string;
  codigo?: string;
  nome?: string | null;
  name?: string | null;
  gender?: 'male' | 'female';
  status?: 'disponivel' | 'reservado' | 'vendido';
  color?: string | null;
  price_cents?: number;
  nascimento?: string | null;
  image_url?: string | null;
  descricao?: string | null;
  notes?: string | null;
  video_url?: string | null;
  midia?: string[];
  media?: string[]; // legacy alias
  description?: string | null; // legacy alias
  cor?: string | null; // legacy alias
}

export interface PuppyDTO {
  id?: string;
  codigo?: string;
  nome: string;
  gender: 'male' | 'female';
  status: 'disponivel' | 'reservado' | 'vendido';
  color: string;
  price_cents: number;
  nascimento?: string | null;
  image_url?: string | null;
  descricao?: string | null;
  notes?: string | null;
  video_url?: string | null;
  midia: string[];
}

export function normalizePuppy(raw: RawPuppy): PuppyDTO {
  const nome = (raw.nome ?? raw.name ?? '').trim();
  const midia = (raw.midia || raw.media || []).filter(Boolean);
  const cover = raw.image_url || midia[0] || null;
  const ordered = cover ? [cover, ...midia.filter(u => u !== cover)] : midia;
  return {
    id: raw.id,
    codigo: raw.codigo || undefined,
    nome,
    gender: raw.gender === 'male' ? 'male' : 'female',
    status: (raw.status && ['disponivel','reservado','vendido'].includes(raw.status)) ? raw.status as any : 'disponivel',
    color: (raw.color || raw.cor || '').trim(),
    price_cents: raw.price_cents || 0,
    nascimento: raw.nascimento || null,
    image_url: cover || null,
    descricao: raw.descricao || raw.description || null,
    notes: raw.notes || null,
    video_url: raw.video_url || null,
    midia: ordered,
  };
}
