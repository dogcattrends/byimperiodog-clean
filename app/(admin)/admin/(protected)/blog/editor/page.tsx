"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { BlogSubnav } from "@/components/admin/BlogSubnav";
import EditorShell, { type FormState } from "@/app/admin/blog/editor/EditorShell";
import { adminFetch } from "@/lib/adminFetch";

async function fetchPost(id: string) {
  const res = await adminFetch(`/api/admin/blog?id=${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return res.json();
}

async function persist(form: FormState) {
  const payload: Record<string, unknown> = {
    id: form.id,
    title: form.title,
    subtitle: form.subtitle,
    slug: form.slug,
    excerpt: form.excerpt,
    content_mdx: form.content,
    cover_url: form.coverUrl,
    cover_alt: form.coverAlt,
    tags: form.tags,
    category: form.category,
    status: form.status,
    scheduled_at: form.publishAt,
    og_image_url: form.ogImageUrl,
    seo_title: form.metaTitle,
    seo_description: form.metaDescription,
  };
  const res = await adminFetch("/api/admin/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error || "Falha ao salvar");
  }
}

export default function BlogEditorPage() {
  const search = useSearchParams();
  const [initial, setInitial] = useState<Partial<FormState> | null>(null);
  const id = search.get("id");

  useEffect(() => {
    if (!id) return;
    fetchPost(id).then((post) => {
      if (!post) return;
      setInitial({
        id: post.id,
        title: post.title || "",
        subtitle: post.subtitle || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content: post.content_mdx || "",
        coverUrl: post.cover_url || null,
        coverAlt: post.cover_alt || null,
        tags: Array.isArray(post.tags) ? post.tags : [],
        category: post.category || null,
        status: post.status || "draft",
        publishAt: post.scheduled_at || null,
        ogImageUrl: post.og_image_url || null,
        metaTitle: post.seo_title || null,
        metaDescription: post.seo_description || null,
      });
    });
  }, [id]);

  return (
    <AdminShell>
      <BlogSubnav />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Editor de Post</h1>
          {id && <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--text-muted)]">ID: {id}</span>}
        </header>
        <EditorShell initial={initial || undefined} onSave={persist} />
      </div>
    </AdminShell>
  );
}
