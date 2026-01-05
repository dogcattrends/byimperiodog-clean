import * as React from 'react';
import { vi } from 'vitest';

// Ensure React is available globally for environments that expect it
(globalThis as any).React = React;

// Load jest-dom matchers dynamically and extend Vitest's expect.
// Use top-level await so this runs before tests start.
const _matchersMod = await import('@testing-library/jest-dom/matchers');
const _matchers = (_matchersMod && (_matchersMod as any).default) ? ( _matchersMod as any).default : _matchersMod;
const { expect: _expect } = await import('vitest');
_expect.extend(_matchers as any);

// Allow pointer interactions by default in the test DOM
if (typeof document !== 'undefined' && document.body) {
  document.body.style.pointerEvents = 'auto';
}

const site_settings = {
  id: 1,
  weekly_post_goal: 3,
  ga4_id: 'G-TEST12345',
  meta_pixel_id: '1234567890',
  robots_allow_indexing: true,
};

vi.stubGlobal('supabaseAdmin', () => {
  return {
    from: (table: string) => ({
      select: () => ({
        single: async () => ({ data: table === 'site_settings' ? site_settings : null, error: null }),
      }),
      upsert: (payload: any) => ({
        select: () => ({ single: async () => ({ data: payload, error: null }) }),
      }),
    }),
    hasServiceRoleKey: () => true,
  };
});

export {};
