"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/toast";
import type { Puppy } from "@/domain/puppy";
import type { Color, City, PuppyStatus } from "@/domain/taxonomies";

import { MediaManager } from "./MediaManager";

function generateSlug(name: string, color: string, sex: string) {
  return `${name}-${color}-${sex}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

type PuppyFormRecord = Partial<Puppy> & { id?: string };
type CompatibleRecord = PuppyFormRecord & {
  midia?: string[];
  media?: string[];
  image_url?: string | null;
  video_url?: string | null;
};

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  file?: File;
  order: number;
};

type FormValues = {
  name: string;
  slug: string;
  color: Color;
  sex: "male" | "female";
  city: City;
  state: string;
  priceCents: number;
  status: PuppyStatus;
  description: string;
};

export default function PuppyForm({
  mode,
  record,
  onCompleted,
}: {
  mode: "create" | "edit";
  record?: PuppyFormRecord | null;
  onCompleted?: () => void;
}) {
  const isEdit = mode === "edit";
  const { push } = useToast();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(() => {
    const r = record || ({} as PuppyFormRecord);
    return {
      name: r.name || "",
      slug: r.slug || "",
      color: (r.color as Color) || ("creme" as Color),
      sex: (r.sex as "male" | "female") || "female",
      city: (r.city as City) || ("sao-paulo" as City),
      state: (r.state as string) || "SP",
      priceCents: r.priceCents || 0,
      status: (r.status as PuppyStatus) || ("available" as PuppyStatus),
      description: r.description || "",
    };
  });

  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [deletedPhotoUrls, setDeletedPhotoUrls] = useState<string[]>([]);
  const [deletedVideoUrls, setDeletedVideoUrls] = useState<string[]>([]);

  // Carregar fotos e vídeos existentes ao editar
  useEffect(() => {
    if (!isEdit || !record) return;

    const r = record as CompatibleRecord;

    function normalizeUrl(input: unknown): string {
      const raw = typeof input === "string" ? input : input == null ? "" : String(input);
      let url = raw.trim();
      if (!url) return url;

      // Corrige URLs sem protocolo
      if (url.startsWith("//")) url = `https:${url}`;

      // Se for caminho relativo do Supabase Storage, gerar URL pública
      // Exemplos aceitáveis: "puppies/arquivo.jpg", "public/puppies/arquivo.jpg"
      const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (SUPA && (/^(public\/)?puppies\//.test(url) || /^storage\//.test(url))) {
        const path = url.replace(/^public\//, "").replace(/^storage\/v1\/object\/public\//, "");
        url = `${SUPA.replace(/\/$/, "")}/storage/v1/object/public/${path}`;
      }

      // Google Drive formatos comuns -> link direto de visualização
      // ex: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      //     https://drive.google.com/open?id=FILE_ID
      //     https://drive.google.com/uc?id=FILE_ID
      const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        const id = driveMatch[1];
        return `https://drive.google.com/uc?export=view&id=${id}`;
      }

      // Dropbox: trocar ?dl=0 por download direto
      if (url.includes("dropbox.com")) {
        try {
          const u = new URL(url);
          if (u.hostname === "www.dropbox.com" && u.searchParams.get("dl") !== "1") {
            u.searchParams.set("dl", "1");
            return u.toString();
          }
        } catch {}
      }

      // Escapar espaços e caracteres inseguros
      try {
        const parsed = new URL(url);
        parsed.pathname = parsed.pathname.split(" ").map(encodeURIComponent).join("/").replace(/%2F/g, "/");
        url = parsed.toString();
      } catch {
        // se não for uma URL válida, tente encodeURI simples
        url = encodeURI(url);
      }

      return url;
    }

    function parseLegacyArray(input: unknown): string[] {
      if (Array.isArray(input)) return input.filter(Boolean) as string[];
      if (typeof input === "string") {
        const s = input.trim();
        if (!s) return [];
        // Tenta JSON
        if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("\"") && s.endsWith("\""))) {
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
          } catch {}
        }
        // Fallback: separadores comuns
        return s
          .split(/\n|;|,|\|/)
          .map((p) => p.replace(/^\"|\"$/g, "").trim())
          .filter(Boolean);
      }
      return [];
    }

    // Fotos: suporta tanto domain (images) quanto raw (midia/media + image_url)
    let photoUrls: string[] = [];
    if (Array.isArray(r.images) && r.images.length > 0) {
      photoUrls = r.images as string[];
    } else {
      const legacyArr: string[] = parseLegacyArray(r.midia).length
        ? parseLegacyArray(r.midia)
        : parseLegacyArray(r.media);
      const cover: string | null | undefined = r.image_url;
      if (cover) {
        const withoutCover = legacyArr.filter((u: string) => u !== cover);
        photoUrls = [cover, ...withoutCover];
      } else {
        photoUrls = legacyArr;
      }
    }

    // Normaliza e remove vazios/duplicados simples
    const seen = new Set<string>();
    photoUrls = photoUrls
      .map(normalizeUrl)
      .filter((u) => !!u)
      .filter((u) => {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      });

    if (photoUrls.length > 0) {
      const existingPhotos: MediaItem[] = photoUrls.map((url, index) => ({
        id: `existing-photo-${index}`,
        type: "image" as const,
        url,
        order: index,
      }));
      setPhotos(existingPhotos);
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[PuppyForm] fotos carregadas", photoUrls);
      }
    }

    // Vídeo: suporta tanto domain (videoUrl) quanto raw (video_url)
    const videoUrl = (r.videoUrl ?? r.video_url ?? undefined) as string | undefined;
    if (videoUrl) {
      const existingVideo: MediaItem = {
        id: "existing-video-0",
        type: "video" as const,
        url: normalizeUrl(videoUrl),
        order: 0,
      };
      setVideos([existingVideo]);
    }
  }, [isEdit, record]);

  useEffect(() => {
    if (!isEdit && values.name && values.color && values.sex) {
      setValues((s) => ({
        ...s,
        slug: generateSlug(values.name, values.color, values.sex),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, values.color, values.sex]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Obrigatório";
    if (!values.slug.trim()) e.slug = "Obrigatório";
    if (!values.color.trim()) e.color = "Obrigatório";
    if (!values.sex) e.sex = "Obrigatório";
    if (!values.city.trim()) e.city = "Obrigatório";
    if (!values.state.trim()) e.state = "Obrigatório";
    if (!values.status) e.status = "Obrigatório";
    if (!values.priceCents || values.priceCents <= 0) e.priceCents = "Preço deve ser > 0";
    if (photos.length === 0) e.photos = "Adicione pelo menos 1 foto";
    setErrors(e);
    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      push({ type: "error", message: "Corrija os campos destacados." });
      return;
    }
    try {
      setSubmitting(true);

      // Upload de mídia via FormData
      const formData = new FormData();
      formData.append("id", record?.id || "");
      formData.append("name", values.name.trim());
      formData.append("slug", values.slug.trim());
      formData.append("color", values.color);
      formData.append("sex", values.sex);
      formData.append("city", values.city);
      formData.append("state", values.state);
      formData.append("priceCents", values.priceCents.toString());
      formData.append("status", values.status);
      formData.append("description", values.description || "");

      // Adicionar URLs de mídias deletadas
      if (deletedPhotoUrls.length > 0) {
        formData.append("deletedPhotoUrls", JSON.stringify(deletedPhotoUrls));
      }
      if (deletedVideoUrls.length > 0) {
        formData.append("deletedVideoUrls", JSON.stringify(deletedVideoUrls));
      }

      // Separar fotos existentes (URLs) das novas (Files)
      const existingPhotoUrls = photos.filter(p => !p.file).map(p => p.url);
      const newPhotoFiles = photos.filter(p => p.file);

      // Enviar ordem das fotos existentes
      if (existingPhotoUrls.length > 0) {
        formData.append("existingPhotoUrls", JSON.stringify(existingPhotoUrls));
      }

      // Adicionar novas fotos
      newPhotoFiles.forEach((photo) => {
        if (photo.file) {
          formData.append("photos", photo.file);
        }
      });

      // Separar vídeos existentes das novas
      const existingVideoUrls = videos.filter(v => !v.file).map(v => v.url);
      const newVideoFiles = videos.filter(v => v.file);

      // Enviar URLs de vídeos existentes
      if (existingVideoUrls.length > 0) {
        formData.append("existingVideoUrls", JSON.stringify(existingVideoUrls));
      }

      // Adicionar novos vídeos
      newVideoFiles.forEach((video) => {
        if (video.file) {
          formData.append("videos", video.file);
        }
      });

      const res = await fetch("/api/admin/puppies/manage", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao salvar");
      push({ type: "success", message: isEdit ? "Filhote atualizado." : "Filhote criado." });
      onCompleted?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      push({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  const isAttention = values.status === "reserved" || values.status === "sold";

  return (
    <form onSubmit={onSubmit} className="space-y-[var(--space-6)]">
      <div className="grid gap-[var(--space-6)] md:grid-cols-2">
        <div className="space-y-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Dados principais</h2>

          <Field label="Nome *" value={values.name} onChange={(v) => set("name", v)} error={errors.name} />
          <Field label="Slug *" value={values.slug} onChange={(v) => set("slug", v)} error={errors.slug} placeholder="spitz-lulu-fofo" />

          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Select
              label="Cor *"
              value={values.color}
              onChange={(v) => set("color", v as Color)}
              options={["creme", "branco", "laranja", "preto", "caramelo"]}
              error={errors.color}
            />

            <Select
              label="Sexo *"
              value={values.sex}
              onChange={(v) => set("sex", v as "male" | "female")}
              options={[
                { value: "male", label: "Macho" },
                { value: "female", label: "Fêmea" },
              ]}
              error={errors.sex}
            />
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Field label="Cidade *" value={values.city} onChange={(v) => set("city", v as City)} error={errors.city} />
            <Field
              label="UF *"
              value={values.state}
              onChange={(v) => set("state", v.toUpperCase().slice(0, 2))}
              error={errors.state}
              placeholder="SP"
            />
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Field
              label="Preço (centavos) *"
              type="number"
              value={values.priceCents.toString()}
              onChange={(v) => set("priceCents", Number(v) || 0)}
              error={errors.priceCents}
            />

            <Select
              label="Status *"
              value={values.status}
              onChange={(v) => set("status", v as PuppyStatus)}
              options={[
                { value: "available", label: "Disponível" },
                { value: "reserved", label: "Reservado" },
                { value: "sold", label: "Vendido" },
              ]}
              error={errors.status}
            />
          </div>

          <label className="block text-sm font-semibold text-[var(--text)]">
            Descrição
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="mt-2 w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-3)] text-sm text-[var(--text)] shadow-[var(--elevation-1)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              rows={4}
            />
          </label>

          {isAttention && (
            <div className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-amber-50 px-[var(--space-3)] py-[var(--space-2)] text-sm text-amber-800">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Este filhote está marcado como {values.status === "reserved" ? "reservado" : "vendido"}.
            </div>
          )}
        </div>
      </div>

      {/* Media Section */}
      <MediaManager
        photos={photos}
        videos={videos}
        onPhotosChange={setPhotos}
        onVideosChange={setVideos}
        onPhotoDelete={(url: string) => setDeletedPhotoUrls(prev => [...prev, url])}
        onVideoDelete={(url: string) => setDeletedVideoUrls(prev => [...prev, url])}
      />

      {errors.photos && (
        <p className="rounded-[var(--radius-lg)] bg-rose-50 px-[var(--space-4)] py-[var(--space-2)] text-sm text-rose-600">
          ⚠️ {errors.photos}
        </p>
      )}

      {/* Submit Actions */}
      <div className="flex items-center justify-end gap-[var(--space-3)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white px-[var(--space-6)] py-[var(--space-4)] shadow-[var(--elevation-2)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-[var(--radius-full)] border border-[var(--border)] px-[var(--space-4)] py-[var(--space-2)] text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-emerald-600 px-[var(--space-4)] py-[var(--space-2)] text-sm font-semibold text-white shadow-[var(--elevation-2)] transition hover:bg-emerald-700 hover:shadow-[var(--elevation-3)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitting ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--text)]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-[var(--radius-lg)] border px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--text)] shadow-[var(--elevation-1)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          error ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<string | { value: string; label: string }>;
  error?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--text)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-10 w-full rounded-[var(--radius-lg)] border px-[var(--space-3)] text-sm text-[var(--text)] shadow-[var(--elevation-1)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          error ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      >
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const label = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {label}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}
