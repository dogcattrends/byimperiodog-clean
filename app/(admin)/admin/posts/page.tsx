"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import * as React from "react";

import BlogPostsTable from "@/components/admin/blog/BlogPostsTable";
import { blogRepo } from "@/lib/db";
import type { Post } from "@/lib/db/types";

interface PostRow {
  id: string;
  title: string | null;
  slug: string;
  status: string;
  created_at?: string | null;
  published_at?: string | null;
}

export default function AdminPostsPage() {
  const [initial, setInitial] = React.useState<{ items: Post[]; total: number } | null>(null);
  React.useEffect(() => {
    let abort = false;
    void blogRepo.listPosts({ limit: 50, offset: 0 }).then((result) => {
      if (!abort) setInitial(result);
    });
    return () => {
      abort = true;
    };
  }, []);

  if (!initial) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-zinc-600" aria-busy>
        Carregando posts...
      </div>
    );
  }

  return <BlogPostsTable initialData={initial} />;
}
