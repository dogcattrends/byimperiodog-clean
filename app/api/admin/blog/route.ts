/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import {
  postContentSchema,
  type BulkActionInput,
  type PostContentInput,
} from "@/lib/db";
import { sanityBlogRepo } from "@/lib/sanity/blogRepo";
import { sanityClient } from "@/lib/sanity/client";

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message || "internal_error" }, { status: 500 });
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");
    const summary = url.searchParams.get("summary") === "1";
    const metrics = url.searchParams.get("metrics") === "1";
    const pending = url.searchParams.get("pending") === "1";
    const search = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "50", 10)));
    const offset = (page - 1) * perPage;

    if (summary) {
      const counts = await sanityClient.fetch<{
        total: number;
        published: number;
        scheduled: number;
        draft: number;
      }>(
        `{
          "total": count(*[_type == "post"]),
          "published": count(*[_type == "post" && defined(publishedAt) && dateTime(publishedAt) <= now() && (!defined(status) || status == "published")]),
          "scheduled": count(*[_type == "post" && defined(publishedAt) && dateTime(publishedAt) > now() && (status == "scheduled" || !defined(status) || status == "published")]),
          "draft": count(*[_type == "post" && (!defined(publishedAt) || publishedAt == null) && (status == "draft" || !defined(status))])
        }`
      );
      return NextResponse.json({ summary: counts });
    }

    if (id) {
      const post = await sanityBlogRepo.getPostById(id);
      return NextResponse.json(post ?? {});
    }

    if (slug) {
      const post = await sanityBlogRepo.getPostBySlug(slug);
      return NextResponse.json(post ?? {});
    }

    const list = await sanityBlogRepo.listSummaries({
      search: search || undefined,
      status: status === "all" ? undefined : (status as PostContentInput["status"]),
      limit: perPage,
      offset,
      includeMetrics: metrics,
      includePendingComments: pending,
    });

    return NextResponse.json({
      items: list.items,
      total: list.total,
      page,
      perPage,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const payload = (await req.json()) as Partial<PostContentInput> & { duplicateFrom?: string };

    if (payload.duplicateFrom) {
      const duplicated = await sanityBlogRepo.duplicatePost(payload.duplicateFrom);
      if (!duplicated) return serverError("Não foi possível duplicar o post.");
      await revalidatePath("/blog");
      return NextResponse.json(duplicated);
    }

    const parsed = postContentSchema.safeParse(payload);
    if (!parsed.success) {
      return badRequest("payload_invalid", parsed.error.flatten());
    }
    const data = parsed.data;

    const existing = data.id ? await sanityBlogRepo.getPostById(data.id) : null;

    if (!data.id) {
      const slugConflict = await sanityBlogRepo.getPostBySlug(data.slug);
      if (slugConflict) {
        return NextResponse.json({ error: "slug_exists" }, { status: 409 });
      }
    } else if (existing && existing.slug !== data.slug) {
      const conflict = await sanityBlogRepo.getPostBySlug(data.slug);
      if (conflict && conflict.id !== data.id) {
        return NextResponse.json({ error: "slug_exists" }, { status: 409 });
      }
    }

    const saved = await sanityBlogRepo.upsertPost(data);

    if (!saved) {
      return serverError("Falha ao salvar o post.");
    }

    await revalidatePath("/blog");
    if (saved.slug) {
      await revalidatePath(`/blog/${saved.slug}`);
    }

    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof Error && /duplicate key|slug/i.test(error.message)) {
      return NextResponse.json({ error: "slug_exists" }, { status: 409 });
    }
    return serverError(error);
  }
}

export async function PATCH(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const payload = (await req.json()) as BulkActionInput;
    const result = await sanityBlogRepo.bulkAction(payload);
    await revalidatePath("/blog");
    return NextResponse.json(result);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return badRequest("missing_id");
    const success = await sanityBlogRepo.bulkAction({ action: "delete", postIds: [id] });
    await revalidatePath("/blog");
    return NextResponse.json(success);
  } catch (error) {
    return serverError(error);
  }
}
