import { BRAND } from '@/domain/config';
import type { Puppy } from '@/domain/puppy';
import { formatPuppyMeta } from '@/domain/puppyMeta';
import { logEvent } from '@/lib/analytics';
import { canonical } from '@/lib/seo.core';

export type ShareablePuppy = {
  id: string;
  slug?: string | null;
  name: string;
  color?: string | null;
  sex?: string | null;
  city?: string | null;
  state?: string | null;
  priceCents?: number | null;
  status?: string | null;
};

const SHARE_UTM_SOURCE = 'site';
const SHARE_UTM_MEDIUM = 'share';
const SHARE_UTM_CAMPAIGN = 'puppy';

const slugSegment = (puppy: ShareablePuppy) => (puppy.slug && puppy.slug.trim() ? puppy.slug.trim() : puppy.id);

export const formatCurrency = (cents?: number | null) =>
  typeof cents === 'number'
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cents / 100)
    : 'Sob consulta';

const STATUS_MAP: Record<string, string> = {
  available: 'Disponível',
  disponivel: 'Disponível',
  reservado: 'Reservado',
  reserved: 'Reservado',
  sold: 'Vendido',
  vendido: 'Vendido',
  pending: 'Reservado',
  unavailable: 'Indisponível',
  indisponivel: 'Indisponível',
};

export const getStatusLabel = (status?: string | null) => {
  if (!status) return 'Disponível';
  const normalized = status.toLowerCase().trim();
  return STATUS_MAP[normalized] ?? STATUS_MAP[normalized.replace(/[^a-z]/gi, '')] ?? 'Disponível';
};

const sanitizeFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_').slice(0, 48);

const shareTitle = (puppy: ShareablePuppy) => {
  const meta = formatPuppyMeta(puppy as unknown as Partial<Puppy>);
  const metaLabel = meta.combinedLabel ? ` • ${meta.combinedLabel}` : '';
  return `${puppy.name}${metaLabel} | ${BRAND.name}`;
};

const shareText = (puppy: ShareablePuppy) => {
  const meta = formatPuppyMeta(puppy as unknown as Partial<Puppy>);
  const ageLabel = meta.ageLabel ? ` • ${meta.ageLabel}` : '';
  const location = [puppy.city, puppy.state].filter(Boolean).join(' • ');
  const statusLabel = getStatusLabel(puppy.status);
  const priceLabel = formatCurrency(puppy.priceCents);
  const details = [meta.combinedLabel, location].filter(Boolean).join(' • ');
  return `Conheça ${puppy.name}${details ? ` • ${details}` : ''}${ageLabel}. ${priceLabel} • ${statusLabel} • Atendimento By ${BRAND.name}.`;
};

export const getPuppyShareUrl = (puppy: ShareablePuppy, origin?: string) => {
  const path = `/filhotes/${slugSegment(puppy)}`;
  const base = origin ? origin.replace(/\/$/, '') : canonical(path);
  const separator = base.includes('?') ? '&' : '?';
  const query = `utm_source=${SHARE_UTM_SOURCE}&utm_medium=${SHARE_UTM_MEDIUM}&utm_campaign=${SHARE_UTM_CAMPAIGN}&utm_content=${encodeURIComponent(slugSegment(puppy))}`;
  return `${base}${separator}${query}`;
};

export const getPuppyShareCard = (puppy: ShareablePuppy) => canonical(`/filhotes/${slugSegment(puppy)}/opengraph-image`);

const ensureWindow = () => {
  if (typeof window === 'undefined') {
    throw new Error('Operação disponível apenas no browser.');
  }
};

const logShare = (method: string, puppyId: string) => {
  logEvent('share', { method, puppyId });
};

export const shareLink = async (puppy: ShareablePuppy) => {
  const url = getPuppyShareUrl(puppy);
  const title = shareTitle(puppy);
  const text = shareText(puppy);
  try {
    ensureWindow();
    if (navigator.share) {
      await navigator.share({ title, text, url });
      logShare('native_link', puppy.id);
      return;
    }
    await copyLink(puppy);
  } catch (error) {
    logShare('native_link_error', puppy.id);
    throw error;
  }
};

const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

export const copyLink = async (puppy: ShareablePuppy) => {
  const url = getPuppyShareUrl(puppy);
  ensureWindow();
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
  } else {
    fallbackCopy(url);
  }
  logShare('copy_link', puppy.id);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
};

export const shareAsImage = async (puppy: ShareablePuppy) => {
  ensureWindow();
  const imageUrl = getPuppyShareCard(puppy);
  const response = await fetch(imageUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Não foi possível gerar o cartão visual.');
  }
  const blob = await response.blob();
  const fileName = `${sanitizeFileName(puppy.name)}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: shareTitle(puppy), text: shareText(puppy) });
      logShare('image_share', puppy.id);
      return;
    }
  } catch (error) {
    logShare('image_share_error', puppy.id);
  }
  downloadBlob(blob, fileName);
  logShare('image_download', puppy.id);
};
