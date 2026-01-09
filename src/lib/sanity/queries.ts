export const SANITY_POST_LIST_FIELDS = `
  _id,
  title,
  description,
  slug,
  publishedAt,
  status,
  coverUrl,
  coverImage { asset->{url} },
  mainImage { asset->{url} },
  category,
  categories[]->{title, "slug": slug.current},
  tags,
  author->{_id, name, slug, "avatar_url": image.asset->url},
  _createdAt,
  _updatedAt,
`;

export const SANITY_POST_DETAIL_FIELDS = `
  ${SANITY_POST_LIST_FIELDS}
  answerSnippet,
  tldr,
  keyTakeaways,
  faq,
  sources,
  content,
  body,
`;
