export type ShareablePuppy = {
 id: string;
 slug?: string | null;
 name: string;
 color?: string | null;
 sex?: string | null;
 priceCents?: number | null;
 city?: string | null;
 state?: string | null;
 status?: string | null;
};

function fmtPriceFromCents(cents?: number | null) {
 if (typeof cents !== 'number') return 'Sob consulta';
 return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCurrency(cents?: number | null) {
 return fmtPriceFromCents(cents);
}

function sexoLabel(sex?: string | null) {
 if (!sex) return 'Sexo a definir';
 const s = String(sex).toLowerCase();
 if (s === 'male' || s === 'macho') return 'Macho';
 if (s === 'female' || s === 'femea' || s === 'fêmea') return 'Fêmea';
 return 'Sexo a definir';
}

export function getStatusLabel(status?: string | null) {
 if (!status) return 'Disponível';
 const s = String(status).toLowerCase();
 if (s === 'available' || s === 'disponivel' || s === 'disponível') return 'Disponível';
 if (s === 'reserved' || s === 'reservado') return 'Reservado';
 if (s === 'sold' || s === 'vendido') return 'Vendido';
 return 'Disponível';
}

export function buildPuppyShareUrl(slugOrId: string, medium: string) {
 const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
 const q = `?utm_source=share&utm_medium=${encodeURIComponent(medium)}&utm_campaign=puppy_share&utm_content=${encodeURIComponent(slugOrId)}`;
 const path = `/filhotes/${encodeURIComponent(slugOrId)}`;
 return `${origin}${path}${q}`;
}

export async function sharePuppy(puppy: ShareablePuppy, location: 'card' | 'modal') {
 const slugOrId = puppy.slug ?? puppy.id;
 const url = buildPuppyShareUrl(slugOrId, location);
 const title = `Filhote ${puppy.name}`;
 const text = `${puppy.name} • ${puppy.color ?? 'Cor a definir'} • ${sexoLabel(puppy.sex)} • ${fmtPriceFromCents(puppy.priceCents)}. Veja: ${url}`;

 console.warn('share_puppy', { id: puppy.id, slug: puppy.slug ?? null, location, method: 'attempt' });

 try {
 if (typeof navigator !== 'undefined') {
 const nav = navigator as unknown as {
 share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
 canShare?: (data: { title?: string; text?: string; url?: string }) => boolean;
 };
 if (nav.share) {
 const fullData = { title, text, url };
 let shareData: { title?: string; text?: string; url?: string } = fullData;
 if (nav.canShare && !nav.canShare(fullData)) {
 const minimalData = { title, url };
 const urlOnly = { url };
 if (nav.canShare(minimalData)) {
 shareData = minimalData;
 } else if (nav.canShare(urlOnly)) {
 shareData = urlOnly;
 }
 }
 await nav.share(shareData);
 console.warn('share_puppy', { id: puppy.id, slug: puppy.slug ?? null, location, method: 'webshare' });
 return { method: 'webshare' };
 }
 }
 } catch (err) {
 // if web share exists but fails, continue to clipboard fallback
 console.warn('share_puppy', { id: puppy.id, slug: puppy.slug ?? null, location, method: 'webshare_error', error: String(err) });
 }

 // Clipboard fallback
 try {
 if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
 await navigator.clipboard.writeText(url);
 console.warn('share_puppy', { id: puppy.id, slug: puppy.slug ?? null, location, method: 'copy' });
 return { method: 'copy', url };
 }
 } catch (err) {
 console.warn('share_puppy', { id: puppy.id, slug: puppy.slug ?? null, location, method: 'copy_error', error: String(err) });
 }

 // If clipboard not available or failed, return fallback so caller can show UI
 return { method: 'fallback', url };
}

// Legacy helpers for compatibility
export async function shareLink(puppy: ShareablePuppy, location: 'card' | 'modal' = 'card') {
 return sharePuppy(puppy, location);
}

export async function copyLink(puppy: ShareablePuppy, location: 'card' | 'modal' = 'card') {
 const slugOrId = puppy.slug ?? puppy.id;
 const url = buildPuppyShareUrl(slugOrId, location);
 if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
 await navigator.clipboard.writeText(url);
 console.warn('share_puppy', { id: puppy.id, slug: puppy.slug ?? null, location, method: 'copy' });
 return { method: 'copy', url };
 }
 return { method: 'fallback', url };
}

export async function shareAsImage(puppy: ShareablePuppy) {
 // Placeholder: complex image share not implemented here. Caller can implement capture logic.
 console.warn('share_puppy_image_attempt', { id: puppy.id, slug: puppy.slug ?? null });
 return { method: 'unsupported' };
}
