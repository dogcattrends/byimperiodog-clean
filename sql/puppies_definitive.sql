-- sql/puppies_definitive.sql
-- Schema definitivo (proposto) para public.puppies no Supabase.
-- Inclui: enums, tabela, constraints, trigger updated_at, índices, comentários e RLS.
--
-- Observação importante (padrão do projeto): as rotas/admin usam SUPABASE_SERVICE_ROLE_KEY (supabaseAdmin).
-- No Postgres/Supabase, o role service_role bypassa RLS. Ainda assim, este arquivo cria políticas explícitas
-- para deixar claro: leitura é pública e escrita é apenas via service_role.

begin;

-- Necessário para gen_random_uuid()
create extension if not exists pgcrypto;

-- Enums
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'puppy_gender') THEN
 CREATE TYPE public.puppy_gender AS ENUM ('macho', 'femea');
 END IF;

 IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'puppy_status') THEN
 CREATE TYPE public.puppy_status AS ENUM ('disponivel', 'reservado', 'vendido');
 END IF;
END $$;

-- Trigger helper (padrão já usado no repo)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
 new.updated_at = now();
 return new;
end;
$$;

-- Tabela
create table if not exists public.puppies (
 id uuid primary key default gen_random_uuid(),

 name text not null,
 breed text not null,
 color text,
 gender public.puppy_gender not null,

 price integer not null check (price >= 0),
 status public.puppy_status not null default 'disponivel',

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

-- Trigger updated_at
do $$
begin
 if not exists (
 select 1
 from pg_trigger
 where tgname = 'trg_puppies_set_updated_at'
 ) then
 create trigger trg_puppies_set_updated_at
 before update on public.puppies
 for each row
 execute function public.set_updated_at();
 end if;
end $$;

-- Índices (mínimo útil para listagens e filtros)
create index if not exists puppies_status_idx on public.puppies (status);
create index if not exists puppies_breed_idx on public.puppies (breed);
create index if not exists puppies_city_state_idx on public.puppies (state, city);
create index if not exists puppies_price_idx on public.puppies (price);
create index if not exists puppies_created_at_idx on public.puppies (created_at desc);
create index if not exists puppies_features_gin_idx on public.puppies using gin (features jsonb_path_ops);

-- Comentários (documentação de campos)
comment on table public.puppies is 'Cadastro de filhotes (estoque).';

comment on column public.puppies.id is 'UUID do filhote (PK). Gerado automaticamente.';
comment on column public.puppies.name is 'Nome do filhote.';
comment on column public.puppies.breed is 'Raça do filhote.';
comment on column public.puppies.color is 'Cor declarada do filhote.';
comment on column public.puppies.gender is 'Sexo do filhote: macho ou femea.';
comment on column public.puppies.price is 'Preço (inteiro). Deve ser >= 0.';
comment on column public.puppies.status is 'Status comercial: disponivel, reservado ou vendido.';
comment on column public.puppies.city is 'Cidade (localização/entrega).';
comment on column public.puppies.state is 'Estado/UF.';
comment on column public.puppies.description is 'Descrição longa do filhote (texto).';
comment on column public.puppies.features is 'JSONB com flags booleanas: pedigree, video, entrega_segura.';
comment on column public.puppies.images is 'Array JSONB de strings com URLs (Supabase Storage) das imagens.';
comment on column public.puppies.created_at is 'Data/hora de criação (UTC).';
comment on column public.puppies.updated_at is 'Data/hora da última atualização (UTC). Atualizada por trigger.';

-- RLS
alter table public.puppies enable row level security;

-- Leitura pública
drop policy if exists puppies_public_read on public.puppies;
create policy puppies_public_read
on public.puppies
for select
to anon, authenticated
using (true);

-- Escrita apenas via service role (no projeto, o admin usa supabaseAdmin -> service_role).
-- Observação: service_role bypassa RLS, mas a policy documenta a intenção e mantém consistência com outras tabelas.
drop policy if exists puppies_service_role_insert on public.puppies;
create policy puppies_service_role_insert
on public.puppies
for insert
to service_role
with check (true);

drop policy if exists puppies_service_role_update on public.puppies;
create policy puppies_service_role_update
on public.puppies
for update
to service_role
using (true)
with check (true);

drop policy if exists puppies_service_role_delete on public.puppies;
create policy puppies_service_role_delete
on public.puppies
for delete
to service_role
using (true);

commit;
