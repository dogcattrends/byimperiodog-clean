// PATH: app/(admin)/admin/(protected)/blog/page.tsx
"use client";

import { Download, Filter, Loader2, Plus, RefreshCw, Search, Tag as TagIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BlogBulkActions, type PostRow } from "@/components/admin/blog/BlogBulkActions";
import { BlogSubnav } from "@/components/admin/BlogSubnav";
import { MetricCard } from "@/components/admin/MetricCard";
import { VirtualizedDataTable } from "@/components/admin/table/VirtualizedDataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { adminFetch } from "@/lib/adminFetch";
import { createBlogTableColumns } from "@/lib/blog/blog-table-columns";
import { exportToCSV } from "@/lib/export-csv";
import { formatDateShort } from "@/lib/format/date";

const PER_PAGE = 100; // Mais posts por página com virtualização

export type PostStatus = "draft" | "published" | "scheduled" | "review" | "archived" | string;

const statusLabels: Record<PostStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  review: "Revisão",
  archived: "Arquivado",
};

function toArrayTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

export default function AdminBlogPage() {
  const router = useRouter();
  const { push: pushToast } = useToast();

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<PostRow | null>(null);
  const [actionLoading, setActionLoading] = useState<{ id: string; type: "publish" | "duplicate" | "delete" } | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(PER_PAGE),
      });
      const search = query.trim();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("q", search);

      const url = `/api/admin/blog?${params.toString()}`;
      
      const response = await adminFetch(url);
      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json?.error || "Não foi possível carregar os posts");
      }

      const items: PostRow[] = (Array.isArray(json?.items) ? json.items : json) || [];
      const mapped = items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        status: (item.status || "draft") as PostStatus,
        excerpt: item.excerpt ?? null,
        category: item.category ?? null,
        tags: toArrayTags(item.tags),
        created_at: item.created_at ?? null,
        published_at: item.published_at ?? null,
        scheduled_at: item.scheduled_at ?? null,
        cover_url: item.cover_url ?? null,
        cover_alt: item.cover_alt ?? null,
        seo_title: item.seo_title ?? null,
        seo_description: item.seo_description ?? null,
      }));

      setPosts(mapped);
      setTotal(typeof json?.total === "number" ? json.total : mapped.length);
    } catch (error) {
      pushToast({ message: error instanceof Error ? error.message : "Erro ao carregar posts", type: "error" });
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, query, statusFilter, pushToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach((post) => post.tags?.forEach((tag) => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!tagFilter) return posts;
    return posts.filter((post) => post.tags?.includes(tagFilter));
  }, [posts, tagFilter]);

  const statusCounts = useMemo(() => {
    return posts.reduce<Record<PostStatus, number>>((acc, post) => {
      const key = (post.status || "draft") as PostStatus;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<PostStatus, number>);
  }, [posts]);

  async function fetchFullPost(id: string) {
    const response = await adminFetch(`/api/admin/blog?id=${encodeURIComponent(id)}`);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.error || "Não foi possível carregar o post");
    }
    return json;
  }

  async function publishNow(id: string) {
    setActionLoading({ id, type: "publish" });
    try {
      const full = await fetchFullPost(id);
      const payload: Record<string, unknown> = {
        ...full,
        status: "published",
        scheduled_at: null,
        published_at: new Date().toISOString(),
      };
      const response = await adminFetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Falha ao publicar");
      }
      pushToast({ message: "Post publicado", type: "success" });
      fetchPosts();
    } catch (error) {
      pushToast({ message: error instanceof Error ? error.message : "Não foi possível publicar agora", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  function generateDuplicateSlug(slug: string) {
    const suffix = Date.now().toString(36).slice(-4);
    return `${slug}-${suffix}`;
  }

  async function duplicatePost(id: string) {
    setActionLoading({ id, type: "duplicate" });
    try {
      const full = await fetchFullPost(id);
      const payload: Record<string, unknown> = { ...full };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      payload.slug = generateDuplicateSlug(full.slug || "post");
      payload.title = `${full.title || "Post"} (Cópia)`.trim();
      payload.status = "draft";
      payload.scheduled_at = null;
      payload.published_at = null;

      const response = await adminFetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Não foi possível duplicar");
      }
      pushToast({ message: "Cópia criada como rascunho", type: "success" });
      fetchPosts();
    } catch (error) {
      pushToast({ message: error instanceof Error ? error.message : "Erro ao duplicar post", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  async function deletePost(id: string) {
    setActionLoading({ id, type: "delete" });
    try {
      const response = await adminFetch(`/api/admin/blog?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Falha ao excluir post");
      }
      pushToast({ message: "Post excluído", type: "success" });
      setDeleteTarget(null);
      fetchPosts();
    } catch (error) {
      pushToast({ message: error instanceof Error ? error.message : "Não foi possível excluir", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  function exportAllCSV() {
    try {
      exportToCSV(
        posts,
        [
          { header: 'ID', accessor: (row) => row.id },
          { header: 'Título', accessor: (row) => row.title },
          { header: 'Slug', accessor: (row) => row.slug },
          { header: 'Status', accessor: (row) => row.status },
          { header: 'Categoria', accessor: (row) => row.category || '' },
          { header: 'Tags', accessor: (row) => (row.tags || []).join('; ') },
          { header: 'Publicado em', accessor: (row) => row.published_at ? formatDateShort(row.published_at) : '' },
          { header: 'Criado em', accessor: (row) => row.created_at ? formatDateShort(row.created_at) : '' },
        ],
        `blog-posts-${new Date().toISOString().split('T')[0]}.csv`
      );
      pushToast({ type: 'success', message: `${posts.length} posts exportados` });
    } catch (error) {
      pushToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao exportar',
      });
    }
  }

  const columns = useMemo(
    () =>
      createBlogTableColumns({
        onEdit: (id) => router.push(`/admin/blog/editor?id=${id}`),
        onPublish: publishNow,
        onDuplicate: duplicatePost,
        onDelete: (id) => {
          const post = posts.find((p) => p.id === id);
          if (post) setDeleteTarget(post);
        },
        actionLoading,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actionLoading, posts]
  );

  const publishedCount = posts.filter((post) => post.status === "published").length;
  const scheduledCount = posts.filter((post) => post.status === "scheduled").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <BlogSubnav />
        
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Posts do Blog</h1>
            <p className="text-sm text-[var(--text-muted)]">Painel para revisar, publicar e automatizar conteúdo.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={fetchPosts} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="mr-2 h-4 w-4" aria-hidden />}
              Atualizar
            </Button>
            <Button type="button" variant="outline" onClick={exportAllCSV} disabled={posts.length === 0}>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Exportar Todos
            </Button>
            <Button type="button" onClick={() => router.push("/admin/blog/editor")}>
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Novo post
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Publicados" value={publishedCount} hint="Visíveis no blog" trend={publishedCount ? "up" : null} />
          <MetricCard title="Agendados" value={scheduledCount} hint="Programados" />
          <MetricCard title="Rascunhos" value={draftCount} hint="Em edição" />
        </section>

        <BlogBulkActions
          selectedIds={selectedIds}
          allPosts={posts}
          onActionComplete={fetchPosts}
          onClearSelection={() => setSelectedIds([])}
        />

        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
                <Input
                  placeholder="Buscar por título ou slug"
                  className="pl-9"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setPage(1);
                      fetchPosts();
                    }
                  }}
                />
              </div>
              <Button type="button" variant="outline" onClick={fetchPosts} disabled={loading}>
                <Filter className="mr-2 h-4 w-4" aria-hidden /> Aplicar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["all", "draft", "scheduled", "published", "archived"] as (PostStatus | "all")[]).map((status) => {
                const label = status === "all" ? "Todos" : statusLabels[status as PostStatus] || status;
                const count = status === "all" ? total : statusCounts[status as PostStatus] || 0;
                const isActive = statusFilter === status;
                return (
                  <Button
                    key={status}
                    type="button"
                    variant={isActive ? "solid" : "outline"}
                    size="sm"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                  >
                    {label}
                    <span className="ml-1 opacity-70">{count}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)]">
                <TagIcon className="h-3.5 w-3.5" aria-hidden /> Tags
              </span>
              <Button type="button" variant={tagFilter === null ? "solid" : "outline"} size="sm" onClick={() => setTagFilter(null)}>
                Todas
              </Button>
              {availableTags.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={tagFilter === tag ? "solid" : "outline"}
                  size="sm"
                  onClick={() => setTagFilter(tag)}
                >
                  #{tag}
                </Button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <VirtualizedDataTable
            columns={columns}
            data={filteredPosts}
            height={600}
            rowEstimate={64}
            enableSelection
            onSelectionChange={(ids) => setSelectedIds(ids as string[])}
            isLoading={loading}
            emptyState={
              <div className="py-12 text-center text-sm text-[var(--text-muted)]">
                Nenhum post encontrado com os filtros atuais.
              </div>
            }
          />

          <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3 text-[11px] text-[var(--text-muted)]">
            <span>
              Página {page} de {pageCount}
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}>
                Próxima
              </Button>
            </div>
            <span>Total {total}</span>
          </div>
        </section>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent title="Excluir post" description="Esta ação removerá o post permanentemente.">
          <p className="text-sm text-[var(--text-muted)]">Tem certeza que deseja excluir &ldquo;{deleteTarget?.title}&rdquo;?</p>
          <DialogActions>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={actionLoading?.id === deleteTarget?.id && actionLoading?.type === "delete"}
              onClick={() => deleteTarget && deletePost(deleteTarget.id)}
            >
              {actionLoading?.id === deleteTarget?.id && actionLoading?.type === "delete" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Excluir"}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </>
  );
}
