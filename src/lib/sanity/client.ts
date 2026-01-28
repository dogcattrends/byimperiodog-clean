/*
 SANITY CONVENTIONS
 - Use `sanityClient` as the exported Sanity client instance.
 - Keep Sanity-specific types under `src/lib/sanity/*` and prefix with `Sanity`.
 - Prefer importing from `src/lib/sanity` (re-exports) to keep callsites stable.

 WARNING: This file only documents and exports the client. Do not copy
 Portable Text / body content into Supabase. See docs/BLOG_ARCHITECTURE.md.
*/

import { createClient, type SanityClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion =
 process.env.SANITY_API_VERSION ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2023-08-01";
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset) {
 throw new Error(
 "[sanity] Missing projectId/dataset env vars. Set SANITY_PROJECT_ID + SANITY_DATASET (server) or NEXT_PUBLIC_SANITY_PROJECT_ID + NEXT_PUBLIC_SANITY_DATASET (public)."
 );
}

const useCdn = !token && process.env.NODE_ENV === "production";

export const sanityClient: SanityClient = createClient({
 projectId,
 dataset,
 apiVersion,
 token,
 useCdn,
 perspective: "published",
});

