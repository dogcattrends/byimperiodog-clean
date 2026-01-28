import { describe, it, expect, vi } from 'vitest';

import { getRelatedPosts, scoreRelatedPost } from '../../src/lib/relatedPosts';

vi.mock('@/lib/sanity/client', () => {
 return {
 sanityClient: {
 fetch: vi.fn(async (query: string) => {
 if (query.includes('slug.current == $slug')) return basePost;
 if (query.includes('slug.current != $slug')) return candidates;
 return null;
 }),
 },
 };
});

const basePost = {
 _id: '1',
 slug: { current: 'post-base' },
 status: 'published',
 publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
 category: null,
 categories: [{ slug: 'saude', title: 'Saúde' }],
};

const candidates = [
 {
 _id: '2',
 slug: { current: 'post-recente-same-cat' },
 title: 'A',
 description: '',
 publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
 category: null,
 categories: [{ slug: 'saude', title: 'Saúde' }],
 author: { name: 'Ana', slug: 'ana' },
 },
 {
 _id: '3',
 slug: { current: 'post-antigo-outra-cat' },
 title: 'B',
 description: '',
 publishedAt: new Date(Date.now() - 50 * 86400000).toISOString(),
 category: null,
 categories: [{ slug: 'nutricao', title: 'Nutrição' }],
 },
];

describe('relatedPosts', () => {
 it('rankeia candidatos por categoria compartilhada + recência', async () => {
 const related = await getRelatedPosts('post-base', 5);
 expect(related.length).toBeGreaterThan(0);
 expect(related[0].slug).toBe('post-recente-same-cat');
 });
 it('scoreRelatedPost prioriza categorias compartilhadas', () => {
 const baseCats = ['saude'];
 const recentSame = { published_at: new Date().toISOString(), categories: ['saude'] };
 const recentDifferent = { published_at: new Date().toISOString(), categories: ['nutricao'] };
 const s1 = scoreRelatedPost(baseCats, recentSame);
 const s2 = scoreRelatedPost(baseCats, recentDifferent);
 expect(s1).toBeGreaterThan(s2);
 });
});
