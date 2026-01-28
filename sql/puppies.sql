-- sql/puppies.sql
-- Fonte única: tabela canonical de filhotes (Supabase)
-- Regras:
-- - Leitura pública: apenas is_active=true e status!='vendido'
-- - Escritas: apenas via service role (service role bypassa RLS)

begin;

-- Necessário para gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.puppies (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 title text not null,
 sex text not null check (sex in ('macho','femea')),
 color text not null,
 city text not null,
 state text not null,
 price_cents int not null,
 status text not null default 'disponivel' check (status in ('disponivel','reservado','vendido')),
 main_image_url text,
 gallery jsonb not null default '[]'::jsonb,
 badges jsonb not null default '[]'::jsonb,
 description text,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists puppies_status_idx on public.puppies(status);
create index if not exists puppies_is_active_idx on public.puppies(is_active);
create index if not exists puppies_created_at_idx on public.puppies(created_at desc);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
 new.updated_at = now();
 return new;
end;
$$;

drop trigger if exists set_updated_at_puppies on public.puppies;
create trigger set_updated_at_puppies
before update on public.puppies
for each row
execute function public.set_updated_at();

-- RLS
alter table public.puppies enable row level security;

drop policy if exists public_read_active_unsold_puppies on public.puppies;
create policy public_read_active_unsold_puppies
on public.puppies
for select
to anon, authenticated
using (
 is_active = true
 and status <> 'vendido'
);

-- Sem políticas de insert/update/delete => negado para anon/authenticated.
-- Service role bypassa RLS e continua com permissão total.

commit;
