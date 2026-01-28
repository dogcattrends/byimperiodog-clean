-- Corrige schema da tabela leads para garantir a coluna consent_lgpd
alter table public.leads add column if not exists consent_lgpd boolean default false;
