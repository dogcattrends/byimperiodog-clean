import type { Puppy } from "./puppy";
import { PuppyAge } from "./puppy";
import { TaxonomyHelpers } from "./taxonomies";

const sanitizeSlug = (value?: string | null) =>
 value
 ?.normalize("NFC")
 .toLowerCase()
 .trim()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/^-+|-+$/g, "");

const humanizeLabel = (value?: string | null) => {
 if (!value) return "";
 return value
 .split(/[-_ ]+/)
 .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ""))
 .filter(Boolean)
 .join(" ");
};

const formatColorLabel = (value?: string | null) => {
 const slug = sanitizeSlug(value);
 if (!slug) return null;
 const color = TaxonomyHelpers.getColorBySlug(slug);
 return color?.label ?? humanizeLabel(slug);
};

const formatSexLabel = (value?: string | null) => {
 if (!value) return null;
 const normalized = value.normalize("NFC").toLowerCase();
 if (normalized.includes("female") || normalized.includes("fêmea") || normalized.includes("femea")) {
 return "Fêmea";
 }
 if (normalized.includes("male") || normalized.includes("macho")) {
 return "Macho";
 }
 return humanizeLabel(value);
};

const formatAgeLabel = (value?: Date | string | null) => {
 if (!value) return null;
 const date = value instanceof Date ? value : new Date(value);
 if (Number.isNaN(date.getTime())) return null;
 const age = PuppyAge.fromDate(date);
 const weeks = age.getWeeks();
 if (weeks < 1) return "Novo";
 return age.formatAge();
};

export type PuppyMeta = {
 colorLabel: string | null;
 sexLabel: string | null;
 combinedLabel: string | null;
 ageLabel: string | null;
};

export function formatPuppyMeta(puppy: Partial<Puppy>): PuppyMeta {
 const colorLabel = formatColorLabel(puppy.color ?? null);
 const sexLabel = formatSexLabel(puppy.sex ?? null);
 const combinedLabel = [colorLabel, sexLabel].filter(Boolean).join(" • ") || null;
 const ageLabel = formatAgeLabel(puppy.birthDate ?? null);
 return { colorLabel, sexLabel, combinedLabel, ageLabel };
}
