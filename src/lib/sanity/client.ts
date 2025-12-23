import createClient from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
const apiVersion = process.env.SANITY_API_VERSION || "2023-08-01";
const token = process.env.SANITY_TOKEN;

if (!projectId || !dataset) {
  console.warn("[sanity] Missing SANITY_PROJECT_ID or SANITY_DATASET env vars.");
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
  perspective: "published",
});

