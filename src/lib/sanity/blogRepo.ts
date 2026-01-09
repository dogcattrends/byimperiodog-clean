/*
  SANITY USAGE GUIDELINES
  - Query helpers and repository functions should be exposed from
    `src/lib/sanity/blogRepo.ts` as `sanityBlogRepo`.
  - Keep all transformations from Sanity blocks to plain text here; do not
    duplicate the Portable Text body into Supabase storage.
  - Types coming from Sanity should live in `src/lib/sanity/*` and be
    prefixed with `Sanity` (e.g. `SanityPostDocument`).
*/

import type { PostContentInput } from "@/lib/db/schemas/blog";
import type { BlogBulkAction, BlogBulkResult, ListResult, Post, PostStatus } from "@/lib/db/types";
import type { SanityBlock } from "@/lib/sanity/blocks";
import { blocksToPlainText } from "@/lib/sanity/blocks";
import { sanityClient } from "@/lib/sanity/client";
import { SANITY_POST_DETAIL_FIELDS, SANITY_POST_LIST_FIELDS } from "@/lib/sanity/queries";

interface SanityPostDocument {
  _id: string;
  title?: string | null;
  description?: string | null;
  answerSnippet?: string | null;
  tldr?: string | null;
  publishedAt?: string | null;
  _createdAt?: string | null;
  _updatedAt?: string | null;
  slug?: { current?: string };
  coverImage?: { asset?: { url?: string } };
  mainImage?: { asset?: { url?: string } };
  coverUrl?: string | null;
  category?: string | null;
  categories?: Array<{ title?: string | null; slug?: string | null }> | null;
  tags?: string[] | null;
  content?: SanityBlock[];
  body?: SanityBlock[];
  // The Portable Text body lives here and must never be copied back to Supabase. Sanity is the canonical CMS (see docs/BLOG_ARCHITECTURE.md).
  status?: PostStatus;
  keyTakeaways?: string[] | null;
  faq?: Array<{ question?: string; answer?: string }> | null;
  sources?: Array<{ label?: string; url?: string }> | null;
  author?: {
    _id?: string;
    name?: string | null;
    slug?: { current?: string } | null;
    avatar_url?: string | null;
  };
}

type ListSummariesParams = {
  search?: string;
  status?: PostStatus;
  limit?: number;
  offset?: number;
  sort?: "recentes" | "antigos";
  tag?: string;
  category?: string;
  includeMetrics?: boolean;
  includePendingComments?: boolean;
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

const cachedAuthorId: { value?: string } = {};

function normalizeSearch(search?: string) {
  if (!search) return undefined;
  return search.trim();
}

function mapDocumentToPost(doc: SanityPostDocument): Post {
  const slug = doc.slug?.current ?? doc._id;
  const publishedAt = doc.publishedAt ?? null;
  const portableTextBlocks = (doc.content ?? doc.body ?? []) as SanityBlock[];
  const content = blocksToPlainText(portableTextBlocks);
  const firstCategory = Array.isArray(doc.categories) && doc.categories.length ? doc.categories[0] : null;
  const derivedCategory = doc.category ?? firstCategory?.slug ?? firstCategory?.title ?? null;
  return {
    id: doc._id,
    slug,
    title: doc.title ?? null,
    subtitle: null,
    excerpt: doc.description ?? null,
    content: content || null,
    status: doc.status ?? resolveStatus(doc),
    coverUrl: doc.coverUrl ?? doc.coverImage?.asset?.url ?? doc.mainImage?.asset?.url ?? null,
    coverAlt: null,
    category: derivedCategory
      ? {
          id: derivedCategory,
          slug: derivedCategory,
          title: derivedCategory,
          description: null,
          createdAt: null,
          updatedAt: null,
        }
      : null,
    tags: Array.isArray(doc.tags)
      ? doc.tags.map((tag) => ({
          id: tag,
          slug: tag,
          name: tag,
          createdAt: null,
          updatedAt: null,
        }))
      : [],
    seo: {
      title: doc.title ?? null,
      description: doc.description ?? null,
      ogImageUrl: doc.coverImage?.asset?.url ?? null,
      score: null,
    },
    scheduledAt: publishedAt && resolveStatus(doc) === "scheduled" ? publishedAt : null,
    publishedAt,
    createdAt: doc._createdAt ?? null,
    updatedAt: doc._updatedAt ?? null,
  };
}

// Compat layer: adiciona aliases em snake_case para reduzir quebras
// em código legado que ainda acessa propriedades como `published_at`.
function addSnakeCaseAliases(post: Post, extras?: Record<string, unknown>): Post & Record<string, unknown> {
  const p = { ...post } as Post & Record<string, unknown>;
  if (extras) Object.assign(p, extras);
  p.published_at = p.publishedAt ?? null;
  p.created_at = p.createdAt ?? null;
  p.updated_at = p.updatedAt ?? null;
  p.cover_url = p.coverUrl ?? null;
  p.cover_alt = p.coverAlt ?? null;
  p.key_takeaways = p.keyTakeaways ?? null;
  p.tldr = p.tldr ?? null;
  // `content_blocks` precisa ser Portable Text (array de blocks) para o `<PortableText />`.
  // Se vier do Sanity (extras), preserva; caso contrário, mantém null.
  if (typeof p.content_blocks === "undefined") {
    p.content_blocks = null;
  }
  return p;
}

function resolveStatus(doc: SanityPostDocument): PostStatus {
  if (doc.status) return doc.status;
  if (!doc.publishedAt) return "draft";
  const publishedTs = Date.parse(doc.publishedAt);
  if (Number.isNaN(publishedTs)) return "draft";
  return publishedTs > Date.now() ? "scheduled" : "published";
}

async function ensureAuthorId() {
  if (cachedAuthorId.value) return cachedAuthorId.value;
  const id = await sanityClient.fetch<string | null>(
    `*[_type == "author"][0]._id`
  );
  if (!id) {
    throw new Error("Nenhum autor cadastrado no Sanity. Crie um documento de autor antes de publicar posts.");
  }
  cachedAuthorId.value = id;
  return id;
}

function toBlocks(text: string) {
  const normalized = (text ?? "").trim();
  if (!normalized) {
    return [
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Conteúdo pendente",
            marks: [],
          },
        ],
        markDefs: [],
      },
    ];
  }
  const paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return paragraphs.length
    ? paragraphs.map((paragraph) => ({
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: paragraph,
            marks: [],
          },
        ],
        markDefs: [],
      }))
    : [
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: normalized,
              marks: [],
            },
          ],
          markDefs: [],
        },
      ];
}

function ensureDescription(excerpt?: string | null, content?: string | null) {
  const source = (excerpt?.trim() || content?.trim() || "").replace(/\s+/g, " ");
  if (source.length >= 60 && source.length <= 300) return source;
  if (source.length > 300) return source.slice(0, 300).trim();
  if (source.length > 0) return source.padEnd(60, " ");
  return "Resumo automático em construção pelo criador.";
}

function ensureTldr(excerpt?: string | null, content?: string | null) {
  const source = (excerpt?.trim() || content?.trim() || "").replace(/\s+/g, " ");
  const sentences = source
    ? source
        .split(/(?<=\.|\?|!)\s+/)
        .map((sentence) => sentence.trim().replace(/\s+/g, " "))
        .filter(Boolean)
    : [];
  const fallback = ["Resumo breve do post.", "Mais contexto em breve."];
  const lines = sentences.length >= 2 ? sentences.slice(0, 4) : fallback;
  if (lines.length < 2) {
    lines.push("Conteúdo sendo estruturado.");
  }
  return lines.slice(0, 4).join("\n");
}

function ensureKeyTakeaways(excerpt?: string | null, content?: string | null) {
  const source = (excerpt?.trim() || content?.trim() || "").replace(/\s+/g, " ");
  const sentences = source
    ? source
        .split(/(?<=\.|\?|!)\s+/)
        .map((sentence) => sentence.trim().replace(/\s+/g, " "))
        .filter(Boolean)
    : [];
  if (sentences.length >= 3) {
    return sentences.slice(0, 5);
  }
  const fallback = ["Checkout rápido", "Benefícios principais", "Próximos passos"];
  return fallback.slice(0, 3);
}

function resolveStatusForPayload(data: PostContentInput): PostStatus {
  if (data.status) return data.status;
  if (data.publishedAt) return "published";
  return "draft";
}

function buildDocument(data: PostContentInput, authorId: string, docId: string) {
  const description = ensureDescription(data.excerpt, data.content);
  const tldr = ensureTldr(data.excerpt, data.content);
  const keyTakeaways = ensureKeyTakeaways(data.excerpt, data.content);
  const publishedAt = data.publishedAt ?? null;
  return {
    _id: docId,
    _type: "post",
    title: data.title,
    description,
    tldr,
    keyTakeaways,
    publishedAt,
    slug: { current: data.slug },
    coverUrl: data.coverUrl ?? null,
    category: data.category ?? null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    content: data.content ? toBlocks(data.content) : [],
    status: resolveStatusForPayload(data),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      _type: "reference",
      _ref: authorId,
    },
  };
}

async function fetchDocument(
  filter: string,
  params: Record<string, unknown>,
  fields: string = SANITY_POST_DETAIL_FIELDS
) {
  return sanityClient.fetch<SanityPostDocument | null>(`${filter} { ${fields} }[0]`, params);
}

async function fetchList(
  filter: string,
  params: Record<string, unknown>,
  sort: "recentes" | "antigos" = "recentes"
) {
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(params.limit ?? DEFAULT_LIMIT)));
  const offset = Math.max(0, Number(params.offset ?? 0));
  const orderClause =
    sort === "antigos" ? "publishedAt asc, _createdAt asc" : "publishedAt desc, _createdAt desc";
  const [items, total] = await Promise.all([
    sanityClient.fetch<SanityPostDocument[]>(
      `${filter} | order(${orderClause})[${offset}...${offset + limit - 1}]{ ${SANITY_POST_LIST_FIELDS} }`,
      params
    ),
    sanityClient.fetch<number>(`count(${filter})`, params),
  ]);
  return { items, total };
}

export const sanityBlogRepo = {
  async listSummaries(params?: ListSummariesParams): Promise<ListResult<Post>> {
    const statusClause = params?.status
      ? params.status === "published"
        ? " && (!defined(status) || status == $status)"
        : " && status == $status"
      : "";
    const categoryClause = params?.category
      ? " && (category == $category || $category in categories[].slug)"
      : "";
    const tagClause = params?.tag ? " && $tag in tags" : "";
    const filterClauses = [
      `*[_type == "post"${statusClause}${categoryClause}${tagClause}]`,
    ];
    const rawSearch = normalizeSearch(params?.search);
    const search = rawSearch && rawSearch.length >= 2 ? `${rawSearch}*` : undefined;
    const finalFilter =
      search && search.length > 2
        ? `${filterClauses.join("")} && (title match $search || description match $search || slug.current match $search)`
        : filterClauses.join("");
    // Monta params sem incluir campos undefined (Sanity pode falhar em $status=undefined)
    const fetchParams: Record<string, unknown> = {
      limit: params?.limit ?? DEFAULT_LIMIT,
      offset: params?.offset ?? 0,
    };
    if (params?.status) fetchParams.status = params.status;
    if (search) fetchParams.search = search;
    if (params?.tag) fetchParams.tag = params.tag;
    if (params?.category) fetchParams.category = params.category;
    const { items, total } = await fetchList(finalFilter, fetchParams, params?.sort);
    return {
      items: items.map(mapDocumentToPost),
      total,
    };
  },

  async getPostById(id: string): Promise<Post | null> {
    const doc = await fetchDocument(`*[_type == "post" && _id == $id]`, { id });
    if (!doc) return null;
    const post = mapDocumentToPost(doc);
    return addSnakeCaseAliases(post, {
      answerSnippet: doc.answerSnippet ?? null,
      tldr: doc.tldr ?? null,
      keyTakeaways: doc.keyTakeaways ?? null,
      faq: doc.faq ?? null,
      sources: doc.sources ?? null,
      content_blocks: (doc.content ?? doc.body ?? null) as unknown,
      author: doc.author
        ? {
            name: doc.author.name ?? null,
            slug: doc.author.slug?.current ?? null,
            avatar_url: doc.author.avatar_url ?? null,
          }
        : null,
    });
  },

  async getPostBySlug(slug: string): Promise<Post | null> {
    const doc = await fetchDocument(`*[_type == "post" && slug.current == $slug]`, { slug });
    if (!doc) return null;
    const post = mapDocumentToPost(doc);
    return addSnakeCaseAliases(post, {
      answerSnippet: doc.answerSnippet ?? null,
      tldr: doc.tldr ?? null,
      keyTakeaways: doc.keyTakeaways ?? null,
      faq: doc.faq ?? null,
      sources: doc.sources ?? null,
      content_blocks: (doc.content ?? doc.body ?? null) as unknown,
      author: doc.author
        ? {
            name: doc.author.name ?? null,
            slug: doc.author.slug?.current ?? null,
            avatar_url: doc.author.avatar_url ?? null,
          }
        : null,
    });
  },

  async upsertPost(data: PostContentInput): Promise<Post | null> {
    const docId = data.id ?? `post-${data.slug}`;
    const authorId = data.id ? await ensureAuthorId() : await ensureAuthorId();
    const doc = buildDocument(data, authorId, docId);
    await sanityClient.createOrReplace(doc);
    const saved = await fetchDocument(`*[_id == $id]`, { id: docId });
    return saved ? addSnakeCaseAliases(mapDocumentToPost(saved)) : null;
  },

  async duplicatePost(sourceId: string): Promise<Post | null> {
    const source = await fetchDocument(`*[_type == "post" && _id == $id]`, { id: sourceId });
    if (!source) return null;
    const docId = `${sourceId}-copy-${Date.now()}`;
    const newSlug = `${source.slug?.current ?? sourceId}-copy-${Date.now()}`.replace(/-{2,}/g, "-");
    const authorRefId = source.author?._id ?? (await ensureAuthorId());
    const copy = {
      ...source,
      _id: docId,
      _type: "post" as const,
      slug: { current: newSlug },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: { _type: "reference" as const, _ref: authorRefId },
    };
    await sanityClient.create(copy);
    const duplicated = await fetchDocument(`*[_id == $id]`, { id: docId });
    return duplicated ? addSnakeCaseAliases(mapDocumentToPost(duplicated)) : null;
  },

  async bulkAction(payload: { action: BlogBulkAction; postIds: string[]; scheduleAt?: string }): Promise<BlogBulkResult> {
    const result: BlogBulkResult = { processed: [], failed: [] };
    await Promise.all(
      payload.postIds.map(async (id) => {
        try {
          if (payload.action === "publish") {
            await sanityClient.patch(id).set({ status: "published", publishedAt: new Date().toISOString() }).commit();
          } else if (payload.action === "archive") {
            await sanityClient.patch(id).set({ status: "archived" }).commit();
          } else if (payload.action === "schedule") {
            if (!payload.scheduleAt) throw new Error("scheduleAt required");
            await sanityClient
              .patch(id)
              .set({ status: "scheduled", publishedAt: payload.scheduleAt })
              .commit();
          } else if (payload.action === "delete") {
            await sanityClient.delete(id);
          }
          result.processed.push(id);
        } catch (error) {
          result.failed.push({
            id,
            reason: error instanceof Error ? error.message : "unknown",
          });
        }
      })
    );
    return result;
  },
};
