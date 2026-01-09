import { createClient } from "@sanity/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const write = process.argv.includes("--write");

function required(name: string, value?: string) {
  if (!value) throw new Error(`[publish-sanity-post-drafts] Missing ${name}`);
  return value;
}

async function main() {
  const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.SANITY_API_VERSION ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2023-08-01";
  const token = required("SANITY_TOKEN", process.env.SANITY_TOKEN);

  const client = createClient({
    projectId: required("SANITY_PROJECT_ID/NEXT_PUBLIC_SANITY_PROJECT_ID", projectId),
    dataset: required("SANITY_DATASET/NEXT_PUBLIC_SANITY_DATASET", dataset),
    apiVersion,
    token,
    useCdn: false,
    perspective: "raw",
  });

  const drafts = await client.fetch<
    Array<{ _id: string; _type: "post"; title?: string; slug?: { current?: string }; status?: string | null; publishedAt?: string | null }>
  >(
    '*[_type == "post" && _id in path("drafts.**")]{_id, _type, title, slug, status, publishedAt} | order(_updatedAt desc)'
  );

  if (!drafts.length) {
    console.log("[publish-sanity-post-drafts] No draft posts found.");
    return;
  }

  console.log(`[publish-sanity-post-drafts] Found ${drafts.length} draft post(s).`);
  for (const d of drafts) {
    const publishedId = d._id.replace(/^drafts\./, "");
    console.log(`- ${d._id} -> ${publishedId} | slug=${d.slug?.current ?? "(no slug)"} | status=${d.status ?? "(null)"}`);
  }

  if (!write) {
    console.log("\nDry-run only. Re-run with --write to publish these drafts.");
    console.log("Example: npx tsx scripts/publish-sanity-post-drafts.ts --write");
    return;
  }

  for (const draft of drafts) {
    const draftId = draft._id;
    const publishedId = draftId.replace(/^drafts\./, "");

    // Fetch full draft document to publish it as the canonical ID.
    const full = await client.getDocument<Record<string, unknown>>(draftId);
    if (!full) {
      console.warn(`[publish-sanity-post-drafts] Missing doc ${draftId}, skipping.`);
      continue;
    }

    const nextDoc: Record<string, unknown> = {
      ...full,
      _id: publishedId,
    };

    // Remove draft-only fields just in case.
    delete (nextDoc as any)._rev;

    // Make sure status is usable for the site filter.
    if (nextDoc.status === null || typeof nextDoc.status === "undefined") {
      nextDoc.status = "published";
    }

    // Commit: create/replace published, delete draft.
    await client
      .transaction()
      .createOrReplace(nextDoc as any)
      .delete(draftId)
      .commit();

    console.log(`[publish-sanity-post-drafts] Published ${publishedId} (deleted ${draftId}).`);
  }
}

main().catch((error) => {
  console.error("[publish-sanity-post-drafts] failed");
  console.error(error);
  process.exit(1);
});
