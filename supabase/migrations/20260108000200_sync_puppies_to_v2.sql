-- Migration: sync_puppies_to_v2
-- Data: 2026-01-08
--
-- Objetivo: migrar de forma segura.
-- - NÃO altera a tabela public.puppies atual (continua sendo a fonte usada pelo app hoje)
-- - Faz backfill para public.puppies_v2
-- - Mantém public.puppies_v2 sincronizada via triggers (insert/update/delete)
--
-- Nota: o schema atual de public.puppies tem colunas legadas (nome/sexo/preco/midia/etc).
-- Esta migração normaliza para o schema v2 (name/breed/gender/price/images/features...).

begin;

-- 1) Backfill (upsert) do que já existe
insert into public.puppies_v2 (
  id,
  name,
  breed,
  color,
  gender,
  price,
  status,
  city,
  state,
  description,
  features,
  images,
  created_at,
  updated_at
)
select
  p.id,

  -- name: normaliza colunas legadas
  coalesce(nullif(p.name, ''), nullif(p.nome, ''), 'Sem nome') as name,

  -- breed: ainda não existe no schema legado -> default seguro
  'Spitz Alemão Anão' as breed,

  nullif(p.color, '') as color,

  -- gender: mapeia sexo/gender e aplica default
  (
    case
      when lower(coalesce(p.sexo::text, '')) like 'mach%' then 'macho'
      when lower(coalesce(p.sexo::text, '')) in ('femea','fêmea','fem','female') then 'femea'
      when lower(coalesce(p.sexo::text, '')) in ('macho','male') then 'macho'
      else 'macho'
    end
  )::public.puppy_gender as gender,

  -- price: mantém compatibilidade com o projeto (prioriza price_cents; fallback para preco)
  coalesce(
    p.price_cents,
    case
      when p.preco is null then null
      else round((p.preco * 100.0))::int
    end,
    0
  ) as price,

  coalesce(p.status::text, 'disponivel')::public.puppy_status as status,

  nullif(p.cidade, '') as city,
  nullif(p.estado, '') as state,

  nullif(p.descricao, '') as description,

  jsonb_build_object(
    'pedigree', false,
    'video', false,
    'entrega_segura', false
  ) as features,

  (
    case
      when jsonb_typeof(p.midia) = 'array' and jsonb_array_length(p.midia) > 0 then
        coalesce(nullif(jsonb_path_query_array(p.midia, '$[*].url'), '[]'::jsonb), '[]'::jsonb)
      else '[]'::jsonb
    end
  ) as images,

  p.created_at,
  p.updated_at
from public.puppies p
on conflict (id) do update set
  name = excluded.name,
  breed = excluded.breed,
  color = excluded.color,
  gender = excluded.gender,
  price = excluded.price,
  status = excluded.status,
  city = excluded.city,
  state = excluded.state,
  description = excluded.description,
  features = excluded.features,
  images = excluded.images,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

-- 2) Trigger function para manter v2 em sync
create or replace function public.sync_puppies_to_v2()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.puppies_v2 where id = old.id;
    return old;
  end if;

  insert into public.puppies_v2 (
    id,
    name,
    breed,
    color,
    gender,
    price,
    status,
    city,
    state,
    description,
    features,
    images,
    created_at,
    updated_at
  ) values (
    new.id,
    coalesce(nullif(new.name, ''), nullif(new.nome, ''), 'Sem nome'),
    'Spitz Alemão Anão',
    nullif(new.color, ''),
    (
      case
        when lower(coalesce(new.sexo::text, '')) like 'mach%' then 'macho'
        when lower(coalesce(new.sexo::text, '')) in ('femea','fêmea','fem','female') then 'femea'
        when lower(coalesce(new.sexo::text, '')) in ('macho','male') then 'macho'
        else 'macho'
      end
    )::public.puppy_gender,
    coalesce(
      new.price_cents,
      case
        when new.preco is null then null
        else round((new.preco * 100.0))::int
      end,
      0
    ),
    coalesce(new.status::text, 'disponivel')::public.puppy_status,
    nullif(new.cidade, ''),
    nullif(new.estado, ''),
    nullif(new.descricao, ''),
    jsonb_build_object(
      'pedigree', false,
      'video', false,
      'entrega_segura', false
    ),
    (
      case
        when jsonb_typeof(new.midia) = 'array' and jsonb_array_length(new.midia) > 0 then
          coalesce(nullif(jsonb_path_query_array(new.midia, '$[*].url'), '[]'::jsonb), '[]'::jsonb)
        else '[]'::jsonb
      end
    ),
    new.created_at,
    new.updated_at
  )
  on conflict (id) do update set
    name = excluded.name,
    breed = excluded.breed,
    color = excluded.color,
    gender = excluded.gender,
    price = excluded.price,
    status = excluded.status,
    city = excluded.city,
    state = excluded.state,
    description = excluded.description,
    features = excluded.features,
    images = excluded.images,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

  return new;
end;
$$;

-- 3) Triggers na tabela antiga (fonte atual do app)
-- Evita duplicar caso rode novamente.
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_puppies_sync_to_v2_aiu') then
    create trigger trg_puppies_sync_to_v2_aiu
    after insert or update on public.puppies
    for each row
    execute function public.sync_puppies_to_v2();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_puppies_sync_to_v2_del') then
    create trigger trg_puppies_sync_to_v2_del
    after delete on public.puppies
    for each row
    execute function public.sync_puppies_to_v2();
  end if;
end $$;

commit;
