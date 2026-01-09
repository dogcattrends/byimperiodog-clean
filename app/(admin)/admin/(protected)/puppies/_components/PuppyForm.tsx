"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/toast";
import type { Puppy } from "@/domain/puppy";
import { CITIES, PUPPY_COLORS, type Color, type City, type PuppyStatus } from "@/domain/taxonomies";
import { parseBRLToCents } from "@/lib/price";
import type { RawPuppy } from "@/types/puppy";

import { MediaManager } from "./MediaManager";

function generateSlug(name: string, color: string, sex: string) {
  return `${name}-${color}-${sex}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  file?: File;
  order: number;
};

type PuppyFormRecord = (Partial<Puppy> & RawPuppy) & {
  images?: string[] | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  created_at?: string | null;
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

type OrderEntry = {
  type: "existing" | "new";
  ref: string;
};

type TabId = "basico" | "comercial" | "midia" | "seo";

const DEFAULT_COLOR: Color = "creme";
const DEFAULT_CITY: City = "sao-paulo";
const DEFAULT_STATE = "SP";
const DEFAULT_STATUS: PuppyStatus = "available";

const COLOR_ALIASES: Record<string, Color> = {
  creme: "creme",
  champagne: "creme",
  branco: "branco",
  white: "branco",
  laranja: "laranja",
  orange: "laranja",
  caramelo: "laranja",
  preto: "preto",
  black: "preto",
  particolor: "particolor",
  chocolate: "chocolate",
  sable: "sable",
  azul: "azul",
};

const COLOR_OPTIONS = Object.entries(PUPPY_COLORS).map(([value, meta]) => ({
  value: value as Color,
  label: meta.label,
}));

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: "basico", label: "Basico", description: "Nome, slug e cor." },
  { id: "comercial", label: "Comercial", description: "Local, status e preco." },
  { id: "midia", label: "Midia", description: "Fotos e videos." },
  { id: "seo", label: "SEO", description: "Descricao do anuncio." },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeColor(value: unknown): Color {
  if (typeof value === "string" && value.trim()) {
    const slug = slugify(value);
    if (slug in PUPPY_COLORS) return slug as Color;
    if (COLOR_ALIASES[slug]) return COLOR_ALIASES[slug];
  }
  return DEFAULT_COLOR;
}

function normalizeSex(value: unknown): "male" | "female" {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.includes("mach") || normalized === "male") return "male";
  }
  return "female";
}

function normalizeStatus(value: unknown): PuppyStatus {
  if (typeof value === "string" && value.trim()) {
    const normalized = value.toLowerCase();
    if (normalized.startsWith("reserv")) return "reserved";
    if (normalized.startsWith("vend")) return "sold";
    if (normalized.includes("pending") || normalized.startsWith("pend")) return "pending";
    if (normalized.includes("indisp") || normalized === "unavailable") return "unavailable";
    if (normalized.startsWith("dispon") || normalized === "available") return "available";
  }
  return DEFAULT_STATUS;
}

function normalizeCity(value: unknown): City {
  if (typeof value === "string" && value.trim()) {
    const slug = slugify(value);
    if (slug in CITIES) return slug as City;
    const match = Object.entries(CITIES).find(([, data]) => slugify(data.name) === slug);
    if (match) return match[0] as City;
    if (slug) return slug as City;
  }
  return DEFAULT_CITY;
}

function normalizeState(value: unknown, city?: City): string {
  const fallback = city && CITIES[city]?.state ? CITIES[city].state : DEFAULT_STATE;
  if (typeof value === "string" && value.trim()) {
    const cleaned = value.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(cleaned)) return cleaned;
    if (cleaned.length >= 2) return cleaned.slice(0, 2);
  }
  return fallback;
}

function normalizePrice(record?: PuppyFormRecord | null): number {
  if (!record) return 0;
  const centsCandidates = [record.priceCents, record.price_cents];
  for (const candidate of centsCandidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
      return Math.round(candidate);
    }
  }

  if (typeof record.preco === "number" && Number.isFinite(record.preco)) {
    return Math.round(record.preco * 100);
  }

  if (typeof record.preco === "string" && record.preco.trim()) {
    const numeric = record.preco
      .replace(/R\$/gi, "")
      .replace(/\s+/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(/,/g, ".");
    const parsed = Number(numeric);
    if (Number.isFinite(parsed)) return Math.round(parsed * 100);
  }

  return 0;
}

function normalizeUrl(input: unknown): string {
  const raw = typeof input === "string" ? input : input == null ? "" : String(input);
  let url = raw.trim();
  if (!url) return "";

  if (url.startsWith("//")) url = `https:${url}`;

  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (supabaseBase) {
    if (url.startsWith(`${supabaseBase}/storage/v1/object/sign/`)) {
      const path = url.replace(`${supabaseBase}/storage/v1/object/sign/`, "").split("?")[0];
      url = `${supabaseBase}/storage/v1/object/public/${path}`;
    }

    if (/^(public\/)?puppies\//.test(url) || /^storage\//.test(url)) {
      const path = url.replace(/^public\//, "").replace(/^storage\/v1\/object\/public\//, "");
      url = `${supabaseBase}/storage/v1/object/public/${path}`;
    }
  }

  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    const id = driveMatch[1];
    return `https://drive.google.com/uc?export=view&id=${id}`;
  }

  if (url.includes("dropbox.com")) {
    try {
      const dropboxUrl = new URL(url);
      if (dropboxUrl.hostname === "www.dropbox.com" && dropboxUrl.searchParams.get("dl") !== "1") {
        dropboxUrl.searchParams.set("dl", "1");
        return dropboxUrl.toString();
      }
    } catch {
      // ignore
    }
  }

  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname
      .split(" ")
      .map((segment) => encodeURIComponent(segment))
      .join("/")
      .replace(/%2F/g, "/");
    url = parsed.toString();
  } catch {
    url = encodeURI(url);
  }

  return url;
}

function parseLegacyArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return uniqueList(
      input
        .map((item) => {
          if (!item) return null;
          if (typeof item === "string") return normalizeUrl(item);
          if (typeof item === "object" && (item as { url?: string }).url) return normalizeUrl((item as { url?: string }).url);
          if (typeof item === "object" && (item as { src?: string }).src) return normalizeUrl((item as { src?: string }).src);
          return null;
        })
        .filter((url): url is string => Boolean(url))
    );
  }

  if (typeof input === "string" && input.trim()) {
    const trimmed = input.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parseLegacyArray(parsed);
      } catch {
        // ignore JSON parsing errors
      }
    }

    return uniqueList(
      trimmed
        .split(/\n|;|,|\|/)
        .map((chunk) => chunk.replace(/^"|"$/g, "").trim())
        .map(normalizeUrl)
        .filter((u): u is string => typeof u === "string" && u.length > 0)
    );
  }

  return [];
}

function inferTypeFromUrl(url: string): MediaItem["type"] {
  return /\.(mp4|webm|mov|m4v|avi)$/i.test(url) ? "video" : "image";
}

function uniqueList(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (!item) return false;
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

function extractStructuredMedia(record?: PuppyFormRecord | null): Array<{ url: string; type: MediaItem["type"] }> {
  if (!record) return [];
  const sources: unknown[] = [record.midia, record.media];
  for (const source of sources) {
    if (!Array.isArray(source) || source.length === 0) continue;
    const entries = source
      .map((entry) => {
        if (!entry) return null;
        const rawUrl = typeof entry === "string" ? entry : (entry as { url?: string | null; src?: string | null }).url ?? (entry as { src?: string | null }).src ?? "";
        if (!rawUrl) return null;
        const url = normalizeUrl(rawUrl);
        if (!url) return null;
        const declaredType = typeof entry === "object" && (entry as { type?: string }).type === "video" ? "video" : null;
        return { url, type: declaredType ?? inferTypeFromUrl(url) };
      })
      .filter((item): item is { url: string; type: MediaItem["type"] } => Boolean(item));
    if (entries.length) return entries;
  }
  return [];
}

function buildInitialValues(record?: PuppyFormRecord | null): FormValues {
  if (!record) {
    return {
      name: "",
      slug: "",
      color: DEFAULT_COLOR,
      sex: "female",
      city: DEFAULT_CITY,
      state: DEFAULT_STATE,
      priceCents: 0,
      status: DEFAULT_STATUS,
      description: "",
    };
  }

  const color = normalizeColor(record.color ?? record.cor);
  const sex = normalizeSex(record.sex ?? record.gender ?? record.sexo);
  const city = normalizeCity(record.city ?? record.cidade);
  const state = normalizeState(record.state ?? record.estado, city);
  const status = normalizeStatus(record.status);
  const priceCents = normalizePrice(record);
  const name = (record.name ?? record.nome ?? "").trim();
  const slug = (record.slug ?? "") || (name ? generateSlug(name, color, sex) : "");
  const description = (record.description ?? record.descricao ?? "").trim();

  return {
    name,
    slug,
    color,
    sex,
    city,
    state,
    priceCents,
    status,
    description,
  };
}

function buildOrderPayload(items: MediaItem[]): OrderEntry[] {
  return items.map((item) => ({
    type: item.file ? "new" : "existing",
    ref: item.file ? item.id : item.url,
  }));
}

function buildUploadFilename(item: MediaItem) {
  const fallbackName = `${item.type}-${item.id}.${item.type === "image" ? "jpg" : "mp4"}`;
  const original = item.file?.name?.trim() ? item.file.name : fallbackName;
  return `${item.id}::${original}`;
}

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

  const [values, setValues] = useState<FormValues>(() => buildInitialValues(record));
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [deletedPhotoUrls, setDeletedPhotoUrls] = useState<string[]>([]);
  const [deletedVideoUrls, setDeletedVideoUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("basico");
  const [priceDisplay, setPriceDisplay] = useState<string>(() => formatBRLFromCents(buildInitialValues(record).priceCents));

  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (!isEdit || !record) return;

    const structured = extractStructuredMedia(record);
    const structuredPhotos = structured.filter((entry) => entry.type === "image").map((entry) => entry.url);
    const structuredVideos = structured.filter((entry) => entry.type === "video").map((entry) => entry.url);

    const legacyMedia = parseLegacyArray(record.midia ?? record.media);
    const legacyPhotos = legacyMedia.filter((url) => inferTypeFromUrl(url) === "image");
    const legacyVideos = legacyMedia.filter((url) => inferTypeFromUrl(url) === "video");

    const mappedImages: string[] = Array.isArray(record.images)
      ? (record.images as string[]).map((s) => normalizeUrl(s))
      : [];
    const imageLibrary: string[] = mappedImages.filter((u: string) => u.length > 0);

    let photoUrls: string[] = structuredPhotos.length ? structuredPhotos : imageLibrary.length ? imageLibrary : legacyPhotos;
    const coverCandidate = normalizeUrl(record.image_url ?? record.imageUrl);
    if (coverCandidate) {
      photoUrls = [coverCandidate, ...photoUrls.filter((url) => url !== coverCandidate)];
    }

    let videoUrls: string[] = structuredVideos.length ? structuredVideos : legacyVideos;
    if (!videoUrls.length) {
      const directVideo = normalizeUrl(record.video_url ?? record.videoUrl);
      if (directVideo) videoUrls = [directVideo];
    }

    const finalPhotos = uniqueList(photoUrls);
    const finalVideos = uniqueList(videoUrls);

    setPhotos(
      finalPhotos.map((url, index) => ({
        id: `existing-photo-${index}`,
        type: "image" as const,
        url,
        order: index,
      })),
    );
    setVideos(
      finalVideos.map((url, index) => ({
        id: `existing-video-${index}`,
        type: "video" as const,
        url,
        order: index,
      })),
    );
    setDeletedPhotoUrls([]);
    setDeletedVideoUrls([]);
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

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  function handlePriceDisplayChange(next: string) {
    const formatted = formatBRLInput(next);
    setPriceDisplay(formatted);
    set("priceCents", parseBRLToCents(formatted));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Obrigatorio";
    if (!values.slug.trim()) e.slug = "Obrigatorio";
    if (!values.color.trim()) e.color = "Obrigatorio";
    if (!values.sex) e.sex = "Obrigatorio";
    if (!values.city.trim()) e.city = "Obrigatorio";
    if (!values.state.trim()) e.state = "Obrigatorio";
    if (!values.status) e.status = "Obrigatorio";
    if (!values.priceCents || values.priceCents <= 0) e.priceCents = "Preco deve ser maior que zero";
    if (photos.length === 0) e.photos = "Adicione pelo menos uma foto";
    setErrors(e);
    setStatusMessage(Object.keys(e).length ? "Corrija os campos destacados." : "");
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0];
      const el = inputRefs.current[first];
      if (el) {
        try {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {
          // ignore
        }
      }
    }
    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      const msg = "Corrija os campos destacados.";
      push({ type: "error", message: msg });
      setStatusMessage(msg);
      return;
    }
    try {
      setSubmitting(true);

      const normalizedName = values.name.trim();
      const normalizedSlug = values.slug.trim() || generateSlug(values.name, values.color, values.sex);
      const normalizedColor = normalizeColor(values.color);
      const normalizedSex = normalizeSex(values.sex);
      const normalizedCity = normalizeCity(values.city);
      const normalizedState = normalizeState(values.state, normalizedCity);
      const normalizedStatus = normalizeStatus(values.status);
      const normalizedPrice = Math.max(0, Math.round(values.priceCents));
      const normalizedDescription = values.description?.trim() ?? "";

      const formData = new FormData();
      formData.append("id", record?.id || "");
      formData.append("name", normalizedName);
      formData.append("slug", normalizedSlug);
      formData.append("color", normalizedColor);
      formData.append("sex", normalizedSex);
      formData.append("city", normalizedCity);
      formData.append("state", normalizedState);
      formData.append("cidade", normalizedCity);
      formData.append("estado", normalizedState);
      formData.append("priceCents", normalizedPrice.toString());
      formData.append("status", normalizedStatus);
      formData.append("descricao", normalizedDescription);

      const deletedPhotos = uniqueList(deletedPhotoUrls);
      const deletedVideos = uniqueList(deletedVideoUrls);
      if (deletedPhotos.length > 0) {
        formData.append("deletedPhotoUrls", JSON.stringify(deletedPhotos));
      }
      if (deletedVideos.length > 0) {
        formData.append("deletedVideoUrls", JSON.stringify(deletedVideos));
      }

      const existingPhotoUrls = uniqueList(photos.filter((p) => !p.file).map((p) => p.url));
      const newPhotoFiles = photos.filter((p) => p.file);

      if (existingPhotoUrls.length > 0) {
        formData.append("existingPhotoUrls", JSON.stringify(existingPhotoUrls));
      }

      const photoOrder = buildOrderPayload(photos);
      if (photoOrder.length > 0) {
        formData.append("photoOrder", JSON.stringify(photoOrder));
      }

      newPhotoFiles.forEach((photo) => {
        if (photo.file) {
          formData.append("photos", photo.file, buildUploadFilename(photo));
        }
      });

      const existingVideoUrls = uniqueList(videos.filter((v) => !v.file).map((v) => v.url));
      const newVideoFiles = videos.filter((v) => v.file);

      if (existingVideoUrls.length > 0) {
        formData.append("existingVideoUrls", JSON.stringify(existingVideoUrls));
      }

      const videoOrder = buildOrderPayload(videos);
      if (videoOrder.length > 0) {
        formData.append("videoOrder", JSON.stringify(videoOrder));
      }

      newVideoFiles.forEach((video) => {
        if (video.file) {
          formData.append("videos", video.file, buildUploadFilename(video));
        }
      });

      const res = await fetch("/api/admin/puppies/manage", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      let json: any = null;
      let responseText = "";
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (contentType.includes("application/json")) {
        json = await res.json().catch(() => null);
      } else {
        responseText = await res.text().catch(() => "");
        try {
          json = responseText ? JSON.parse(responseText) : null;
        } catch {
          json = null;
        }
      }

      if (!res.ok) {
        if (json?.fieldErrors && typeof json.fieldErrors === "object") {
          setErrors(json.fieldErrors as Record<string, string>);
          setStatusMessage("Corrija os campos destacados.");
          const first = Object.keys(json.fieldErrors)[0];
          const el = inputRefs.current[first];
          if (el) {
            try {
              el.focus();
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch {
              // ignore
            }
          }
        }
        const errorMsg = json?.error || responseText || res.statusText || "Erro ao salvar";
        throw new Error(errorMsg);
      }

      const successMsg = isEdit ? "Filhote atualizado." : "Filhote criado.";
      push({ type: "success", message: successMsg });
      setStatusMessage(successMsg);
      if (onCompleted) {
        onCompleted();
        return;
      }

      router.replace("/admin/filhotes");
      setTimeout(() => {
        router.refresh();
      }, 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      push({ type: "error", message });
      setStatusMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  const isAttention = values.status === "reserved" || values.status === "sold";

  return (
    <form onSubmit={onSubmit} className="space-y-[var(--space-6)]">
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>

      <div className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-3)] shadow-[var(--elevation-2)]">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col gap-0.5 rounded-[var(--radius-lg)] border px-4 py-2 text-left text-sm font-semibold transition ${
                  isActive
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-emerald-200"
                }`}
                aria-pressed={isActive}
              >
                <span>{tab.label}</span>
                <span className="text-xs font-normal text-[var(--text-muted)]">{tab.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "basico" && (
        <section className="space-y-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Basico</h2>
          <Field name="name" label="Nome *" value={values.name} onChange={(v) => set("name", v)} error={errors.name} inputRef={(el) => (inputRefs.current["name"] = el)} />
          <Field
            name="slug"
            label="Slug *"
            value={values.slug}
            onChange={(v) => set("slug", v)}
            error={errors.slug}
            placeholder="spitz-lulu-fofo"
            inputRef={(el) => (inputRefs.current["slug"] = el)}
          />

          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Select
              name="color"
              label="Cor *"
              value={values.color}
              onChange={(v) => set("color", v as Color)}
              options={COLOR_OPTIONS}
              error={errors.color}
              inputRef={(el) => (inputRefs.current["color"] = el)}
            />

            <Select
              name="sex"
              label="Sexo *"
              value={values.sex}
              onChange={(v) => set("sex", v as "male" | "female")}
              options={[
                { value: "male", label: "Macho" },
                { value: "female", label: "Femea" },
              ]}
              error={errors.sex}
              inputRef={(el) => (inputRefs.current["sex"] = el)}
            />
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Field name="city" label="Cidade *" value={values.city} onChange={(v) => set("city", v as City)} error={errors.city} inputRef={(el) => (inputRefs.current["city"] = el)} />
            <Field
              name="state"
              label="UF *"
              value={values.state}
              onChange={(v) => set("state", v.toUpperCase().slice(0, 2))}
              error={errors.state}
              placeholder="SP"
              inputRef={(el) => (inputRefs.current["state"] = el)}
            />
          </div>
        </section>
      )}

      {activeTab === "comercial" && (
        <section className="space-y-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Comercial</h2>
          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Field
              name="priceCents"
              label="Preco *"
              value={priceDisplay}
              onChange={handlePriceDisplayChange}
              error={errors.priceCents}
              placeholder="R$ 7.500,00"
              inputMode="decimal"
              inputRef={(el) => (inputRefs.current["priceCents"] = el)}
            />

            <Select
              name="status"
              label="Status *"
              value={values.status}
              onChange={(v) => set("status", v as PuppyStatus)}
              options={[
                { value: "available", label: "Disponivel" },
                { value: "reserved", label: "Reservado" },
                { value: "sold", label: "Vendido" },
                { value: "pending", label: "Pendente" },
                { value: "unavailable", label: "Indisponivel" },
              ]}
              error={errors.status}
              inputRef={(el) => (inputRefs.current["status"] = el)}
            />
          </div>

          {isAttention && (
            <div className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-amber-50 px-[var(--space-3)] py-[var(--space-2)] text-sm text-amber-800">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Este filhote esta marcado como {values.status === "reserved" ? "reservado" : "vendido"}.
            </div>
          )}
        </section>
      )}

      {activeTab === "midia" && (
        <section className="space-y-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Midia</h2>
          <MediaManager
            photos={photos}
            videos={videos}
            onPhotosChange={setPhotos}
            onVideosChange={setVideos}
            onPhotoDelete={(url: string) => setDeletedPhotoUrls((prev) => [...prev, url])}
            onVideoDelete={(url: string) => setDeletedVideoUrls((prev) => [...prev, url])}
          />

          {errors.photos && (
            <p className="rounded-[var(--radius-lg)] bg-rose-50 px-[var(--space-4)] py-[var(--space-2)] text-sm text-rose-600">
              {errors.photos}
            </p>
          )}
        </section>
      )}

      {activeTab === "seo" && (
        <section className="space-y-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">SEO</h2>
          <label className="block text-sm font-semibold text-[var(--text)]">
            Descricao
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className={`mt-2 w-full rounded-[var(--radius-lg)] border px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--text)] shadow-[var(--elevation-1)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                errors.description ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-[var(--surface)]"
              }`}
              rows={6}
            />
            {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
          </label>
        </section>
      )}

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
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  inputRef,
  inputMode,
}: {
  name?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  inputRef?: (el: HTMLInputElement | null) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--text)]">
      {label}
      <input
        id={name}
        name={name}
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? "true" : "false"}
        aria-required={type !== "number" ? true : undefined}
        aria-describedby={error && name ? `${name}-error` : undefined}
        className={`mt-2 w-full rounded-[var(--radius-lg)] border px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--text)] ${
          error ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      />
      {error && (
        <p id={name ? `${name}-error` : undefined} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </label>
  );
}

function formatBRLInput(v: string) {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  if (!Number.isFinite(cents)) return "";
  return formatBRLFromCents(cents);
}

function formatBRLFromCents(cents: number) {
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function Select({
  name,
  label,
  value,
  onChange,
  options,
  error,
  inputRef,
}: {
  name?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<string | { value: string; label: string }>;
  error?: string;
  inputRef?: (el: HTMLSelectElement | null) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--text)]">
      {label}
      <select
        id={name}
        name={name}
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error && name ? `${name}-error` : undefined}
        className={`mt-2 w-full rounded-[var(--radius-lg)] border px-[var(--space-3)] text-sm text-[var(--text)] ${
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
      {error && (
        <p id={name ? `${name}-error` : undefined} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </label>
  );
}






