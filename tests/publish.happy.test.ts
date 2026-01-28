import { describe, it, expect, vi } from 'vitest';

import { POST as publishPost } from '../app/api/admin/blog/publish/route';

import { makeNextRequestStub } from './helpers/nextRequestStub';

vi.mock('@/lib/sanity/client', () => {
 const now = new Date().toISOString();
 return {
 sanityClient: {
 fetch: vi.fn(async (query: string) => {
 if (query.includes('[0]._id')) return 'p1';
 if (query.includes('_id == $id')) {
 return { _id: 'p1', slug: { current: 'post-1' }, status: 'published', publishedAt: now, _updatedAt: now, title: 'Hello' };
 }
 return null;
 }),
 patch: vi.fn(() => {
 const chain = {
 set: () => chain,
 setIfMissing: () => chain,
 commit: () => Promise.resolve(),
 };
 return chain;
 }),
 },
 };
});

describe('publish endpoint happy path', () => {
 it('publica por id', async () => {
 process.env.ADMIN_TOKEN = 'secret';
 process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
 const req = makeNextRequestStub('http://localhost/api/admin/blog/publish', { method: 'POST', headers: { 'x-admin-token': 'secret', 'content-type': 'application/json' }, body: { id: 'p1' } });
 // req já possui shape mínimo de NextRequest via helper
 const res = await publishPost(req as unknown as import('next/server').NextRequest);
 expect(res.status).toBe(200);
 const json = await res.json();
 expect(json.ok).toBe(true);
 expect(json.post.status).toBe('published');
 });
});
