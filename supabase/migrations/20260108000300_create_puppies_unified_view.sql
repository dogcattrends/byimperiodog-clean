-- Creates a compatibility view that joins `puppies_v2` (definitive schema)
-- with legacy fields from `puppies` (slug/media/etc).
--
-- Safe by default: no grants are added here. This is intended primarily for admin/service_role reads.

begin;

create or replace view public.puppies_unified as
select
 v2.id,
 v2.name,
 v2.status,
 v2.color,
 v2.gender::text as gender,
 v2.price as price_cents,
 null::text as slug,
 v2.images,
 v2.features,
 v2.city,
 v2.state,
 v2.created_at,
 v2.updated_at
from public.puppies_v2 v2;

comment on view public.puppies_unified is
 'Compat view: exposes puppies_v2 fields in a legacy-friendly shape. Does not depend on legacy public.puppies columns.';

commit;
