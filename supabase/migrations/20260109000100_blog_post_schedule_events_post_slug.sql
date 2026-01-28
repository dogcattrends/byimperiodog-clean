-- Add post_slug to blog_post_schedule_events to decouple from legacy blog_posts UUIDs
-- This enables schedule events to target Sanity posts (canonical) by slug.

alter table public.blog_post_schedule_events
 add column if not exists post_slug text;

create index if not exists idx_blog_post_schedule_events_post_slug
 on public.blog_post_schedule_events (post_slug);

-- Best-effort backfill from legacy blog_posts (one-time). Safe even if blog_posts is later removed.
-- Requires blog_posts(id uuid, slug text) to exist at migration time.
do $$
begin
 if to_regclass('public.blog_posts') is not null then
 update public.blog_post_schedule_events e
 set post_slug = p.slug
 from public.blog_posts p
 where e.post_slug is null
 and e.post_id = p.id
 and p.slug is not null;
 end if;
end $$;
