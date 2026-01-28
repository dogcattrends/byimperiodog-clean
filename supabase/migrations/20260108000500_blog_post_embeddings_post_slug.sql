-- Add post_slug to blog_post_embeddings to decouple from legacy blog_posts UUIDs
-- Allows embeddings to be keyed by slug (or Sanity IDs) instead of UUID.

-- NOTE: legacy schema used a composite PRIMARY KEY (post_id, source). To allow slug-first
-- embeddings (post_id nullable), we migrate the PK to a surrogate id.

alter table public.blog_post_embeddings
 add column if not exists id uuid default gen_random_uuid();

update public.blog_post_embeddings
set id = gen_random_uuid()
where id is null;

alter table public.blog_post_embeddings
 alter column id set not null;

-- Drop legacy composite PK (if present) so post_id can become nullable.
alter table public.blog_post_embeddings
 drop constraint if exists blog_post_embeddings_pkey;

-- Preserve legacy uniqueness when post_id exists.
create unique index if not exists blog_post_embeddings_post_id_source_uq
 on public.blog_post_embeddings (post_id, source)
 where post_id is not null;

alter table public.blog_post_embeddings
 add column if not exists post_slug text;

-- Allow post_id to be NULL going forward (slug-first).
alter table public.blog_post_embeddings
 alter column post_id drop not null;

-- New primary key.
alter table public.blog_post_embeddings
 add constraint blog_post_embeddings_pkey primary key (id);

create index if not exists idx_blog_post_embeddings_post_slug
 on public.blog_post_embeddings (post_slug);

-- Unique constraint for upserts by slug+source.
create unique index if not exists blog_post_embeddings_post_slug_source_uq
 on public.blog_post_embeddings (post_slug, source)
 where post_slug is not null;

-- Best-effort backfill from legacy blog_posts (one-time)
do $$
begin
 if to_regclass('public.blog_posts') is not null then
 update public.blog_post_embeddings e
 set post_slug = p.slug
 from public.blog_posts p
 where e.post_slug is null
 and e.post_id = p.id
 and p.slug is not null;
 end if;
end $$;
