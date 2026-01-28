import { expect, vi } from 'vitest';

// Import dinâmico para evitar conflito de tipos estritos
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jestDomMatchers = require('@testing-library/jest-dom/matchers');
expect.extend(jestDomMatchers);

if (!HTMLElement.prototype.scrollIntoView) {
 // eslint-disable-next-line @typescript-eslint/no-empty-function
 HTMLElement.prototype.scrollIntoView = function scrollIntoViewMock() {};
}

// Mock supabaseAdmin globalmente para o ambiente de teste.
// Fornece respostas determinísticas para `site_settings` e ecoa o payload de `upsert`.
vi.mock('@/lib/supabaseAdmin', () => ({
 supabaseAdmin: () => ({
 from: (table: string) => ({
 select: () => ({
 eq: (_col: string, _val: any) => ({
 single: async () => {
 if (table === 'site_settings') {
 return {
 data: {
 id: 1,
 gtm_id: null,
 ga4_id: 'G-TEST12345',
 meta_pixel_id: '1234567890',
 tiktok_pixel_id: null,
 pinterest_tag_id: null,
 hotjar_id: null,
 clarity_id: null,
 },
 error: null,
 };
 }
 return { data: null, error: null };
 },
 }),
 }),
 upsert: (payload: any) => ({
 select: () => ({
 single: async () => ({ data: { ...payload }, error: null }),
 }),
 }),
 }),
 }),
 hasServiceRoleKey: () => true,
}));
