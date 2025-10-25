import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import type {
  AnalyticsEvent,
  Comment,
  Experiment,
  ListParams,
  ListResult,
  MediaAsset,
  Post,
  PostStatus,
  Schedule,
  SeoSettings,
  SiteSettings,
  Tag,
} from "./types";

type SupabaseClient = ReturnType<typeof supabaseAdmin> | null;

const logger = createLogger("db");

function getClient(): SupabaseClient {
  try {
    return supabaseAdmin();
  } catch (error) {
    logger.warn("Supabase client unavailable", { error: String(error) });
    return null;
  }
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return null;
}

function mapPost(row: any): Post {
  return {
    id: row?.id ?? "",
    slug: row?.slug ?? "",
    title: row?.title ?? null,
    subtitle: row?.subtitle ?? null,
    excerpt: row?.excerpt ?? null,
    content: row?.content_mdx ?? row?.content ?? null,
    status: (row?.status as PostStatus) ?? "draft",
    coverUrl: row?.cover_url ?? null,
    coverAlt: row?.cover_alt ?? null,
    category: row?.category
      ? {
          id: row.category_id ?? row.category ?? "",
          slug: row.category_slug ?? row.category ?? "",
          title: row.category_title ?? row.category ?? "",
          description: row.category_description ?? null,
          createdAt: normalizeDate(row.category_created_at),
          updatedAt: normalizeDate(row.category_updated_at),
        }
      : null,
    tags: Array.isArray(row?.tags)
      ? (row.tags as any[]).map(
          (tag) =>
            (typeof tag === "string"
              ? { id: tag, slug: tag, name: tag, createdAt: null }
              : {
                  id: tag?.id ?? tag?.slug ?? "",
                  slug: tag?.slug ?? tag?.id ?? "",
                  name: tag?.name ?? tag?.slug ?? "",
                  createdAt: normalizeDate(tag?.created_at),
                }) as Tag,
        )
      : [],
    seo: {
      title: row?.seo_title ?? null,
      description: row?.seo_description ?? null,
      ogImageUrl: row?.og_image_url ?? null,
      score: typeof row?.seo_score === "number" ? row?.seo_score : null,
    },
    scheduledAt: normalizeDate(row?.scheduled_at),
    publishedAt: normalizeDate(row?.published_at),
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

function mapComment(row: any): Comment {
  return {
    id: row?.id ?? "",
    postId: row?.post_id ?? "",
    parentId: row?.parent_id ?? null,
    authorName: row?.author_name ?? null,
    authorEmail: row?.author_email ?? null,
    body: row?.body ?? "",
    status: (row?.status as Comment["status"]) ?? (row?.approved ? "approved" : "pending"),
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

function mapMedia(row: any): MediaAsset {
  return {
    id: row?.id ?? "",
    filePath: row?.file_path ?? "",
    url: row?.url ?? row?.public_url ?? row?.file_path ?? "",
    alt: row?.alt ?? null,
    caption: row?.caption ?? null,
    tags: Array.isArray(row?.tags) ? (row.tags as string[]) : [],
    width: typeof row?.width === "number" ? row?.width : null,
    height: typeof row?.height === "number" ? row?.height : null,
    mimeType: row?.mime_type ?? row?.content_type ?? null,
    sizeInBytes: typeof row?.size_in_bytes === "number" ? row?.size_in_bytes : null,
    createdAt: normalizeDate(row?.created_at),
  };
}

function mapSchedule(row: any): Schedule {
  return {
    id: row?.id ?? "",
    postId: row?.post_id ?? "",
    runAt: normalizeDate(row?.run_at) ?? normalizeDate(row?.scheduled_at) ?? "",
    status: (row?.status as Schedule["status"]) ?? "pending",
    repeatInterval: typeof row?.repeat_interval === "number" ? row?.repeat_interval : null,
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

function mapSeoSettings(row: any): SeoSettings {
  return {
    defaultTitle: row?.default_title ?? null,
    defaultDescription: row?.default_description ?? null,
    defaultCanonical: row?.default_canonical ?? null,
    defaultOgImage: row?.default_og_image ?? null,
    twitterHandle: row?.twitter_handle ?? null,
    jsonLdEnabled: Boolean(row?.json_ld_enabled ?? row?.jsonld_enabled ?? false),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

function mapExperiment(row: any): Experiment {
  return {
    id: row?.id ?? "",
    key: row?.key ?? "",
    name: row?.name ?? "",
    description: row?.description ?? null,
    status: (row?.status as Experiment["status"]) ?? "draft",
    audience: row?.audience ?? null,
    variants: Array.isArray(row?.variants)
      ? row.variants.map((entry: any) => ({
          key: entry?.key ?? "",
          label: entry?.label ?? entry?.key ?? "",
          weight: typeof entry?.weight === "number" ? entry.weight : 0,
        }))
      : [],
    startsAt: normalizeDate(row?.starts_at),
    endsAt: normalizeDate(row?.ends_at),
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

function mapEvent(row: any): AnalyticsEvent {
  return {
    id: row?.id ?? "",
    name: row?.name ?? "",
    value: typeof row?.value === "number" ? row.value : null,
    path: row?.path ?? null,
    ts: normalizeDate(row?.ts) ?? new Date().toISOString(),
    meta: (typeof row?.meta === "object" && row?.meta !== null ? row.meta : null) as Record<string, unknown> | null,
  };
}

function mapSiteSettings(row: any): SiteSettings {
  return {
    id: row?.id ?? "",
    brandName: row?.brand_name ?? null,
    supportEmail: row?.support_email ?? null,
    supportPhone: row?.support_phone ?? null,
    whatsappNumber: row?.whatsapp_number ?? null,
    privacyContactEmail: row?.privacy_contact_email ?? null,
    createdAt: normalizeDate(row?.created_at),
    updatedAt: normalizeDate(row?.updated_at),
  };
}

function applyListFilters(query: any, params?: ListParams) {
  if (!params) return query;
  const { search, status, tag, category } = params;
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (tag) query = query.contains?.("tags", [tag]) ?? query.or?.(`tags.cs.{${tag}}`);
  if (search) {
    query =
      query.or?.(
        `slug.ilike.%${search}%` +
          `,title.ilike.%${search}%` +
          `,excerpt.ilike.%${search}%`,
      ) ?? query;
  }
  return query;
}

function applyPagination(query: any, params?: ListParams) {
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const offset = Math.max(0, params?.offset ?? 0);
  return query.range(offset, offset + limit - 1);
}

async function execList<T>(
  query: any,
  mapper: (row: any) => T,
  fallback: ListResult<T> = { items: [], total: 0 },
): Promise<ListResult<T>> {
  try {
    const { data, error, count } = (await query) as {
      data: unknown[] | null;
      error: { message?: string } | null;
      count?: number | null;
    };
    if (error) {
      logger.warn("Supabase list error", { error: error.message });
      return fallback;
    }
    const items = Array.isArray(data) ? data.map(mapper) : [];
    return { items, total: typeof count === "number" ? count : items.length };
  } catch (error) {
    logger.warn("Supabase list exception", { error: String(error) });
    return fallback;
  }
}

async function execSingle<T>(query: any, mapper: (row: any) => T | null): Promise<T | null> {
  try {
    const { data, error } = (await query) as { data: unknown | null; error: { message?: string } | null };
    if (error) {
      logger.warn("Supabase single error", { error: error.message });
      return null;
    }
    return data ? mapper(data) : null;
  } catch (error) {
    logger.warn("Supabase single exception", { error: String(error) });
    return null;
  }
}

async function execWrite<T>(operation: Promise<{ data: unknown; error: { message?: string } | null }>, mapper: (row: any) => T): Promise<T | null> {
  try {
    const { data, error } = await operation;
    if (error) {
      logger.warn("Supabase write error", { error: error.message });
      return null;
    }
    if (Array.isArray(data)) {
      const first = data[0];
      return first ? mapper(first) : null;
    }
    return data ? mapper(data) : null;
  } catch (error) {
    logger.warn("Supabase write exception", { error: String(error) });
    return null;
  }
}

export interface ListPostsParams extends ListParams {
  status?: PostStatus | "all";
}

export const blogRepo = {
  async listPosts(params?: ListPostsParams): Promise<ListResult<Post>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client.from("blog_posts").select(
      "id,slug,title,subtitle,excerpt,content_mdx,status,cover_url,cover_alt,tags,category,category_id,category_slug,category_title,category_description,category_created_at,category_updated_at,seo_title,seo_description,og_image_url,seo_score,scheduled_at,published_at,created_at,updated_at",
      { count: "exact" },
    );
    query = applyListFilters(query, params);
    query = query.order("created_at", { ascending: false });
    query = applyPagination(query, params);
    return execList(query, mapPost);
  },

  async getPostById(id: string): Promise<Post | null> {
    const client = getClient();
    if (!client) return null;
    const query = client
      .from("blog_posts")
      .select(
        "id,slug,title,subtitle,excerpt,content_mdx,status,cover_url,cover_alt,tags,category,category_id,category_slug,category_title,category_description,category_created_at,category_updated_at,seo_title,seo_description,og_image_url,seo_score,scheduled_at,published_at,created_at,updated_at",
      )
      .eq("id", id)
      .maybeSingle();
    return execSingle(query, mapPost);
  },

  async getPostBySlug(slug: string): Promise<Post | null> {
    const client = getClient();
    if (!client) return null;
    const query = client
      .from("blog_posts")
      .select(
        "id,slug,title,subtitle,excerpt,content_mdx,status,cover_url,cover_alt,tags,category,category_id,category_slug,category_title,category_description,category_created_at,category_updated_at,seo_title,seo_description,og_image_url,seo_score,scheduled_at,published_at,created_at,updated_at",
      )
      .eq("slug", slug)
      .maybeSingle();
    return execSingle(query, mapPost);
  },

  async upsertPost(payload: Partial<Post> & { id?: string }): Promise<Post | null> {
    const client = getClient();
    if (!client) return null;
    const base = {
      id: payload.id,
      slug: payload.slug,
      title: payload.title,
      subtitle: payload.subtitle,
      excerpt: payload.excerpt,
      content_mdx: payload.content,
      status: payload.status ?? "draft",
      cover_url: payload.coverUrl,
      cover_alt: payload.coverAlt,
      tags: payload.tags?.map((tag) => tag.slug) ?? null,
      category: payload.category?.slug ?? null,
      seo_title: payload.seo?.title ?? null,
      seo_description: payload.seo?.description ?? null,
      og_image_url: payload.seo?.ogImageUrl ?? null,
      seo_score: payload.seo?.score ?? null,
      scheduled_at: payload.scheduledAt,
      published_at: payload.publishedAt,
    };
    const operation = client.from("blog_posts").upsert(base, { onConflict: "id" }).select().limit(1);
    return execWrite(operation, mapPost);
  },

  async deletePost(id: string): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("blog_posts").delete().eq("id", id);
      if (error) {
        logger.warn("deletePost error", { error: error.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.warn("deletePost exception", { error: String(error) });
      return false;
    }
  },
};

export const commentRepo = {
  async listComments(params?: { postId?: string; status?: string; limit?: number }): Promise<ListResult<Comment>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client
      .from("blog_comments")
      .select("id,post_id,parent_id,author_name,author_email,body,approved,status,created_at,updated_at", { count: "exact" })
      .order("created_at", { ascending: false });
    if (params?.postId) query = query.eq("post_id", params.postId);
    if (params?.status) query = query.eq("status", params.status);
    if (typeof params?.limit === "number") query = query.limit(params.limit);
    return execList(query, mapComment);
  },

  async updateStatus(id: string, status: string): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client
        .from("blog_comments")
        .update({ status, approved: status === "approved" })
        .eq("id", id);
      if (error) {
        logger.warn("updateStatus error", { error: error.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.warn("updateStatus exception", { error: String(error) });
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("blog_comments").delete().eq("id", id);
      if (error) {
        logger.warn("delete comment error", { error: error.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.warn("delete comment exception", { error: String(error) });
      return false;
    }
  },
};

export const mediaRepo = {
  async listAssets(params?: { tag?: string; limit?: number; role?: string }): Promise<ListResult<MediaAsset>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client
      .from("media_assets")
      .select("id,file_path,url,public_url,alt,caption,tags,width,height,mime_type,size_in_bytes,created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });
    if (params?.tag) query = query.contains?.("tags", [params.tag]) ?? query;
    if (typeof params?.limit === "number") query = query.limit(params.limit);
    if (params?.role) {
      const pivot = await client.from("post_media").select("media_id").eq("role", params.role);
      const allowed = pivot?.data?.map((row: any) => row.media_id);
      if (Array.isArray(allowed) && allowed.length > 0) {
        query = query.in("id", allowed);
      }
    }
    return execList(query, mapMedia);
  },

  async getAsset(id: string): Promise<MediaAsset | null> {
    const client = getClient();
    if (!client) return null;
    const query = client
      .from("media_assets")
      .select("id,file_path,url,public_url,alt,caption,tags,width,height,mime_type,size_in_bytes,created_at")
      .eq("id", id)
      .maybeSingle();
    return execSingle(query, mapMedia);

  },
};

export const seoRepo = {
  async getSettings(): Promise<SeoSettings> {
    const client = getClient();
    if (!client) {
      return {
        defaultTitle: null,
        defaultDescription: null,
        defaultCanonical: null,
        defaultOgImage: null,
        twitterHandle: null,
        jsonLdEnabled: false,
        updatedAt: null,
      };
    }
    const query = client.from("seo_settings").select("*").limit(1).maybeSingle();
    const record = await execSingle(query, mapSeoSettings);
    return (
      record ?? {
        defaultTitle: null,
        defaultDescription: null,
        defaultCanonical: null,
        defaultOgImage: null,
        twitterHandle: null,
        jsonLdEnabled: false,
        updatedAt: null,
      }
    );
  },

  async updateSettings(payload: Partial<SeoSettings>): Promise<SeoSettings | null> {
    const client = getClient();
    if (!client) return null;
    const body = {
      default_title: payload.defaultTitle ?? null,
      default_description: payload.defaultDescription ?? null,
      default_canonical: payload.defaultCanonical ?? null,
      default_og_image: payload.defaultOgImage ?? null,
      twitter_handle: payload.twitterHandle ?? null,
      json_ld_enabled: payload.jsonLdEnabled ?? false,
    };
    const operation = client.from("seo_settings").upsert(body, { onConflict: "singleton_key" }).select().limit(1);
    return execWrite(operation, mapSeoSettings);
  },
};

export const expRepo = {
  async listExperiments(params?: ListParams): Promise<ListResult<Experiment>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client.from("experiments").select("*", { count: "exact" }).order("created_at", { ascending: false });
    query = applyListFilters(query, params);
    query = applyPagination(query, params);
    return execList(query, mapExperiment);
  },

  async getExperiment(id: string): Promise<Experiment | null> {
    const client = getClient();
    if (!client) return null;
    const query = client.from("experiments").select("*").eq("id", id).maybeSingle();
    return execSingle(query, mapExperiment);
  },

  async saveExperiment(payload: Partial<Experiment> & { id?: string }): Promise<Experiment | null> {
    const client = getClient();
    if (!client) return null;
    const body = {
      id: payload.id,
      key: payload.key,
      name: payload.name,
      description: payload.description ?? null,
      status: payload.status ?? "draft",
      audience: payload.audience ?? null,
      variants: payload.variants ?? [],
      starts_at: payload.startsAt ?? null,
      ends_at: payload.endsAt ?? null,
    };
    const operation = client.from("experiments").upsert(body, { onConflict: "id" }).select().limit(1);
    return execWrite(operation, mapExperiment);
  },
};

export const analyticsRepo = {
  async listEvents(params?: { name?: string; since?: string; limit?: number }): Promise<ListResult<AnalyticsEvent>> {
    const client = getClient();
    if (!client) return { items: [], total: 0 };
    let query = client
      .from("analytics_events")
      .select("id,name,value,path,ts,meta", { count: "exact" })
      .order("ts", { ascending: false });
    if (params?.name) query = query.eq("name", params.name);
    if (params?.since) query = query.gte("ts", params.since);
    if (typeof params?.limit === "number") query = query.limit(params.limit);
    return execList(query, mapEvent);
  },

  async record(event: Omit<AnalyticsEvent, "id" | "ts"> & { ts?: string }): Promise<boolean> {
    const client = getClient();
    if (!client) return false;
    try {
      const { error } = await client.from("analytics_events").insert({
        name: event.name,
        value: event.value ?? null,
        path: event.path ?? null,
        ts: event.ts ?? new Date().toISOString(),
        meta: event.meta ?? null,
      });
      if (error) {
        logger.warn("analytics record error", { error: error.message });
        return false;
      }
      return true;
    } catch (error) {
      logger.warn("analytics record exception", { error: String(error) });
      return false;
    }
  },
};

export const settingsRepo = {
  async getSettings(): Promise<SiteSettings | null> {
    const client = getClient();
    if (!client) return null;
    const query = client.from("site_settings").select("*").limit(1).maybeSingle();
    return execSingle(query, mapSiteSettings);
  },

  async upsertSettings(payload: Partial<SiteSettings>): Promise<SiteSettings | null> {
    const client = getClient();
    if (!client) return null;
    const body = {
      brand_name: payload.brandName ?? null,
      support_email: payload.supportEmail ?? null,
      support_phone: payload.supportPhone ?? null,
      whatsapp_number: payload.whatsappNumber ?? null,
      privacy_contact_email: payload.privacyContactEmail ?? null,
    };
    const operation = client.from("site_settings").upsert(body, { onConflict: "singleton_key" }).select().limit(1);
    return execWrite(operation, mapSiteSettings);
  },
};

export type {
  AnalyticsEvent,
  Comment,
  Experiment,
  ListParams,
  ListResult,
  MediaAsset,
  Post,
  PostStatus,
  Schedule,
  SeoSettings,
  SiteSettings,
  Tag,
} from "./types";

