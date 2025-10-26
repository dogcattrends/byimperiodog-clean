"use client";

import { useRouter } from "next/navigation";

import EditorShell, { type FormState } from "@/app/admin/blog/editor/EditorShell";
import type { Post } from "@/lib/db/types";

interface EditorWrapperProps {
  post: Post | null;
}

export default function EditorWrapper({ post }: EditorWrapperProps) {
  const router = useRouter();

  const handleSave = async (data: FormState) => {
    try {
      const response = await fetch("/api/admin/blog", {
        method: post?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: post?.id,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save post");
      }

      const result = await response.json();
      
      if (result.slug && !post?.id) {
        router.push(`/admin/blog/editor?id=${result.id}`);
      }

      return result;
    } catch (error) {
      console.error("Error saving post:", error);
      throw error;
    }
  };

  return (
    <EditorShell
      initial={post ? {
        id: post.id,
        title: post.title || "",
        slug: post.slug || "",
        content: post.content || "",
        excerpt: post.excerpt || undefined,
        coverUrl: post.coverUrl || undefined,
        coverAlt: post.coverAlt || undefined,
        ogImageUrl: post.seo?.ogImageUrl || undefined,
        metaTitle: post.seo?.title || undefined,
        metaDescription: post.seo?.description || undefined,
        category: post.category?.id || null,
        tags: post.tags?.map(t => t.id) || [],
        status: (post.status === "draft" || post.status === "scheduled" || post.status === "published") 
          ? post.status 
          : "draft",
      } : undefined}
      onSave={handleSave}
    />
  );
}
