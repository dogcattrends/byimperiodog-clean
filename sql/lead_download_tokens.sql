-- Tokens temporários para download do guia premium
create table if not exists public.lead_download_tokens (
  id uuid primary key default gen_random_uuid(),
  lead_id bigint not null references public.leads(id) on delete cascade,
  token text not null unique,
  version text not null default 'v1',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  ip_address text,
  user_agent text
);

create index if not exists idx_lead_download_tokens_lead on public.lead_download_tokens (lead_id);
create index if not exists idx_lead_download_tokens_token on public.lead_download_tokens (token);

alter table public.lead_download_tokens enable row level security;

create policy if not exists lead_download_tokens_service_role
  on public.lead_download_tokens for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

