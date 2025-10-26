
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Target, Wand2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { adminFetch } from "@/lib/adminFetch";
import {
  postContentSchema,
  type Post,
  type PostContentInput,
} from "@/lib/db";
import { cn } from "@/lib/cn";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VersionsPanel } from "@/components/admin/blog/VersionsPanel";

interface EditorShellProps {
  initial?: Post | null;
}

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

const STATUS_OPTIONS: Array<{ value: PostContentInput["status"]; label: string }> = [
  { value: "draft", label: "Rascunho" },
  { value: "review", label: "Em revisão" },
  { value: "scheduled", label: "Agendado" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
];

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function fromLocalInput(value: string | null | undefined) {
  if (!value) return null;
  try {
    const date = new Date(value);
    return date.toISOString();
  } catch {
    return null;
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function convertInitial(initial?: Post | null): PostContentInput {
  if (!initial) {
    return {
      id: undefined,
      title: "",
      subtitle: null,
      slug: "",
      excerpt: "",
      content: "",
      status: "draft",
      category: null,
      tags: [],
      coverUrl: null,
      coverAlt: null,
      seoTitle: null,
      seoDescription: null,
      ogImageUrl: null,
      scheduledAt: null,
      publishedAt: null,
    };
  }
  return {
    id: initial.id,
    title: initial.title ?? "",
    subtitle: initial.subtitle ?? null,
    slug: initial.slug ?? "",
    excerpt: initial.excerpt ?? null,
    content: initial.content ?? "",
    status: initial.status ?? "draft",
    category: initial.category?.slug ?? null,
    tags: Array.isArray(initial.tags) ? initial.tags.map((tag) => tag.slug) : [],
    coverUrl: initial.coverUrl ?? null,
    coverAlt: initial.coverAlt ?? null,
    seoTitle: initial.seo?.title ?? null,
    seoDescription: initial.seo?.description ?? null,
    ogImageUrl: initial.seo?.ogImageUrl ?? null,
    scheduledAt: initial.scheduledAt ?? null,
    publishedAt: initial.publishedAt ?? null,
  };
}

export default function EditorShell({ initial }: EditorShellProps) {
  const defaultValues = useMemo(() => convertInitial(initial), [initial]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<string>("Nenhuma alteração.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initial?.updatedAt ?? null);
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string>(defaultValues.tags.join(", "));
  const slugManuallyEdited = useRef<boolean>(false);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState,
  } = useForm<PostContentInput>({
    resolver: zodResolver(postContentSchema),
    mode: "onChange",
    defaultValues,
  });

  const watchedId = watch("id");
  const watchedTitle = watch("title");
  const watchedSlug = watch("slug");

  useEffect(() => {
    reset(defaultValues, { keepDirty: false, keepErrors: false });
    setTagInput(defaultValues.tags.join(", "));
    slugManuallyEdited.current = Boolean(defaultValues.slug);
    setLastSavedAt(initial?.updatedAt ?? null);
    setSaveState("idle");
    setSaveMessage("Pronto para editar.");
  }, [defaultValues, initial, reset]);

  useEffect(() => {
    if (!slugManuallyEdited.current) {
      const nextSlug = slugify(watchedTitle || "");
      setValue("slug", nextSlug, { shouldDirty: true });
    }
  }, [watchedTitle, setValue]);

  const onSubmit = useCallback(
    async (values: PostContentInput) => {
      setSaveState("saving");
      setAutosaveError(null);
      setSaveMessage("Salvando alterações...");
      try {
        const response = await adminFetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.error || "Falha ao salvar");
        }
        if (json?.id) {
          setValue("id", json.id, { shouldDirty: false });
        }
        if (json?.slug) {
          setValue("slug", json.slug, { shouldDirty: false });
        }
        setSaveState("saved");
        const now = new Date().toISOString();
        setLastSavedAt(now);
        setSaveMessage(`Alterações salvas às ${new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date())}.`);
        setTimeout(() => setSaveState("idle"), 2000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível salvar.";
        setAutosaveError(message);
        setSaveState("error");
        setSaveMessage(message);
      }
    },
    [setValue],
  );

  const onError = useCallback(() => {
    setSaveState("error");
    setAutosaveError("Corrija os campos destacados antes de salvar.");
    setSaveMessage("Há erros de validação.");
  }, []);

  useEffect(() => {
    const subscription = watch(() => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      setSaveState((prev) => (prev === "saving" ? prev : "pending"));
      autosaveTimer.current = setTimeout(() => {
        void handleSubmit(onSubmit, onError)();
      }, 1500);
    });
    return () => {
      subscription.unsubscribe();
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [handleSubmit, onError, onSubmit, watch]);

  const manualSave = () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    void handleSubmit(onSubmit, onError)();
  };

  const applyTags = (value: string) => {
    setTagInput(value);
    const tags = value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    setValue("tags", tags, { shouldDirty: true });
  };

  const saveStateColor = {
    idle: "text-emerald-700",
    pending: "text-emerald-600",
    saving: "text-emerald-600",
    saved: "text-emerald-700",
    error: "text-red-600",
  }[saveState];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),280px]">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          manualSave();
        }}
      >
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Target className="h-4 w-4" aria-hidden />
              <span aria-live="polite" className={saveStateColor}>
                {saveMessage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {formState.isDirty ? (
                <span className="text-xs text-amber-600">Alterações não salvas</span>
              ) : lastSavedAt ? (
                <span className="text-xs text-emerald-600">
                  Última atualização: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(lastSavedAt))}
                </span>
              ) : null}
              <Button type="submit" variant="outline" size="sm" loading={saveState === "saving"}>
                <Save className="h-4 w-4" aria-hidden />
                Salvar agora
              </Button>
            </div>
          </div>
          {autosaveError ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {autosaveError}
            </p>
          ) : null}
        </div>

        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-900">Informações principais</h2>
          <div className="mt-4 grid gap-4">
            <label className="space-y-1 text-sm">
              <span>Título</span>
              <Input
                {...register("title")}
                aria-invalid={formState.errors.title ? "true" : "false"}
                placeholder="Título premium para o post"
              />
              {formState.errors.title ? (
                <span className="text-xs text-red-600">{formState.errors.title.message}</span>
              ) : null}
            </label>

            <label className="space-y-1 text-sm">
              <span>Slug</span>
              <Input
                {...register("slug")}
                value={watchedSlug}
                onChange={(event) => {
                  slugManuallyEdited.current = true;
                  setValue("slug", slugify(event.target.value), { shouldDirty: true });
                }}
                aria-invalid={formState.errors.slug ? "true" : "false"}
                placeholder="ex: guia-spitz-lulu"
              />
              {formState.errors.slug ? (
                <span className="text-xs text-red-600">{formState.errors.slug.message}</span>
              ) : (
                <span className="text-xs text-zinc-500">Urls amigáveis ficam minúsculas, com hífens e sem acentos.</span>
              )}
            </label>

            <label className="space-y-1 text-sm">
              <span>Resumo (160 caracteres)</span>
              <textarea
                {...register("excerpt")}
                rows={3}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-invalid={formState.errors.excerpt ? "true" : "false"}
                maxLength={320}
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formState.errors.excerpt?.message}</span>
                <span>{(watch("excerpt") ?? "").length} / 320</span>
              </div>
            </label>

            <label className="space-y-1 text-sm">
              <span>Categoria</span>
              <Input
                {...register("category")}
                placeholder="Ex: preparado, cuidados, temperamento"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Tags (separadas por vírgula)</span>
              <Input
                value={tagInput}
                onChange={(event) => applyTags(event.target.value)}
                placeholder="lulu da pomerânia, socialização, até 22 cm de altura"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Conteúdo (MDX)</span>
              <textarea
                {...register("content")}
                rows={20}
                className={cn(
                  "w-full rounded-xl border border-emerald-200 px-3 py-3 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                  "min-h-[320px]",
                )}
                aria-invalid={formState.errors.content ? "true" : "false"}
                placeholder="Escreva o conteúdo completo, alinhado às regras de tom premium e responsabilidade."
              />
              {formState.errors.content ? (
                <span className="text-xs text-red-600">{formState.errors.content.message}</span>
              ) : (
                <span className="text-xs text-zinc-500">
                  Reforçamos linguagem responsável, medidas “até 22 cm de altura” e associação “Spitz Alemão (Lulu da Pomerânia)”.
                </span>
              )}
            </label>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900">Status & agendamento</h3>
            <label className="space-y-1 text-sm">
              <span>Status</span>
              <select
                {...register("status")}
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Agendar publicação</span>
              <input
                type="datetime-local"
                value={toLocalInput(watch("scheduledAt"))}
                onChange={(event) => setValue("scheduledAt", fromLocalInput(event.target.value), { shouldDirty: true })}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              />
            </label>
            <label className="space-y-1 text-sm text-zinc-500">
              <span>Publicado em</span>
              <input
                type="text"
                value={watch("publishedAt") ? new Date(watch("publishedAt") as string).toLocaleString("pt-BR") : "—"}
                disabled
                className="w-full rounded-xl border border-emerald-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-900">Imagem de capa</h3>
            <label className="space-y-1 text-sm">
              <span>URL da imagem</span>
              <Input
                {...register("coverUrl")}
                placeholder="https://cdn.seusite.com/capa.webp"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Texto alternativo (descreva o Spitz Alemão Lulu da Pomerânia)</span>
              <Input
                {...register("coverAlt")}
                aria-invalid={formState.errors.coverAlt ? "true" : "false"}
              />
              {formState.errors.coverAlt ? (
                <span className="text-xs text-red-600">{formState.errors.coverAlt.message}</span>
              ) : (
                <span className="text-xs text-zinc-500">
                  Descreva com clareza, reforçando responsabilidade e padrão da raça.
                </span>
              )}
            </label>
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Em breve você poderá abrir a biblioteca de mídia para escolher fotos já otimizadas.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-emerald-900">SEO & Meta</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Título SEO (até 70 caracteres)</span>
              <Input
                {...register("seoTitle")}
                maxLength={70}
                aria-invalid={formState.errors.seoTitle ? "true" : "false"}
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formState.errors.seoTitle?.message}</span>
                <span>{(watch("seoTitle") ?? "").length} / 70</span>
              </div>
            </label>

            <label className="space-y-1 text-sm">
              <span>Descrição SEO (até 160 caracteres)</span>
              <textarea
                {...register("seoDescription")}
                rows={3}
                maxLength={160}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-invalid={formState.errors.seoDescription ? "true" : "false"}
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formState.errors.seoDescription?.message}</span>
                <span>{(watch("seoDescription") ?? "").length} / 160</span>
              </div>
            </label>

            <label className="space-y-1 text-sm">
              <span>Imagem OG</span>
              <Input
                {...register("ogImageUrl")}
                placeholder="https://cdn.seusite.com/og.jpg"
              />
            </label>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
              Garanta consistência com a página /blog para aproveitar snippets ricos e FAQ estruturado.
            </div>
          </div>
        </section>
      </form>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-900">Resumo</h2>
          <dl className="mt-3 space-y-2 text-sm text-zinc-600">
            <div className="flex justify-between">
              <dt>ID</dt>
              <dd>{watchedId ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Status</dt>
              <dd>{watch("status")}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Slug</dt>
              <dd>{watch("slug") || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Tags</dt>
              <dd>{watch("tags")?.length ?? 0}</dd>
            </div>
          </dl>
        </div>

        <VersionsPanel postId={watchedId} />

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-emerald-700 shadow-sm">
          <Wand2 className="mb-2 h-4 w-4" aria-hidden />
          <p>
            Em breve o assistente de IA ajudará a gerar outline, corpo e ALT text alinhados ao tom premium.
          </p>
        </div>
      </aside>
    </div>
  );
}
