// Upload validation helpers (edge-safe)
// Keep this file free of Node-only imports (fs, sharp, etc.) so it can be used on Edge/runtime.

export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export const MAX_IMAGE_BYTES = 5_000_000; // 5 MB

export function isAllowedImage(mime: string, sizeBytes: number): boolean {
  return ALLOWED_IMAGE_MIME.has(mime) && sizeBytes > 0 && sizeBytes <= MAX_IMAGE_BYTES;
}

export function sanitizeFilename(name: string): string {
  // keep only safe chars; avoid path traversal; normalize spaces
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_');
  return base.slice(0, 160) || 'file';
}

export function inferExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };
  return map[mime] || 'bin';
}
