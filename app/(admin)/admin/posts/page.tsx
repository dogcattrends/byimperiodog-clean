"use client";

import * as React from "react";

import BlogPostsTable from "@/components/admin/blog/BlogPostsTable";
import { adminFetch } from "@/lib/adminFetch";
import type { Post } from "@/lib/db/types";

export default function AdminPostsPage() {
 const [initial, setInitial] = React.useState<{ items: Post[]; total: number; page: number; perPage: number } | null>(null);
 React.useEffect(() => {
 let abort = false;
 void (async () => {
 const res = await adminFetch("/api/admin/blog?page=1&perPage=50");
 const json = (await res.json()) as { items: Post[]; total: number; page: number; perPage: number; error?: string };
 if (!res.ok) throw new Error(json?.error || "Falha ao carregar posts");
 if (!abort) setInitial({ items: json.items, total: json.total, page: json.page, perPage: json.perPage });
 })().catch((err) => {
 if (!abort) {
 setInitial({ items: [], total: 0, page: 1, perPage: 50 });
 console.error(err instanceof Error ? err.message : String(err));
 }
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
