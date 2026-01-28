-- Migration: create_puppies_v2_definitive
-- Data: 2026-01-08
--
-- Objetivo: adicionar um schema definitivo para filhotes SEM quebrar o projeto atual.
-- Estratégia: criar uma nova tabela public.puppies_v2 (não altera a public.puppies existente).
--
-- Padrão do projeto: writes administrativos usam SUPABASE_SERVICE_ROLE_KEY (role service_role), que bypassa RLS.
-- Mesmo assim, mantemos políticas explícitas (auth.role() = 'service_role') para documentar a intenção.

begin;

create extension if not exists pgcrypto;

-- Enum para sexo (novo schema). Não conflita com public.sexo_type existente.
do $$
begin
 if not exists (select 1 from pg_type where typname = 'puppy_gender') then
 create type public.puppy_gender as enum ('macho', 'femea');
 end if;
end $$;

-- A enum public.puppy_status já existe no projeto; garantimos por segurança.
do $$
begin
 if not exists (select 1 from pg_type where typname = 'puppy_status') then
 create type public.puppy_status as enum ('disponivel', 'reservado', 'vendido');
 end if;
end $$;

create table if not exists public.puppies_v2 (
 id uuid primary key default gen_random_uuid(),

 name text not null,
 breed text not null,
 color text,
 gender public.puppy_gender not null,

 price integer not null check (price >= 0),
 status public.puppy_status not null default 'disponivel'::public.puppy_status,

 city text,
 state text,

 description text,

 -- features: objeto JSONB com flags booleanas (pedigree, video, entrega_segura)
 features jsonb not null default '{}'::jsonb
 check (jsonb_typeof(features) = 'object')
 check (
 (not (features ? 'pedigree') or jsonb_typeof(features->'pedigree') = 'boolean')
 and (not (features ? 'video') or jsonb_typeof(features->'video') = 'boolean')
 and (not (features ? 'entrega_segura') or jsonb_typeof(features->'entrega_segura') = 'boolean')
 ),

 -- images: array JSONB de strings (URLs do Supabase Storage)
 images jsonb not null default '[]'::jsonb
 check (jsonb_typeof(images) = 'array')
 check (not jsonb_path_exists(images, '$[*] ? (@.type() != "string")')),

 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- updated_at (função public.set_updated_at já existe no schema remoto)
do $$
begin
 if not exists (
 select 1
 from pg_trigger
 where tgname = 'trg_puppies_v2_set_updated_at'
 ) then
 create trigger trg_puppies_v2_set_updated_at
 before update on public.puppies_v2
 for each row
 execute function public.set_updated_at();
 end if;
end $$;

-- Índices
create index if not exists puppies_v2_status_idx on public.puppies_v2 (status);
create index if not exists puppies_v2_breed_idx on public.puppies_v2 (breed);
create index if not exists puppies_v2_city_state_idx on public.puppies_v2 (state, city);
create index if not exists puppies_v2_price_idx on public.puppies_v2 (price);
create index if not exists puppies_v2_created_at_idx on public.puppies_v2 (created_at desc);
create index if not exists puppies_v2_features_gin_idx on public.puppies_v2 using gin (features jsonb_path_ops);

-- Comentários
comment on table public.puppies_v2 is 'Tabela definitiva de filhotes (v2). Não substitui a tabela public.puppies atual automaticamente.';

comment on column public.puppies_v2.id is 'UUID do filhote (PK). Gerado automaticamente.';
comment on column public.puppies_v2.name is 'Nome do filhote.';
comment on column public.puppies_v2.breed is 'Raça do filhote.';
comment on column public.puppies_v2.color is 'Cor declarada do filhote.';
comment on column public.puppies_v2.gender is 'Sexo do filhote: macho ou femea (enum).';
comment on column public.puppies_v2.price is 'Preço (inteiro). Deve ser >= 0.';
comment on column public.puppies_v2.status is 'Status comercial: disponivel, reservado ou vendido (enum).';
comment on column public.puppies_v2.city is 'Cidade (localização/entrega).';
comment on column public.puppies_v2.state is 'Estado/UF.';
comment on column public.puppies_v2.description is 'Descrição longa do filhote.';
comment on column public.puppies_v2.features is 'JSONB com flags booleanas: pedigree, video, entrega_segura.';
comment on column public.puppies_v2.images is 'Array JSONB de strings com URLs (Supabase Storage) das imagens.';
comment on column public.puppies_v2.created_at is 'Data/hora de criação (UTC).';
comment on column public.puppies_v2.updated_at is 'Data/hora da última atualização (UTC), mantida por trigger.';

-- RLS
alter table public.puppies_v2 enable row level security;

-- Leitura pública (mantemos a mesma regra de negócio do projeto: não expor "vendido")
drop policy if exists puppies_v2_public_select on public.puppies_v2;
create policy puppies_v2_public_select
on public.puppies_v2
as permissive
for select
to anon, authenticated
using (
 status = any (array['disponivel'::public.puppy_status, 'reservado'::public.puppy_status])
);

-- Escrita apenas via service_role (admin/server). Observação: service_role normalmente bypassa RLS.
drop policy if exists puppies_v2_service_role_full_access on public.puppies_v2;
create policy puppies_v2_service_role_full_access
on public.puppies_v2
as permissive
for all
to public
using (auth.role() = 'service_role'::text)
with check (auth.role() = 'service_role'::text);

commit;
