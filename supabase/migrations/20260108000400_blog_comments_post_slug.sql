-- Add post_slug to blog_comments to decouple from legacy blog_posts UUIDs
-- This enables comments to attach to Sanity posts by slug (canonical in the app).

alter table public.blog_comments
 add column if not exists post_slug text;

create index if not exists idx_blog_comments_post_slug
 on public.blog_comments (post_slug);

-- Best-effort backfill from legacy blog_posts (one-time). Safe even if blog_posts is later removed.
-- Requires blog_posts(id uuid, slug text) to exist at migration time.
update public.blog_comments c
set post_slug = p.slug
from public.blog_posts p
where c.post_slug is null
 and c.post_id = p.id
 and p.slug is not null;
