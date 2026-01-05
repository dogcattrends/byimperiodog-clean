/*
  SANITY CONVENTIONS
  - Use `sanityClient` as the exported Sanity client instance.
  - Keep Sanity-specific types under `src/lib/sanity/*` and prefix with `Sanity`.
  - Prefer importing from `src/lib/sanity` (re-exports) to keep callsites stable.

  WARNING: This file only documents and exports the client. Do not copy
  Portable Text / body content into Supabase. See docs/BLOG_ARCHITECTURE.md.
*/

import createClient, { type SanityClient } from "@sanity/client";
const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION || "2023-08-01";
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset) {
  throw new Error("[sanity] Missing SANITY_PROJECT_ID or SANITY_DATASET env vars. Set them in .env.local for local dev.");
}

export const sanityClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
  perspective: "published",
});

