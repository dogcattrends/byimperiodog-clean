import { afterEach, describe, expect, it, vi } from "vitest";

async function loadDbWithSupabase(mock: () => unknown) {
 vi.doMock("@/lib/supabaseAdmin", () => ({
 supabaseAdmin: mock,
 }));
 const module = await import("@/lib/db");
 return module;
}

describe("db repositories", () => {
 afterEach(() => {
 vi.unmock("@/lib/supabaseAdmin");
 vi.resetModules();
 vi.clearAllMocks();
 });

 it("returns fallback when supabase client is unavailable", async () => {
 const { blogRevisionsRepo, commentRepo, mediaRepo, analyticsRepo, settingsRepo } = await loadDbWithSupabase(() => {
 throw new Error("supabase unavailable");
 });

 const revisions = await blogRevisionsRepo.listRevisions("p1", 5);
 expect(revisions).toEqual([]);
 const comments = await commentRepo.listComments();
 expect(comments.items).toEqual([]);
 const media = await mediaRepo.listAssets();
 expect(media.items).toEqual([]);
 const events = await analyticsRepo.listEvents();
 expect(events.items).toEqual([]);
 const settings = await settingsRepo.getSettings();
 expect(settings).toBeNull();
 });

 it("maps basic revision data from supabase rows", async () => {
 const chainResult = {
 data: [
 {
 id: "r1",
 post_id: "p1",
 snapshot: { slug: "primeiro-post" },
 reason: "manual",
 created_by: "admin@exemplo.com",
 created_at: "2025-10-24T10:00:00.000Z",
 },
 ],
 error: null,
 };

 const builder = {
 select: vi.fn().mockReturnThis(),
 order: vi.fn().mockReturnThis(),
 range: vi.fn().mockReturnThis(),
 eq: vi.fn().mockReturnThis(),
 or: vi.fn().mockReturnThis(),
 limit: vi.fn().mockReturnThis(),
 then: (resolve: (value: typeof chainResult) => void) => resolve(chainResult),
 };

 const mockClient = {
 from: vi.fn().mockReturnValue(builder),
 };

 const { blogRevisionsRepo } = await loadDbWithSupabase(() => mockClient);
 const result = await blogRevisionsRepo.listRevisions("p1", 20);

 expect(mockClient.from).toHaveBeenCalledWith("blog_post_revisions");
 expect(result).toHaveLength(1);
 expect(result[0]).toMatchObject({
 id: "r1",
 postId: "p1",
 reason: "manual",
 });
 });
});
