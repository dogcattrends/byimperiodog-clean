-- ============================================================================
-- Tabela: leads
-- Descrição: Armazena leads do formulário de contato com consentimento LGPD
-- ============================================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  
  -- Dados do Lead
  nome text not null,
  telefone text not null,
  cidade text,
  estado text,
  sexo_preferido text,
  cor_preferida text,
  prazo_aquisicao text,
  preferencia text,
  mensagem text,
  
  -- Consentimento LGPD
  consent_lgpd boolean not null default false,
  consent_version text default '1.0',
  consent_timestamp timestamptz,
  
  -- Tracking
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referer text,
  page text,
  gclid text,
  fbclid text,
  ip_address inet,
  user_agent text,
  
  -- Status
  status text default 'pending' check (status in ('pending', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to uuid references auth.users(id) on delete set null,
  follow_up_at timestamptz,
  notes text,
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- Índices para Performance
-- ============================================================================

create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_utm_source on public.leads(utm_source);
create index if not exists idx_leads_telefone on public.leads(telefone);
create index if not exists idx_leads_assigned_to on public.leads(assigned_to);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

alter table public.leads enable row level security;

-- Permitir inserção anônima (formulário público)
create policy "Permitir insert anônimo em leads"
  on public.leads
  for insert
  to anon
  with check (true);

-- Permitir visualização apenas para usuários autenticados
create policy "Permitir visualização autenticada de leads"
  on public.leads
  for select
  to authenticated
  using (true);

-- Permitir update apenas para usuários autenticados
create policy "Permitir update autenticado de leads"
  on public.leads
  for update
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- Trigger para Updated_at
-- ============================================================================

create or replace function public.handle_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_leads_updated_at
  before update on public.leads
  for each row
  execute function public.handle_leads_updated_at();

-- ============================================================================
-- Comentários
-- ============================================================================

comment on table public.leads is 'Leads capturados via formulário com consentimento LGPD';
comment on column public.leads.consent_lgpd is 'Aceite explícito do usuário conforme LGPD';
comment on column public.leads.consent_version is 'Versão da política de privacidade aceita';
comment on column public.leads.consent_timestamp is 'Momento exato do consentimento';
