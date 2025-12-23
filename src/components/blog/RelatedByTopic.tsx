import Link from 'next/link';
import React from 'react';

import { getPostsByTag } from '@/lib/blog/related';

type Props = { tag: string; currentSlug?: string; limit?: number };

export default async function RelatedByTopic({ tag, currentSlug, limit = 6 }: Props) {
  const posts = await getPostsByTag(tag, limit + 2);
  const filteredRaw = posts.filter((p) => {
    const row = p as unknown as Record<string, unknown>;
    return String(row.slug ?? '') !== String(currentSlug ?? '');
  }).slice(0, limit);

  const filtered = filteredRaw.map((p) => {
    const row = p as unknown as Record<string, unknown>;
    return {
      slug: String(row.slug ?? ''),
      title: String(row.title ?? ''),
      excerpt: row.excerpt ? String(row.excerpt) : undefined,
    };
  });

  if (!filtered.length) return null;

  return (
    <section aria-labelledby="related-topic" className="mt-10">
      <h3 id="related-topic" className="mb-4 text-lg font-semibold">Mais sobre «{tag}»</h3>
      <ul className="space-y-3">
        {filtered.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}?utm_source=related&utm_medium=internal&utm_campaign=topic-${encodeURIComponent(tag)}`} className="text-sm font-medium text-brand hover:underline">
              {p.title}
            </Link>
            {p.excerpt ? <p className="text-xs text-text-muted">{p.excerpt}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
