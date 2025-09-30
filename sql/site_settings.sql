-- By Império Dog • Pixels/Tags Settings (revisado)
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),

  -- IDs públicos (aparecem no HTML)
  gtm_id text,                 -- GTM-XXXX
  ga4_id text,                 -- G-XXXX (caso não use GTM)
  meta_pixel_id text,          -- 1234567890
  tiktok_pixel_id text,        -- C123ABC456
  google_ads_id text,          -- AW-XXXX
  google_ads_label text,       -- conversion label opcional
  pinterest_tag_id text,       -- 1234567890
  hotjar_id text,              -- 123456
  clarity_id text,             -- abcdef
  meta_domain_verify text,     -- para <meta name="facebook-domain-verification" ...>

  -- Meta semanal customizável de criação de posts
  weekly_post_goal int default 7 check (weekly_post_goal between 1 and 100),

  -- Tokens privados (para CAPI/server-side)
  fb_capi_token text,
  tiktok_api_token text,

  updated_at timestamptz not null default now()
);

-- Touch
create or replace function public.site_settings_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists t_site_settings_touch on public.site_settings;
create trigger t_site_settings_touch before update on public.site_settings
for each row execute function public.site_settings_touch();

alter table public.site_settings enable row level security;

-- Políticas simples (se preferir, faça tudo via service_role e remova estas).
drop policy if exists site_settings_select_auth on public.site_settings;
create policy site_settings_select_auth on public.site_settings
for select to authenticated using (true);

drop policy if exists site_settings_update_auth on public.site_settings;
create policy site_settings_update_auth on public.site_settings
for update to authenticated using (true) with check (true);

-- Linha única (se não existir, cria)
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- Índices auxiliares
create index if not exists idx_site_settings_updated_at on public.site_settings (updated_at desc);
