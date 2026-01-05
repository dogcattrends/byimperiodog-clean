create extension if not exists "moddatetime" with schema "extensions";

drop extension if exists "pg_net";

create type "public"."contract_status" as enum ('pendente', 'assinado', 'cancelado');

create type "public"."lead_status" as enum ('novo', 'contatado', 'qualificado', 'perdido', 'convertido');

create type "public"."puppy_status" as enum ('disponivel', 'reservado', 'vendido', 'indisponivel');

create type "public"."sexo_type" as enum ('macho', 'femea');

create sequence "public"."blog_coverage_history_id_seq";

create sequence "public"."puppy_media_id_seq";


  create table "public"."admin_config" (
    "id" text not null,
    "brand_name" text,
    "brand_tagline" text,
    "contact_email" text,
    "contact_phone" text,
    "instagram" text,
    "tiktok" text,
    "whatsapp_message" text,
    "template_first_contact" text,
    "template_followup" text,
    "avg_response_minutes" integer,
    "followup_rules" text,
    "seo_title_default" text,
    "seo_description_default" text,
    "seo_meta_tags" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."admin_users" (
    "user_id" uuid not null,
    "email" text not null,
    "role" text not null default 'admin'::text,
    "name" text,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."admin_users" enable row level security;


  create table "public"."ai_generation_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "topic" text not null,
    "phase" text not null default 'outline'::text,
    "progress" integer not null default 0,
    "status" text not null default 'active'::text,
    "error_message" text,
    "post_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."ai_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "type" text not null,
    "topic" text,
    "post_id" uuid,
    "phase" text,
    "status" text not null default 'pending'::text,
    "progress" integer not null default 0,
    "payload" jsonb,
    "result" jsonb,
    "error_message" text,
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."analytics_events" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "value" numeric,
    "metric_id" text,
    "label" text,
    "meta" jsonb,
    "path" text,
    "ua" text,
    "ip" inet,
    "ts" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."analytics_events" enable row level security;


  create table "public"."autosales_logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "sequence_id" uuid not null,
    "lead_id" uuid not null,
    "puppy_id" uuid,
    "message_type" text not null,
    "content" text not null,
    "cta_link" text,
    "status" text not null default 'queued'::text,
    "error" text,
    "metadata" jsonb not null default '{}'::jsonb,
    "objections" text[] default ARRAY[]::text[],
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );



  create table "public"."autosales_sequences" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "lead_id" uuid not null,
    "puppy_id" uuid,
    "tone" text,
    "urgency" text,
    "status" text not null default 'scheduled'::text,
    "next_step" text,
    "next_run_at" timestamp with time zone,
    "step_index" integer not null default 0,
    "total_steps" integer not null default 0,
    "fallback_required" boolean not null default false,
    "fallback_reason" text,
    "bypass_human" boolean not null default false,
    "metrics" jsonb not null default '{}'::jsonb,
    "strategy" jsonb not null default '{}'::jsonb,
    "last_message_type" text,
    "last_message_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );



  create table "public"."blog_authors" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "bio" text,
    "avatar_url" text,
    "socials" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "slug" text
      );



  create table "public"."blog_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."blog_comments" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid,
    "author_name" text,
    "author_email" text,
    "body" text not null,
    "approved" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "parent_id" uuid,
    "user_agent" text,
    "ip_hash" text,
    "ai_score" numeric,
    "akismet_score" numeric
      );


alter table "public"."blog_comments" enable row level security;


  create table "public"."blog_coverage_history" (
    "id" bigint not null default nextval('public.blog_coverage_history_id_seq'::regclass),
    "snapshot_at" timestamp with time zone not null default now(),
    "covered" integer not null,
    "total" integer not null,
    "percent" integer not null,
    "missing" jsonb
      );



  create table "public"."blog_post_categories" (
    "post_id" uuid not null,
    "category_id" uuid not null
      );



  create table "public"."blog_post_embeddings" (
    "post_id" uuid not null,
    "source" text not null default 'db'::text,
    "embedding" text,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."blog_post_embeddings" enable row level security;


  create table "public"."blog_post_localizations" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "lang" text not null,
    "slug" text not null,
    "title" text not null,
    "subtitle" text,
    "content_mdx" text,
    "seo_title" text,
    "seo_description" text,
    "og_image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."blog_post_revisions" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid,
    "snapshot" jsonb not null,
    "reason" text,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."blog_post_schedule_events" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid,
    "run_at" timestamp with time zone not null,
    "action" text not null,
    "payload" jsonb,
    "executed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."blog_post_tags" (
    "post_id" uuid not null,
    "tag_id" uuid not null
      );



  create table "public"."blog_post_versions" (
    "id" uuid not null default gen_random_uuid(),
    "post_id" uuid not null,
    "snapshot" jsonb not null,
    "reason" text,
    "created_by" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."blog_posts" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "title" text not null,
    "subtitle" text,
    "cover_url" text,
    "excerpt" text,
    "content_mdx" text,
    "status" text not null default 'draft'::text,
    "scheduled_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "author_id" uuid,
    "seo_title" text,
    "seo_description" text,
    "og_image_url" text,
    "lang" text default 'pt-BR'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "content_blocks_json" jsonb,
    "gallery_json" jsonb default '[]'::jsonb,
    "canonical_url" text,
    "reading_time" integer,
    "updated_by" uuid,
    "tsv" tsvector generated always as ((((setweight(to_tsvector('portuguese'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('portuguese'::regconfig, COALESCE(subtitle, ''::text)), 'B'::"char")) || setweight(to_tsvector('portuguese'::regconfig, COALESCE(excerpt, ''::text)), 'C'::"char")) || setweight(to_tsvector('portuguese'::regconfig, COALESCE(content_mdx, ''::text)), 'D'::"char"))) stored,
    "seo_score" integer,
    "cover_alt" text,
    "category" text,
    "tags" text[] default '{}'::text[]
      );


alter table "public"."blog_posts" enable row level security;


  create table "public"."blog_tags" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null
      );



  create table "public"."catalog_ai_events" (
    "id" uuid not null default gen_random_uuid(),
    "event_type" text not null,
    "puppy_id" uuid,
    "user_session" text,
    "badge" text,
    "old_position" integer,
    "new_position" integer,
    "ctr_before" numeric,
    "ctr_after" numeric,
    "dwell_before_ms" integer,
    "dwell_after_ms" integer,
    "personalized" boolean,
    "clicked" boolean,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."catalog_ranking" (
    "puppy_id" uuid not null,
    "score" integer not null default 0,
    "flag" text,
    "reason" text,
    "rank_order" integer,
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."contracts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "code" text not null default public.gen_short_code(8),
    "puppy_id" uuid not null,
    "customer_id" uuid,
    "status" public.contract_status not null default 'pendente'::public.contract_status,
    "signed_at" timestamp with time zone,
    "hemograma_path" text,
    "laudo_path" text,
    "payload" jsonb default '{}'::jsonb,
    "lead_id" uuid,
    "total_price_cents" integer
      );


alter table "public"."contracts" enable row level security;


  create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "nome" text not null,
    "email" text,
    "telefone" text,
    "cpf" text,
    "endereco" text,
    "cidade" text,
    "estado" text,
    "cep" text,
    "notes" text
      );


alter table "public"."customers" enable row level security;


  create table "public"."demand_predictions" (
    "id" uuid not null default gen_random_uuid(),
    "color" text,
    "sex" text,
    "week_start_date" date,
    "week_end_date" date,
    "predicted_leads" numeric,
    "predicted_shortage" boolean,
    "recommendation" text,
    "risk_alert" text,
    "features" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "lead_id" uuid,
    "event_type" text not null,
    "meta" jsonb default '{}'::jsonb
      );


alter table "public"."events" enable row level security;


  create table "public"."experiments" (
    "id" uuid not null default gen_random_uuid(),
    "key" text not null,
    "name" text not null,
    "description" text,
    "status" text not null default 'draft'::text,
    "audience" text,
    "variants" jsonb not null default '[]'::jsonb,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."integrations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "provider" text not null,
    "access_token" text not null,
    "refresh_token" text,
    "expires_at" timestamp with time zone,
    "provider_account_id" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."integrations" enable row level security;


  create table "public"."lead_ai_insights" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid not null,
    "intent" text,
    "urgency" text,
    "risk" text,
    "score" integer,
    "desired_color" text,
    "desired_sex" text,
    "desired_city" text,
    "desired_timeframe" text,
    "budget_inferred" text,
    "emotional_tone" text,
    "matched_puppy_id" uuid,
    "suggested_puppies" jsonb,
    "alerts" jsonb,
    "next_step" text,
    "insights" jsonb,
    "processed_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."leads" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "nome" text,
    "telefone" text,
    "cidade" text,
    "preferencia" text,
    "mensagem" text,
    "utm_source" text,
    "utm_medium" text,
    "utm_campaign" text,
    "referer" text,
    "page" text,
    "gclid" text,
    "fbclid" text,
    "status" public.lead_status not null default 'novo'::public.lead_status,
    "notes" text,
    "first_name" text,
    "last_name" text,
    "phone" text,
    "source" text,
    "first_responded_at" timestamp with time zone
      );


alter table "public"."leads" enable row level security;


  create table "public"."media" (
    "id" uuid not null default gen_random_uuid(),
    "url" text not null,
    "alt" text,
    "width" integer,
    "height" integer,
    "credits" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."media_assets" (
    "id" uuid not null default gen_random_uuid(),
    "file_path" text not null,
    "mime" text,
    "width" integer,
    "height" integer,
    "size_bytes" integer,
    "tags" text[],
    "dominant_color" text,
    "alt" text,
    "caption" text,
    "source" text,
    "created_by" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."newsletter_subscribers" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."post_media" (
    "post_id" uuid not null,
    "media_id" uuid not null,
    "role" text not null default 'gallery'::text,
    "position" integer default 0
      );



  create table "public"."puppies" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "codigo" text default public.gen_short_code(6),
    "nome" text,
    "sexo" public.sexo_type,
    "cor" text,
    "nascimento" date,
    "pedigree" text,
    "microchip" text,
    "preco" numeric(12,2) default 0,
    "status" public.puppy_status not null default 'disponivel'::public.puppy_status,
    "reserved_at" timestamp with time zone,
    "sold_at" timestamp with time zone,
    "customer_id" uuid,
    "midia" jsonb default '[]'::jsonb,
    "notes" text,
    "name" text,
    "color" text,
    "gender" text,
    "price_cents" integer,
    "descricao" text
      );


alter table "public"."puppies" enable row level security;


  create table "public"."puppy_media" (
    "id" bigint not null default nextval('public.puppy_media_id_seq'::regclass),
    "puppy_id" uuid,
    "url" text not null,
    "mime_hint" text,
    "sort_order" integer default 0
      );


alter table "public"."puppy_media" enable row level security;


  create table "public"."puppy_reviews" (
    "id" uuid not null default gen_random_uuid(),
    "puppy_id" uuid not null,
    "author_name" text not null,
    "author_email" text,
    "rating" integer not null,
    "comment" text,
    "approved" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."puppy_reviews" enable row level security;


  create table "public"."redirects" (
    "from_path" text not null,
    "to_url" text not null,
    "type" text not null default 'permanent'::text,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."seo_history" (
    "id" uuid not null default gen_random_uuid(),
    "route" text not null,
    "action" text not null,
    "before" jsonb,
    "after" jsonb,
    "applied_by" text default 'autopilot'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."seo_overrides" (
    "entity_type" text not null,
    "entity_id" uuid,
    "entity_ref" text,
    "data_json" jsonb not null default '{}'::jsonb,
    "updated_by" uuid,
    "updated_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."seo_overrides" enable row level security;


  create table "public"."seo_rules" (
    "id" uuid not null default gen_random_uuid(),
    "scope" text not null,
    "scope_ref" text,
    "rules_json" jsonb not null default '{}'::jsonb,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."seo_suggestions" (
    "id" uuid not null default gen_random_uuid(),
    "entity_type" text not null,
    "entity_id" uuid,
    "entity_ref" text,
    "data_json" jsonb not null,
    "score" numeric,
    "status" text not null default 'proposed'::text,
    "created_by" uuid,
    "approved_by" uuid,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."site_settings" (
    "id" integer not null default 1,
    "gtm_id" text,
    "ga4_id" text,
    "meta_pixel_id" text,
    "tiktok_pixel_id" text,
    "google_ads_id" text,
    "google_ads_label" text,
    "pinterest_tag_id" text,
    "hotjar_id" text,
    "clarity_id" text,
    "meta_domain_verify" text,
    "fb_capi_token" text,
    "tiktok_api_token" text,
    "updated_at" timestamp with time zone not null default now(),
    "custom_pixels" jsonb default '[]'::jsonb,
    "google_site_verification" text,
    "ai_primary_provider" text,
    "ai_primary_base_url" text,
    "ai_primary_model" text,
    "ai_primary_api_key" text,
    "ai_fallback_provider" text,
    "ai_fallback_base_url" text,
    "ai_fallback_model" text,
    "ai_fallback_api_key" text,
    "ai_vector_index" text,
    "ai_observability_webhook" text
      );


alter table "public"."site_settings" enable row level security;


  create table "public"."tracking_audit_log" (
    "id" uuid not null default gen_random_uuid(),
    "admin_id" uuid,
    "environment" text not null,
    "before" jsonb,
    "after" jsonb,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."tracking_settings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "facebook_pixel_id" text,
    "ga_measurement_id" text,
    "gtm_container_id" text,
    "tiktok_pixel_id" text,
    "is_facebook_pixel_enabled" boolean not null default false,
    "is_ga_enabled" boolean not null default false,
    "is_gtm_enabled" boolean not null default false,
    "is_tiktok_enabled" boolean not null default false,
    "updated_at" timestamp with time zone not null default now(),
    "environment" text not null
      );


alter table "public"."tracking_settings" enable row level security;


  create table "public"."webhook_outbox" (
    "id" uuid not null default gen_random_uuid(),
    "event" text not null,
    "payload" jsonb not null default '{}'::jsonb,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter sequence "public"."blog_coverage_history_id_seq" owned by "public"."blog_coverage_history"."id";

alter sequence "public"."puppy_media_id_seq" owned by "public"."puppy_media"."id";

CREATE UNIQUE INDEX admin_config_pkey ON public.admin_config USING btree (id);

CREATE INDEX admin_users_email_idx ON public.admin_users USING btree (email);

CREATE UNIQUE INDEX admin_users_email_key ON public.admin_users USING btree (email);

CREATE UNIQUE INDEX admin_users_pkey ON public.admin_users USING btree (user_id);

CREATE UNIQUE INDEX ai_generation_sessions_pkey ON public.ai_generation_sessions USING btree (id);

CREATE UNIQUE INDEX ai_tasks_pkey ON public.ai_tasks USING btree (id);

CREATE INDEX ai_tasks_post_idx ON public.ai_tasks USING btree (post_id);

CREATE INDEX ai_tasks_status_idx ON public.ai_tasks USING btree (status);

CREATE INDEX analytics_events_name_idx ON public.analytics_events USING btree (name);

CREATE INDEX analytics_events_path_idx ON public.analytics_events USING btree (path);

CREATE UNIQUE INDEX analytics_events_pkey ON public.analytics_events USING btree (id);

CREATE INDEX analytics_events_ts_idx ON public.analytics_events USING btree (ts DESC);

CREATE UNIQUE INDEX autosales_logs_pkey ON public.autosales_logs USING btree (id);

CREATE UNIQUE INDEX autosales_sequences_pkey ON public.autosales_sequences USING btree (id);

CREATE UNIQUE INDEX blog_authors_pkey ON public.blog_authors USING btree (id);

CREATE UNIQUE INDEX blog_authors_slug_key ON public.blog_authors USING btree (slug);

CREATE UNIQUE INDEX blog_categories_name_key ON public.blog_categories USING btree (name);

CREATE UNIQUE INDEX blog_categories_pkey ON public.blog_categories USING btree (id);

CREATE UNIQUE INDEX blog_categories_slug_key ON public.blog_categories USING btree (slug);

CREATE UNIQUE INDEX blog_comments_pkey ON public.blog_comments USING btree (id);

CREATE UNIQUE INDEX blog_coverage_history_pkey ON public.blog_coverage_history USING btree (id);

CREATE UNIQUE INDEX blog_post_categories_pkey ON public.blog_post_categories USING btree (post_id, category_id);

CREATE UNIQUE INDEX blog_post_embeddings_pkey ON public.blog_post_embeddings USING btree (post_id, source);

CREATE UNIQUE INDEX blog_post_localizations_pkey ON public.blog_post_localizations USING btree (id);

CREATE UNIQUE INDEX blog_post_localizations_post_lang_uniq ON public.blog_post_localizations USING btree (post_id, lang);

CREATE UNIQUE INDEX blog_post_localizations_slug_lang_uniq ON public.blog_post_localizations USING btree (slug, lang);

CREATE UNIQUE INDEX blog_post_revisions_pkey ON public.blog_post_revisions USING btree (id);

CREATE UNIQUE INDEX blog_post_schedule_events_pkey ON public.blog_post_schedule_events USING btree (id);

CREATE UNIQUE INDEX blog_post_tags_pkey ON public.blog_post_tags USING btree (post_id, tag_id);

CREATE UNIQUE INDEX blog_post_versions_pkey ON public.blog_post_versions USING btree (id);

CREATE INDEX blog_post_versions_post_idx ON public.blog_post_versions USING btree (post_id);

CREATE INDEX blog_posts_category_lower_idx ON public.blog_posts USING btree (lower(category));

CREATE UNIQUE INDEX blog_posts_pkey ON public.blog_posts USING btree (id);

CREATE UNIQUE INDEX blog_posts_slug_key ON public.blog_posts USING btree (slug);

CREATE INDEX blog_posts_tags_gin_idx ON public.blog_posts USING gin (tags);

CREATE INDEX blog_posts_tsv_gin ON public.blog_posts USING gin (tsv);

CREATE UNIQUE INDEX blog_tags_name_key ON public.blog_tags USING btree (name);

CREATE UNIQUE INDEX blog_tags_pkey ON public.blog_tags USING btree (id);

CREATE UNIQUE INDEX blog_tags_slug_key ON public.blog_tags USING btree (slug);

CREATE UNIQUE INDEX catalog_ai_events_pkey ON public.catalog_ai_events USING btree (id);

CREATE UNIQUE INDEX catalog_ranking_pkey ON public.catalog_ranking USING btree (puppy_id);

CREATE INDEX catalog_ranking_rank_idx ON public.catalog_ranking USING btree (rank_order);

CREATE INDEX catalog_ranking_score_idx ON public.catalog_ranking USING btree (score DESC);

CREATE UNIQUE INDEX contracts_code_key ON public.contracts USING btree (code);

CREATE UNIQUE INDEX contracts_pkey ON public.contracts USING btree (id);

CREATE UNIQUE INDEX customers_cpf_key ON public.customers USING btree (cpf);

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX customers_telefone_key ON public.customers USING btree (telefone);

CREATE UNIQUE INDEX demand_predictions_pkey ON public.demand_predictions USING btree (id);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE UNIQUE INDEX experiments_key_key ON public.experiments USING btree (key);

CREATE UNIQUE INDEX experiments_pkey ON public.experiments USING btree (id);

CREATE INDEX idx_autosales_logs_lead ON public.autosales_logs USING btree (lead_id);

CREATE INDEX idx_autosales_logs_sequence ON public.autosales_logs USING btree (sequence_id);

CREATE INDEX idx_autosales_sequences_lead ON public.autosales_sequences USING btree (lead_id);

CREATE INDEX idx_autosales_sequences_status_run ON public.autosales_sequences USING btree (status, next_run_at);

CREATE INDEX idx_blog_authors_slug ON public.blog_authors USING btree (slug);

CREATE INDEX idx_blog_comments_parent ON public.blog_comments USING btree (parent_id);

CREATE INDEX idx_blog_comments_post ON public.blog_comments USING btree (post_id, approved, created_at DESC);

CREATE INDEX idx_blog_comments_post_approved_created ON public.blog_comments USING btree (post_id, approved, created_at DESC);

CREATE INDEX idx_blog_comments_post_id ON public.blog_comments USING btree (post_id);

CREATE INDEX idx_blog_coverage_history_snapshot ON public.blog_coverage_history USING btree (snapshot_at DESC);

CREATE INDEX idx_blog_post_categories_category ON public.blog_post_categories USING btree (category_id);

CREATE INDEX idx_blog_post_categories_post ON public.blog_post_categories USING btree (post_id);

CREATE INDEX idx_blog_post_localizations_post ON public.blog_post_localizations USING btree (post_id);

CREATE INDEX idx_blog_post_revisions_post ON public.blog_post_revisions USING btree (post_id, created_at DESC);

CREATE INDEX idx_blog_post_schedule_events_run_at ON public.blog_post_schedule_events USING btree (run_at);

CREATE INDEX idx_blog_post_tags_post ON public.blog_post_tags USING btree (post_id);

CREATE INDEX idx_blog_post_tags_tag ON public.blog_post_tags USING btree (tag_id);

CREATE INDEX idx_blog_posts_published_at ON public.blog_posts USING btree (published_at DESC);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug);

CREATE INDEX idx_blog_posts_status_published ON public.blog_posts USING btree (status, published_at DESC);

CREATE INDEX idx_blog_posts_status_published_at ON public.blog_posts USING btree (status, published_at DESC);

CREATE INDEX idx_catalog_ai_events_puppy ON public.catalog_ai_events USING btree (puppy_id);

CREATE INDEX idx_catalog_ai_events_type_created ON public.catalog_ai_events USING btree (event_type, created_at DESC);

CREATE INDEX idx_contracts_code ON public.contracts USING btree (code);

CREATE INDEX idx_contracts_created_at ON public.contracts USING btree (created_at DESC);

CREATE INDEX idx_contracts_signed_at ON public.contracts USING btree (signed_at);

CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);

CREATE INDEX idx_customers_cpf ON public.customers USING btree (cpf);

CREATE INDEX idx_customers_created_at ON public.customers USING btree (created_at DESC);

CREATE INDEX idx_customers_email ON public.customers USING btree (email);

CREATE INDEX idx_customers_telefone ON public.customers USING btree (telefone);

CREATE INDEX idx_events_created_at ON public.events USING btree (created_at DESC);

CREATE INDEX idx_events_event_type ON public.events USING btree (event_type);

CREATE INDEX idx_experiments_key ON public.experiments USING btree (key);

CREATE INDEX idx_experiments_status ON public.experiments USING btree (status);

CREATE INDEX idx_integrations_user_provider ON public.integrations USING btree (user_id, provider);

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);

CREATE INDEX idx_leads_status ON public.leads USING btree (status);

CREATE INDEX idx_post_media_media ON public.post_media USING btree (media_id);

CREATE INDEX idx_post_media_post ON public.post_media USING btree (post_id);

CREATE INDEX idx_puppies_codigo ON public.puppies USING btree (codigo);

CREATE INDEX idx_puppies_created_at ON public.puppies USING btree (created_at DESC);

CREATE INDEX idx_puppies_status ON public.puppies USING btree (status);

CREATE INDEX idx_puppy_reviews_approved ON public.puppy_reviews USING btree (approved);

CREATE INDEX idx_puppy_reviews_created_at ON public.puppy_reviews USING btree (created_at DESC);

CREATE INDEX idx_puppy_reviews_puppy_id ON public.puppy_reviews USING btree (puppy_id);

CREATE INDEX idx_seo_overrides_entity ON public.seo_overrides USING btree (entity_type, entity_id);

CREATE INDEX idx_seo_rules_scope ON public.seo_rules USING btree (scope, active);

CREATE INDEX idx_seo_suggestions_entity ON public.seo_suggestions USING btree (entity_type, entity_id, status, created_at DESC);

CREATE INDEX idx_site_settings_updated_at ON public.site_settings USING btree (updated_at DESC);

CREATE INDEX idx_tracking_settings_user ON public.tracking_settings USING btree (user_id);

CREATE UNIQUE INDEX integrations_pkey ON public.integrations USING btree (id);

CREATE UNIQUE INDEX integrations_user_provider_key ON public.integrations USING btree (user_id, provider);

CREATE UNIQUE INDEX lead_ai_insights_lead_id_key ON public.lead_ai_insights USING btree (lead_id);

CREATE UNIQUE INDEX lead_ai_insights_pkey ON public.lead_ai_insights USING btree (id);

CREATE INDEX leads_phone_created_idx ON public.leads USING btree (phone, created_at DESC);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE UNIQUE INDEX media_assets_pkey ON public.media_assets USING btree (id);

CREATE INDEX media_assets_tags_idx ON public.media_assets USING gin (tags);

CREATE UNIQUE INDEX media_pkey ON public.media USING btree (id);

CREATE UNIQUE INDEX newsletter_subscribers_email_key ON public.newsletter_subscribers USING btree (email);

CREATE UNIQUE INDEX newsletter_subscribers_pkey ON public.newsletter_subscribers USING btree (id);

CREATE UNIQUE INDEX post_media_pkey ON public.post_media USING btree (post_id, media_id, role);

CREATE INDEX post_media_role_idx ON public.post_media USING btree (role);

CREATE UNIQUE INDEX puppies_codigo_key ON public.puppies USING btree (codigo);

CREATE UNIQUE INDEX puppies_pkey ON public.puppies USING btree (id);

CREATE UNIQUE INDEX puppy_media_pkey ON public.puppy_media USING btree (id);

CREATE UNIQUE INDEX puppy_reviews_pkey ON public.puppy_reviews USING btree (id);

CREATE UNIQUE INDEX redirects_pkey ON public.redirects USING btree (from_path);

CREATE UNIQUE INDEX seo_history_pkey ON public.seo_history USING btree (id);

CREATE UNIQUE INDEX seo_overrides_uniq ON public.seo_overrides USING btree (entity_type, entity_id, entity_ref);

CREATE UNIQUE INDEX seo_rules_pkey ON public.seo_rules USING btree (id);

CREATE UNIQUE INDEX seo_suggestions_pkey ON public.seo_suggestions USING btree (id);

CREATE UNIQUE INDEX site_settings_pkey ON public.site_settings USING btree (id);

CREATE UNIQUE INDEX tracking_audit_log_pkey ON public.tracking_audit_log USING btree (id);

CREATE UNIQUE INDEX tracking_settings_env_idx ON public.tracking_settings USING btree (environment);

CREATE UNIQUE INDEX tracking_settings_pkey ON public.tracking_settings USING btree (id);

CREATE UNIQUE INDEX tracking_settings_user_key ON public.tracking_settings USING btree (user_id);

CREATE UNIQUE INDEX webhook_outbox_pkey ON public.webhook_outbox USING btree (id);

alter table "public"."admin_config" add constraint "admin_config_pkey" PRIMARY KEY using index "admin_config_pkey";

alter table "public"."admin_users" add constraint "admin_users_pkey" PRIMARY KEY using index "admin_users_pkey";

alter table "public"."ai_generation_sessions" add constraint "ai_generation_sessions_pkey" PRIMARY KEY using index "ai_generation_sessions_pkey";

alter table "public"."ai_tasks" add constraint "ai_tasks_pkey" PRIMARY KEY using index "ai_tasks_pkey";

alter table "public"."analytics_events" add constraint "analytics_events_pkey" PRIMARY KEY using index "analytics_events_pkey";

alter table "public"."autosales_logs" add constraint "autosales_logs_pkey" PRIMARY KEY using index "autosales_logs_pkey";

alter table "public"."autosales_sequences" add constraint "autosales_sequences_pkey" PRIMARY KEY using index "autosales_sequences_pkey";

alter table "public"."blog_authors" add constraint "blog_authors_pkey" PRIMARY KEY using index "blog_authors_pkey";

alter table "public"."blog_categories" add constraint "blog_categories_pkey" PRIMARY KEY using index "blog_categories_pkey";

alter table "public"."blog_comments" add constraint "blog_comments_pkey" PRIMARY KEY using index "blog_comments_pkey";

alter table "public"."blog_coverage_history" add constraint "blog_coverage_history_pkey" PRIMARY KEY using index "blog_coverage_history_pkey";

alter table "public"."blog_post_categories" add constraint "blog_post_categories_pkey" PRIMARY KEY using index "blog_post_categories_pkey";

alter table "public"."blog_post_embeddings" add constraint "blog_post_embeddings_pkey" PRIMARY KEY using index "blog_post_embeddings_pkey";

alter table "public"."blog_post_localizations" add constraint "blog_post_localizations_pkey" PRIMARY KEY using index "blog_post_localizations_pkey";

alter table "public"."blog_post_revisions" add constraint "blog_post_revisions_pkey" PRIMARY KEY using index "blog_post_revisions_pkey";

alter table "public"."blog_post_schedule_events" add constraint "blog_post_schedule_events_pkey" PRIMARY KEY using index "blog_post_schedule_events_pkey";

alter table "public"."blog_post_tags" add constraint "blog_post_tags_pkey" PRIMARY KEY using index "blog_post_tags_pkey";

alter table "public"."blog_post_versions" add constraint "blog_post_versions_pkey" PRIMARY KEY using index "blog_post_versions_pkey";

alter table "public"."blog_posts" add constraint "blog_posts_pkey" PRIMARY KEY using index "blog_posts_pkey";

alter table "public"."blog_tags" add constraint "blog_tags_pkey" PRIMARY KEY using index "blog_tags_pkey";

alter table "public"."catalog_ai_events" add constraint "catalog_ai_events_pkey" PRIMARY KEY using index "catalog_ai_events_pkey";

alter table "public"."catalog_ranking" add constraint "catalog_ranking_pkey" PRIMARY KEY using index "catalog_ranking_pkey";

alter table "public"."contracts" add constraint "contracts_pkey" PRIMARY KEY using index "contracts_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."demand_predictions" add constraint "demand_predictions_pkey" PRIMARY KEY using index "demand_predictions_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."experiments" add constraint "experiments_pkey" PRIMARY KEY using index "experiments_pkey";

alter table "public"."integrations" add constraint "integrations_pkey" PRIMARY KEY using index "integrations_pkey";

alter table "public"."lead_ai_insights" add constraint "lead_ai_insights_pkey" PRIMARY KEY using index "lead_ai_insights_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."media" add constraint "media_pkey" PRIMARY KEY using index "media_pkey";

alter table "public"."media_assets" add constraint "media_assets_pkey" PRIMARY KEY using index "media_assets_pkey";

alter table "public"."newsletter_subscribers" add constraint "newsletter_subscribers_pkey" PRIMARY KEY using index "newsletter_subscribers_pkey";

alter table "public"."post_media" add constraint "post_media_pkey" PRIMARY KEY using index "post_media_pkey";

alter table "public"."puppies" add constraint "puppies_pkey" PRIMARY KEY using index "puppies_pkey";

alter table "public"."puppy_media" add constraint "puppy_media_pkey" PRIMARY KEY using index "puppy_media_pkey";

alter table "public"."puppy_reviews" add constraint "puppy_reviews_pkey" PRIMARY KEY using index "puppy_reviews_pkey";

alter table "public"."redirects" add constraint "redirects_pkey" PRIMARY KEY using index "redirects_pkey";

alter table "public"."seo_history" add constraint "seo_history_pkey" PRIMARY KEY using index "seo_history_pkey";

alter table "public"."seo_rules" add constraint "seo_rules_pkey" PRIMARY KEY using index "seo_rules_pkey";

alter table "public"."seo_suggestions" add constraint "seo_suggestions_pkey" PRIMARY KEY using index "seo_suggestions_pkey";

alter table "public"."site_settings" add constraint "site_settings_pkey" PRIMARY KEY using index "site_settings_pkey";

alter table "public"."tracking_audit_log" add constraint "tracking_audit_log_pkey" PRIMARY KEY using index "tracking_audit_log_pkey";

alter table "public"."tracking_settings" add constraint "tracking_settings_pkey" PRIMARY KEY using index "tracking_settings_pkey";

alter table "public"."webhook_outbox" add constraint "webhook_outbox_pkey" PRIMARY KEY using index "webhook_outbox_pkey";

alter table "public"."admin_users" add constraint "admin_users_email_key" UNIQUE using index "admin_users_email_key";

alter table "public"."ai_generation_sessions" add constraint "ai_generation_sessions_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE SET NULL not valid;

alter table "public"."ai_generation_sessions" validate constraint "ai_generation_sessions_post_id_fkey";

alter table "public"."ai_generation_sessions" add constraint "ai_generation_sessions_progress_check" CHECK (((progress >= 0) AND (progress <= 100))) not valid;

alter table "public"."ai_generation_sessions" validate constraint "ai_generation_sessions_progress_check";

alter table "public"."ai_tasks" add constraint "ai_tasks_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE SET NULL not valid;

alter table "public"."ai_tasks" validate constraint "ai_tasks_post_id_fkey";

alter table "public"."autosales_logs" add constraint "autosales_logs_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."autosales_logs" validate constraint "autosales_logs_lead_id_fkey";

alter table "public"."autosales_logs" add constraint "autosales_logs_puppy_id_fkey" FOREIGN KEY (puppy_id) REFERENCES public.puppies(id) ON DELETE SET NULL not valid;

alter table "public"."autosales_logs" validate constraint "autosales_logs_puppy_id_fkey";

alter table "public"."autosales_logs" add constraint "autosales_logs_sequence_id_fkey" FOREIGN KEY (sequence_id) REFERENCES public.autosales_sequences(id) ON DELETE CASCADE not valid;

alter table "public"."autosales_logs" validate constraint "autosales_logs_sequence_id_fkey";

alter table "public"."autosales_sequences" add constraint "autosales_sequences_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."autosales_sequences" validate constraint "autosales_sequences_lead_id_fkey";

alter table "public"."autosales_sequences" add constraint "autosales_sequences_puppy_id_fkey" FOREIGN KEY (puppy_id) REFERENCES public.puppies(id) ON DELETE SET NULL not valid;

alter table "public"."autosales_sequences" validate constraint "autosales_sequences_puppy_id_fkey";

alter table "public"."blog_authors" add constraint "blog_authors_slug_key" UNIQUE using index "blog_authors_slug_key";

alter table "public"."blog_categories" add constraint "blog_categories_name_key" UNIQUE using index "blog_categories_name_key";

alter table "public"."blog_categories" add constraint "blog_categories_slug_key" UNIQUE using index "blog_categories_slug_key";

alter table "public"."blog_comments" add constraint "blog_comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.blog_comments(id) ON DELETE CASCADE not valid;

alter table "public"."blog_comments" validate constraint "blog_comments_parent_id_fkey";

alter table "public"."blog_comments" add constraint "blog_comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_comments" validate constraint "blog_comments_post_id_fkey";

alter table "public"."blog_post_categories" add constraint "blog_post_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_categories" validate constraint "blog_post_categories_category_id_fkey";

alter table "public"."blog_post_categories" add constraint "blog_post_categories_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_categories" validate constraint "blog_post_categories_post_id_fkey";

alter table "public"."blog_post_embeddings" add constraint "blog_post_embeddings_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_embeddings" validate constraint "blog_post_embeddings_post_id_fkey";

alter table "public"."blog_post_localizations" add constraint "blog_post_localizations_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_localizations" validate constraint "blog_post_localizations_post_id_fkey";

alter table "public"."blog_post_localizations" add constraint "blog_post_localizations_post_lang_uniq" UNIQUE using index "blog_post_localizations_post_lang_uniq";

alter table "public"."blog_post_localizations" add constraint "blog_post_localizations_slug_lang_uniq" UNIQUE using index "blog_post_localizations_slug_lang_uniq";

alter table "public"."blog_post_revisions" add constraint "blog_post_revisions_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_revisions" validate constraint "blog_post_revisions_post_id_fkey";

alter table "public"."blog_post_schedule_events" add constraint "blog_post_schedule_events_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_schedule_events" validate constraint "blog_post_schedule_events_post_id_fkey";

alter table "public"."blog_post_tags" add constraint "blog_post_tags_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_tags" validate constraint "blog_post_tags_post_id_fkey";

alter table "public"."blog_post_tags" add constraint "blog_post_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_tags" validate constraint "blog_post_tags_tag_id_fkey";

alter table "public"."blog_post_versions" add constraint "blog_post_versions_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_versions" validate constraint "blog_post_versions_post_id_fkey";

alter table "public"."blog_posts" add constraint "blog_posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.blog_authors(id) ON DELETE SET NULL not valid;

alter table "public"."blog_posts" validate constraint "blog_posts_author_id_fkey";

alter table "public"."blog_posts" add constraint "blog_posts_slug_key" UNIQUE using index "blog_posts_slug_key";

alter table "public"."blog_posts" add constraint "blog_posts_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'review'::text, 'scheduled'::text, 'published'::text, 'archived'::text]))) not valid;

alter table "public"."blog_posts" validate constraint "blog_posts_status_check";

alter table "public"."blog_tags" add constraint "blog_tags_name_key" UNIQUE using index "blog_tags_name_key";

alter table "public"."blog_tags" add constraint "blog_tags_slug_key" UNIQUE using index "blog_tags_slug_key";

alter table "public"."catalog_ranking" add constraint "catalog_ranking_puppy_id_fkey" FOREIGN KEY (puppy_id) REFERENCES public.puppies(id) ON DELETE CASCADE not valid;

alter table "public"."catalog_ranking" validate constraint "catalog_ranking_puppy_id_fkey";

alter table "public"."contracts" add constraint "contracts_code_key" UNIQUE using index "contracts_code_key";

alter table "public"."contracts" add constraint "contracts_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."contracts" validate constraint "contracts_customer_id_fkey";

alter table "public"."contracts" add constraint "contracts_puppy_id_fkey" FOREIGN KEY (puppy_id) REFERENCES public.puppies(id) ON DELETE CASCADE not valid;

alter table "public"."contracts" validate constraint "contracts_puppy_id_fkey";

alter table "public"."customers" add constraint "customers_cpf_key" UNIQUE using index "customers_cpf_key";

alter table "public"."customers" add constraint "customers_email_key" UNIQUE using index "customers_email_key";

alter table "public"."customers" add constraint "customers_telefone_key" UNIQUE using index "customers_telefone_key";

alter table "public"."events" add constraint "events_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL not valid;

alter table "public"."events" validate constraint "events_lead_id_fkey";

alter table "public"."experiments" add constraint "experiments_key_key" UNIQUE using index "experiments_key_key";

alter table "public"."integrations" add constraint "integrations_provider_check" CHECK ((provider = ANY (ARRAY['facebook'::text, 'google_analytics'::text, 'google_tag_manager'::text, 'tiktok'::text]))) not valid;

alter table "public"."integrations" validate constraint "integrations_provider_check";

alter table "public"."integrations" add constraint "integrations_user_provider_key" UNIQUE using index "integrations_user_provider_key";

alter table "public"."lead_ai_insights" add constraint "lead_ai_insights_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."lead_ai_insights" validate constraint "lead_ai_insights_lead_id_fkey";

alter table "public"."lead_ai_insights" add constraint "lead_ai_insights_lead_id_key" UNIQUE using index "lead_ai_insights_lead_id_key";

alter table "public"."lead_ai_insights" add constraint "lead_ai_insights_matched_puppy_id_fkey" FOREIGN KEY (matched_puppy_id) REFERENCES public.puppies(id) not valid;

alter table "public"."lead_ai_insights" validate constraint "lead_ai_insights_matched_puppy_id_fkey";

alter table "public"."newsletter_subscribers" add constraint "newsletter_subscribers_email_key" UNIQUE using index "newsletter_subscribers_email_key";

alter table "public"."post_media" add constraint "post_media_media_id_fkey" FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE not valid;

alter table "public"."post_media" validate constraint "post_media_media_id_fkey";

alter table "public"."post_media" add constraint "post_media_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_media" validate constraint "post_media_post_id_fkey";

alter table "public"."post_media" add constraint "post_media_role_check" CHECK ((role = ANY (ARRAY['cover'::text, 'gallery'::text, 'inline'::text]))) not valid;

alter table "public"."post_media" validate constraint "post_media_role_check";

alter table "public"."puppies" add constraint "puppies_codigo_key" UNIQUE using index "puppies_codigo_key";

alter table "public"."puppies" add constraint "puppies_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."puppies" validate constraint "puppies_customer_id_fkey";

alter table "public"."puppies" add constraint "puppies_gender_check" CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text]))) not valid;

alter table "public"."puppies" validate constraint "puppies_gender_check";

alter table "public"."puppies" add constraint "puppies_preco_check" CHECK ((preco >= (0)::numeric)) not valid;

alter table "public"."puppies" validate constraint "puppies_preco_check";

alter table "public"."puppy_media" add constraint "puppy_media_puppy_id_fkey" FOREIGN KEY (puppy_id) REFERENCES public.puppies(id) ON DELETE CASCADE not valid;

alter table "public"."puppy_media" validate constraint "puppy_media_puppy_id_fkey";

alter table "public"."puppy_reviews" add constraint "puppy_reviews_puppy_id_fkey" FOREIGN KEY (puppy_id) REFERENCES public.puppies(id) ON DELETE CASCADE not valid;

alter table "public"."puppy_reviews" validate constraint "puppy_reviews_puppy_id_fkey";

alter table "public"."puppy_reviews" add constraint "puppy_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."puppy_reviews" validate constraint "puppy_reviews_rating_check";

alter table "public"."seo_overrides" add constraint "seo_overrides_uniq" UNIQUE using index "seo_overrides_uniq";

alter table "public"."site_settings" add constraint "site_settings_id_check" CHECK ((id = 1)) not valid;

alter table "public"."site_settings" validate constraint "site_settings_id_check";

alter table "public"."tracking_audit_log" add constraint "tracking_audit_log_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."tracking_audit_log" validate constraint "tracking_audit_log_admin_id_fkey";

alter table "public"."tracking_settings" add constraint "tracking_settings_user_key" UNIQUE using index "tracking_settings_user_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public._touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.ai_generation_sessions_touch()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;$function$
;

CREATE OR REPLACE FUNCTION public.blog_authors_slug_before()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if NEW.slug is null or NEW.slug = '' then
    NEW.slug := lower(regexp_replace(coalesce(NEW.name,''),'[^a-z0-9]+','-','g'));
  end if;
  return NEW;
end;$function$
;

CREATE OR REPLACE FUNCTION public.blog_posts_set_published_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if NEW.status = 'published' and (NEW.published_at is null) then
    NEW.published_at = now();
  end if;
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.blog_posts_set_reading_time()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  wc integer := 0;
begin
  -- naive word count from excerpt + content_mdx
  wc := coalesce(array_length(regexp_split_to_array(coalesce(new.excerpt,'') || ' ' || coalesce(new.content_mdx,''), '\\s+'),1), 0);
  if (new.reading_time is null) then
    new.reading_time := greatest(1, ceil(wc::numeric / 200.0));
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.blog_posts_touch()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.campaign_breakdown_v1(tz text, days integer, source text DEFAULT NULL::text)
 RETURNS TABLE(label text, leads integer, contacted integer, contracts integer, conv numeric)
 LANGUAGE sql
 STABLE
AS $function$
  with period as (
    select ((date_trunc('day', (now() at time zone tz)) - make_interval(days => days - 1)) at time zone tz) as ts
  ),
  base as (
    select coalesce(l.utm_campaign,'(sem campanha)') as label, l.id, l.first_responded_at
    from leads l
    where l.created_at >= (select ts from period)
      and (source is null or l.utm_source = source)
  ),
  leads_ct as (select label, count(*)::int as leads from base group by 1),
  contacted_ct as (select label, count(*)::int as contacted from base where first_responded_at is not null group by 1),
  contracts_ct as (
    select coalesce(l.utm_campaign,'(sem campanha)') as label, count(*)::int as contracts
    from contracts c
    left join leads l on l.id = c.lead_id
    where c.signed_at >= (select ts from period)
      and (source is null or l.utm_source = source)
    group by 1
  )
  select s.label,
         coalesce(l.leads,0),
         coalesce(ct.contacted,0),
         coalesce(cn.contracts,0),
         round(100.0 * coalesce(cn.contracts,0) / nullif(coalesce(l.leads,0),0), 1) as conv
  from (select distinct label from base) s
  left join leads_ct l on l.label = s.label
  left join contacted_ct ct on ct.label = s.label
  left join contracts_ct cn on cn.label = s.label
  order by conv desc nulls last, leads desc;
$function$
;

create or replace view "public"."catalog_ai_metrics" as  SELECT event_type,
    count(*) AS total,
    avg((ctr_after - COALESCE(ctr_before, (0)::numeric))) AS avg_ctr_delta,
    avg((dwell_after_ms - COALESCE(dwell_before_ms, 0))) AS avg_dwell_delta
   FROM public.catalog_ai_events
  GROUP BY event_type;


CREATE OR REPLACE FUNCTION public.distinct_sources(tz text, days integer)
 RETURNS TABLE(source text)
 LANGUAGE sql
 STABLE
AS $function$
  with period_start as (
    select ((date_trunc('day', (now() at time zone tz)) - make_interval(days => days - 1)) at time zone tz) as ts
  )
  select coalesce(utm_source, 'direct')::text as source
  from leads
  where created_at >= (select ts from period_start)
  group by 1
  order by 1;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_compute_seo_score(mdx text, seo_title text, seo_description text, excerpt text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_words int;
  v_headings int;
  v_images int;
  v_alts int;
  v_score int := 0;
BEGIN
  if mdx is null then mdx := ''; end if;
  -- contagem simples
  v_words := (select coalesce(array_length(regexp_split_to_array(mdx,'\s+'),1),0));
  v_headings := (select count(*) from regexp_matches(mdx,'^##\s.+$','gm'));
  v_images := (select count(*) from regexp_matches(mdx,'!\[[^\]]*\]\([^)]*\)','g'));
  v_alts := (select count(*) from regexp_matches(mdx,'!\[[^\]]+\]\([^)]*\)','g'));

  if v_words >= 800 then v_score := v_score + 20; end if;
  if v_words >= 1200 then v_score := v_score + 5; end if;
  if v_words >= 1800 then v_score := v_score + 5; end if;
  if v_headings >= 8 then v_score := v_score + 15; end if;
  if v_headings >= 12 then v_score := v_score + 5; end if;
  if v_images >= 2 then v_score := v_score + 10; end if;
  if v_images >= 4 then v_score := v_score + 5; end if;
  if v_images > 0 and v_alts = v_images then v_score := v_score + 10; end if;
  if v_images > 0 and v_alts >= (v_images * 7 / 10) then v_score := v_score + 5; end if;
  if seo_title is not null and seo_title <> '' then v_score := v_score + 5; end if;
  if seo_description is not null and seo_description <> '' then v_score := v_score + 5; end if;
  if excerpt is not null and excerpt <> '' then v_score := v_score + 5; end if;
  return v_score;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.gen_short_code(n integer DEFAULT 8)
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select upper(substr(encode(gen_random_bytes(8),'hex'),1,n));
$function$
;

CREATE OR REPLACE FUNCTION public.kpi_counts_v2(tz text, days integer, source text DEFAULT NULL::text)
 RETURNS TABLE(leads_today integer, leads_period integer, contacted_period integer, contracts_period integer, puppies_available integer, sla_min integer)
 LANGUAGE sql
 STABLE
AS $function$
  with bounds as (
    select (now() at time zone tz) as local_now
  ),
  range as (
    select
      (date_trunc('day', (select local_now from bounds)) at time zone tz) as today_start_utc,
      ((date_trunc('day', (select local_now from bounds)) - make_interval(days => days - 1)) at time zone tz) as period_start_utc
  ),
  leads_filtered as (
    select *
    from leads
    where created_at >= (select period_start_utc from range)
      and (source is null or utm_source = source)
  ),
  leads_today_tz as (
    select *
    from leads
    where created_at >= (select today_start_utc from range)
      and (source is null or utm_source = source)
  ),
  contacts as (
    select count(*)::int as c
    from leads_filtered
    where first_responded_at is not null
  ),
  contracts_f as (
    select count(*)::int as c
    from contracts ct
    left join leads l on l.id = ct.lead_id
    where ct.signed_at >= (select period_start_utc from range)
      and (source is null or l.utm_source = source)
  ),
  sla_calc as (
    select round(avg(extract(epoch from (first_responded_at - created_at))/60.0))::int as avg_min
    from leads_filtered
    where first_responded_at is not null
  )
  select
    (select count(*) from leads_today_tz)                                           as leads_today,
    (select count(*) from leads_filtered)                                           as leads_period,
    (select c from contacts)                                                        as contacted_period,
    (select c from contracts_f)                                                     as contracts_period,
    (select count(*) from puppies where status::text in ('disponivel','available')) as puppies_available,
    coalesce((select avg_min from sla_calc), 0)                                     as sla_min;
$function$
;

CREATE OR REPLACE FUNCTION public.leads_daily(from_ts timestamp with time zone)
 RETURNS TABLE(day date, value bigint)
 LANGUAGE sql
 STABLE
AS $function$
  select date_trunc('day', created_at)::date as day,
         count(*)::bigint as value
  from leads
  where created_at >= from_ts
  group by 1
  order by 1;
$function$
;

CREATE OR REPLACE FUNCTION public.leads_daily_tz_v2(tz text, days integer, source text DEFAULT NULL::text)
 RETURNS TABLE(day date, value bigint)
 LANGUAGE sql
 STABLE
AS $function$
  with bounds as (
    select (date_trunc('day', (now() at time zone tz)) at time zone tz)::date as today
  ),
  series as (
    select generate_series((select today from bounds) - (days - 1), (select today from bounds), interval '1 day')::date as d
  ),
  counts as (
    select (created_at at time zone tz)::date as d, count(*)::bigint as c
    from leads
    where created_at >= ((select today from bounds) - (days - 1))::timestamp
      and (source is null or utm_source = source)
    group by 1
  )
  select s.d as day, coalesce(c.c, 0) as value
  from series s
  left join counts c on c.d = s.d
  order by s.d;
$function$
;

CREATE OR REPLACE FUNCTION public.puppies_status_dates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.status = 'reservado' and new.reserved_at is null then
    new.reserved_at = now();
  end if;
  if new.status = 'vendido' and new.sold_at is null then
    new.sold_at = now();
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_admin_config_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_autosales_sequences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_catalog_ranking_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_demand_predictions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_lead_ai_insights_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_seo_history_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_tracking_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.site_settings_touch()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.source_breakdown_v1(tz text, days integer)
 RETURNS TABLE(label text, leads integer, contacted integer, contracts integer, conv numeric)
 LANGUAGE sql
 STABLE
AS $function$
  with period as (
    select ((date_trunc('day', (now() at time zone tz)) - make_interval(days => days - 1)) at time zone tz) as ts
  ),
  base as (
    select coalesce(l.utm_source,'direct') as label, l.id, l.first_responded_at
    from leads l
    where l.created_at >= (select ts from period)
  ),
  leads_ct as (select label, count(*)::int as leads from base group by 1),
  contacted_ct as (select label, count(*)::int as contacted from base where first_responded_at is not null group by 1),
  contracts_ct as (
    select coalesce(l.utm_source,'direct') as label, count(*)::int as contracts
    from contracts c
    left join leads l on l.id = c.lead_id
    where c.signed_at >= (select ts from period)
    group by 1
  )
  select s.label,
         coalesce(l.leads,0),
         coalesce(ct.contacted,0),
         coalesce(cn.contracts,0),
         round(100.0 * coalesce(cn.contracts,0) / nullif(coalesce(l.leads,0),0), 1) as conv
  from (select distinct label from base) s
  left join leads_ct l on l.label = s.label
  left join contacted_ct ct on ct.label = s.label
  left join contracts_ct cn on cn.label = s.label
  order by conv desc nulls last, leads desc;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_puppy_reviews_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_blog_posts_seo_score()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.seo_score := fn_compute_seo_score(NEW.content_mdx, NEW.seo_title, NEW.seo_description, NEW.excerpt);
  return NEW;
END;
$function$
;

create or replace view "public"."v_contracts_status" as  SELECT status,
    (count(*))::integer AS total
   FROM public.contracts
  GROUP BY status;


create or replace view "public"."v_dashboard_overview" as  WITH base AS (
         SELECT ( SELECT count(*) AS count
                   FROM public.leads
                  WHERE ((leads.created_at)::date = CURRENT_DATE)) AS leads_hoje,
            ( SELECT count(*) AS count
                   FROM public.leads
                  WHERE (leads.created_at >= (now() - '7 days'::interval))) AS leads_semana,
            ( SELECT count(*) AS count
                   FROM public.puppies
                  WHERE (puppies.status = 'disponivel'::public.puppy_status)) AS filhotes_disponiveis,
            ( SELECT count(*) AS count
                   FROM public.leads) AS leads_total,
            ( SELECT count(*) AS count
                   FROM public.leads
                  WHERE (leads.status = 'convertido'::public.lead_status)) AS leads_convertidos
        )
 SELECT leads_hoje,
    leads_semana,
    filhotes_disponiveis,
        CASE
            WHEN (leads_total = 0) THEN (0)::numeric
            ELSE round((((leads_convertidos)::numeric / (leads_total)::numeric) * (100)::numeric), 2)
        END AS taxa_conversao_pct
   FROM base;


create or replace view "public"."v_lead_sources_7d" as  SELECT COALESCE(utm_source, 'desconhecido'::text) AS origem,
    count(*) AS total
   FROM public.leads
  WHERE (created_at >= (now() - '7 days'::interval))
  GROUP BY COALESCE(utm_source, 'desconhecido'::text)
  ORDER BY (count(*)) DESC;


create or replace view "public"."v_leads_by_day_30d" as  SELECT ((created_at AT TIME ZONE 'utc'::text))::date AS day,
    (count(*))::integer AS total
   FROM public.leads
  WHERE (created_at >= (now() - '30 days'::interval))
  GROUP BY (((created_at AT TIME ZONE 'utc'::text))::date)
  ORDER BY (((created_at AT TIME ZONE 'utc'::text))::date);


create or replace view "public"."v_leads_funnel" as  SELECT status,
    (count(*))::integer AS total
   FROM public.leads
  GROUP BY status;


create or replace view "public"."v_puppies_status" as  SELECT status,
    (count(*))::integer AS total
   FROM public.puppies
  GROUP BY status;


create or replace view "public"."v_sla_avg_7d" as  SELECT round(avg((EXTRACT(epoch FROM (first_responded_at - created_at)) / (60)::numeric)), 1) AS sla_min
   FROM public.leads
  WHERE ((first_responded_at IS NOT NULL) AND (created_at >= (now() - '7 days'::interval)));


create or replace view "public"."v_top_sources_30d" as  SELECT COALESCE(NULLIF(utm_source, ''::text), NULLIF(source, ''::text), 'direto'::text) AS src,
    (count(*))::integer AS total
   FROM public.leads
  WHERE (created_at >= (now() - '30 days'::interval))
  GROUP BY COALESCE(NULLIF(utm_source, ''::text), NULLIF(source, ''::text), 'direto'::text)
  ORDER BY ((count(*))::integer) DESC
 LIMIT 10;


grant delete on table "public"."admin_config" to "anon";

grant insert on table "public"."admin_config" to "anon";

grant references on table "public"."admin_config" to "anon";

grant select on table "public"."admin_config" to "anon";

grant trigger on table "public"."admin_config" to "anon";

grant truncate on table "public"."admin_config" to "anon";

grant update on table "public"."admin_config" to "anon";

grant delete on table "public"."admin_config" to "authenticated";

grant insert on table "public"."admin_config" to "authenticated";

grant references on table "public"."admin_config" to "authenticated";

grant select on table "public"."admin_config" to "authenticated";

grant trigger on table "public"."admin_config" to "authenticated";

grant truncate on table "public"."admin_config" to "authenticated";

grant update on table "public"."admin_config" to "authenticated";

grant delete on table "public"."admin_config" to "service_role";

grant insert on table "public"."admin_config" to "service_role";

grant references on table "public"."admin_config" to "service_role";

grant select on table "public"."admin_config" to "service_role";

grant trigger on table "public"."admin_config" to "service_role";

grant truncate on table "public"."admin_config" to "service_role";

grant update on table "public"."admin_config" to "service_role";

grant delete on table "public"."admin_users" to "anon";

grant insert on table "public"."admin_users" to "anon";

grant references on table "public"."admin_users" to "anon";

grant select on table "public"."admin_users" to "anon";

grant trigger on table "public"."admin_users" to "anon";

grant truncate on table "public"."admin_users" to "anon";

grant update on table "public"."admin_users" to "anon";

grant delete on table "public"."admin_users" to "authenticated";

grant insert on table "public"."admin_users" to "authenticated";

grant references on table "public"."admin_users" to "authenticated";

grant select on table "public"."admin_users" to "authenticated";

grant trigger on table "public"."admin_users" to "authenticated";

grant truncate on table "public"."admin_users" to "authenticated";

grant update on table "public"."admin_users" to "authenticated";

grant delete on table "public"."admin_users" to "service_role";

grant insert on table "public"."admin_users" to "service_role";

grant references on table "public"."admin_users" to "service_role";

grant select on table "public"."admin_users" to "service_role";

grant trigger on table "public"."admin_users" to "service_role";

grant truncate on table "public"."admin_users" to "service_role";

grant update on table "public"."admin_users" to "service_role";

grant delete on table "public"."ai_generation_sessions" to "anon";

grant insert on table "public"."ai_generation_sessions" to "anon";

grant references on table "public"."ai_generation_sessions" to "anon";

grant select on table "public"."ai_generation_sessions" to "anon";

grant trigger on table "public"."ai_generation_sessions" to "anon";

grant truncate on table "public"."ai_generation_sessions" to "anon";

grant update on table "public"."ai_generation_sessions" to "anon";

grant delete on table "public"."ai_generation_sessions" to "authenticated";

grant insert on table "public"."ai_generation_sessions" to "authenticated";

grant references on table "public"."ai_generation_sessions" to "authenticated";

grant select on table "public"."ai_generation_sessions" to "authenticated";

grant trigger on table "public"."ai_generation_sessions" to "authenticated";

grant truncate on table "public"."ai_generation_sessions" to "authenticated";

grant update on table "public"."ai_generation_sessions" to "authenticated";

grant delete on table "public"."ai_generation_sessions" to "service_role";

grant insert on table "public"."ai_generation_sessions" to "service_role";

grant references on table "public"."ai_generation_sessions" to "service_role";

grant select on table "public"."ai_generation_sessions" to "service_role";

grant trigger on table "public"."ai_generation_sessions" to "service_role";

grant truncate on table "public"."ai_generation_sessions" to "service_role";

grant update on table "public"."ai_generation_sessions" to "service_role";

grant delete on table "public"."ai_tasks" to "anon";

grant insert on table "public"."ai_tasks" to "anon";

grant references on table "public"."ai_tasks" to "anon";

grant select on table "public"."ai_tasks" to "anon";

grant trigger on table "public"."ai_tasks" to "anon";

grant truncate on table "public"."ai_tasks" to "anon";

grant update on table "public"."ai_tasks" to "anon";

grant delete on table "public"."ai_tasks" to "authenticated";

grant insert on table "public"."ai_tasks" to "authenticated";

grant references on table "public"."ai_tasks" to "authenticated";

grant select on table "public"."ai_tasks" to "authenticated";

grant trigger on table "public"."ai_tasks" to "authenticated";

grant truncate on table "public"."ai_tasks" to "authenticated";

grant update on table "public"."ai_tasks" to "authenticated";

grant delete on table "public"."ai_tasks" to "service_role";

grant insert on table "public"."ai_tasks" to "service_role";

grant references on table "public"."ai_tasks" to "service_role";

grant select on table "public"."ai_tasks" to "service_role";

grant trigger on table "public"."ai_tasks" to "service_role";

grant truncate on table "public"."ai_tasks" to "service_role";

grant update on table "public"."ai_tasks" to "service_role";

grant delete on table "public"."analytics_events" to "anon";

grant insert on table "public"."analytics_events" to "anon";

grant references on table "public"."analytics_events" to "anon";

grant select on table "public"."analytics_events" to "anon";

grant trigger on table "public"."analytics_events" to "anon";

grant truncate on table "public"."analytics_events" to "anon";

grant update on table "public"."analytics_events" to "anon";

grant delete on table "public"."analytics_events" to "authenticated";

grant insert on table "public"."analytics_events" to "authenticated";

grant references on table "public"."analytics_events" to "authenticated";

grant select on table "public"."analytics_events" to "authenticated";

grant trigger on table "public"."analytics_events" to "authenticated";

grant truncate on table "public"."analytics_events" to "authenticated";

grant update on table "public"."analytics_events" to "authenticated";

grant delete on table "public"."analytics_events" to "service_role";

grant insert on table "public"."analytics_events" to "service_role";

grant references on table "public"."analytics_events" to "service_role";

grant select on table "public"."analytics_events" to "service_role";

grant trigger on table "public"."analytics_events" to "service_role";

grant truncate on table "public"."analytics_events" to "service_role";

grant update on table "public"."analytics_events" to "service_role";

grant delete on table "public"."autosales_logs" to "anon";

grant insert on table "public"."autosales_logs" to "anon";

grant references on table "public"."autosales_logs" to "anon";

grant select on table "public"."autosales_logs" to "anon";

grant trigger on table "public"."autosales_logs" to "anon";

grant truncate on table "public"."autosales_logs" to "anon";

grant update on table "public"."autosales_logs" to "anon";

grant delete on table "public"."autosales_logs" to "authenticated";

grant insert on table "public"."autosales_logs" to "authenticated";

grant references on table "public"."autosales_logs" to "authenticated";

grant select on table "public"."autosales_logs" to "authenticated";

grant trigger on table "public"."autosales_logs" to "authenticated";

grant truncate on table "public"."autosales_logs" to "authenticated";

grant update on table "public"."autosales_logs" to "authenticated";

grant delete on table "public"."autosales_logs" to "service_role";

grant insert on table "public"."autosales_logs" to "service_role";

grant references on table "public"."autosales_logs" to "service_role";

grant select on table "public"."autosales_logs" to "service_role";

grant trigger on table "public"."autosales_logs" to "service_role";

grant truncate on table "public"."autosales_logs" to "service_role";

grant update on table "public"."autosales_logs" to "service_role";

grant delete on table "public"."autosales_sequences" to "anon";

grant insert on table "public"."autosales_sequences" to "anon";

grant references on table "public"."autosales_sequences" to "anon";

grant select on table "public"."autosales_sequences" to "anon";

grant trigger on table "public"."autosales_sequences" to "anon";

grant truncate on table "public"."autosales_sequences" to "anon";

grant update on table "public"."autosales_sequences" to "anon";

grant delete on table "public"."autosales_sequences" to "authenticated";

grant insert on table "public"."autosales_sequences" to "authenticated";

grant references on table "public"."autosales_sequences" to "authenticated";

grant select on table "public"."autosales_sequences" to "authenticated";

grant trigger on table "public"."autosales_sequences" to "authenticated";

grant truncate on table "public"."autosales_sequences" to "authenticated";

grant update on table "public"."autosales_sequences" to "authenticated";

grant delete on table "public"."autosales_sequences" to "service_role";

grant insert on table "public"."autosales_sequences" to "service_role";

grant references on table "public"."autosales_sequences" to "service_role";

grant select on table "public"."autosales_sequences" to "service_role";

grant trigger on table "public"."autosales_sequences" to "service_role";

grant truncate on table "public"."autosales_sequences" to "service_role";

grant update on table "public"."autosales_sequences" to "service_role";

grant delete on table "public"."blog_authors" to "anon";

grant insert on table "public"."blog_authors" to "anon";

grant references on table "public"."blog_authors" to "anon";

grant select on table "public"."blog_authors" to "anon";

grant trigger on table "public"."blog_authors" to "anon";

grant truncate on table "public"."blog_authors" to "anon";

grant update on table "public"."blog_authors" to "anon";

grant delete on table "public"."blog_authors" to "authenticated";

grant insert on table "public"."blog_authors" to "authenticated";

grant references on table "public"."blog_authors" to "authenticated";

grant select on table "public"."blog_authors" to "authenticated";

grant trigger on table "public"."blog_authors" to "authenticated";

grant truncate on table "public"."blog_authors" to "authenticated";

grant update on table "public"."blog_authors" to "authenticated";

grant delete on table "public"."blog_authors" to "service_role";

grant insert on table "public"."blog_authors" to "service_role";

grant references on table "public"."blog_authors" to "service_role";

grant select on table "public"."blog_authors" to "service_role";

grant trigger on table "public"."blog_authors" to "service_role";

grant truncate on table "public"."blog_authors" to "service_role";

grant update on table "public"."blog_authors" to "service_role";

grant delete on table "public"."blog_categories" to "anon";

grant insert on table "public"."blog_categories" to "anon";

grant references on table "public"."blog_categories" to "anon";

grant select on table "public"."blog_categories" to "anon";

grant trigger on table "public"."blog_categories" to "anon";

grant truncate on table "public"."blog_categories" to "anon";

grant update on table "public"."blog_categories" to "anon";

grant delete on table "public"."blog_categories" to "authenticated";

grant insert on table "public"."blog_categories" to "authenticated";

grant references on table "public"."blog_categories" to "authenticated";

grant select on table "public"."blog_categories" to "authenticated";

grant trigger on table "public"."blog_categories" to "authenticated";

grant truncate on table "public"."blog_categories" to "authenticated";

grant update on table "public"."blog_categories" to "authenticated";

grant delete on table "public"."blog_categories" to "service_role";

grant insert on table "public"."blog_categories" to "service_role";

grant references on table "public"."blog_categories" to "service_role";

grant select on table "public"."blog_categories" to "service_role";

grant trigger on table "public"."blog_categories" to "service_role";

grant truncate on table "public"."blog_categories" to "service_role";

grant update on table "public"."blog_categories" to "service_role";

grant delete on table "public"."blog_comments" to "anon";

grant insert on table "public"."blog_comments" to "anon";

grant references on table "public"."blog_comments" to "anon";

grant select on table "public"."blog_comments" to "anon";

grant trigger on table "public"."blog_comments" to "anon";

grant truncate on table "public"."blog_comments" to "anon";

grant update on table "public"."blog_comments" to "anon";

grant delete on table "public"."blog_comments" to "authenticated";

grant insert on table "public"."blog_comments" to "authenticated";

grant references on table "public"."blog_comments" to "authenticated";

grant select on table "public"."blog_comments" to "authenticated";

grant trigger on table "public"."blog_comments" to "authenticated";

grant truncate on table "public"."blog_comments" to "authenticated";

grant update on table "public"."blog_comments" to "authenticated";

grant delete on table "public"."blog_comments" to "service_role";

grant insert on table "public"."blog_comments" to "service_role";

grant references on table "public"."blog_comments" to "service_role";

grant select on table "public"."blog_comments" to "service_role";

grant trigger on table "public"."blog_comments" to "service_role";

grant truncate on table "public"."blog_comments" to "service_role";

grant update on table "public"."blog_comments" to "service_role";

grant delete on table "public"."blog_coverage_history" to "anon";

grant insert on table "public"."blog_coverage_history" to "anon";

grant references on table "public"."blog_coverage_history" to "anon";

grant select on table "public"."blog_coverage_history" to "anon";

grant trigger on table "public"."blog_coverage_history" to "anon";

grant truncate on table "public"."blog_coverage_history" to "anon";

grant update on table "public"."blog_coverage_history" to "anon";

grant delete on table "public"."blog_coverage_history" to "authenticated";

grant insert on table "public"."blog_coverage_history" to "authenticated";

grant references on table "public"."blog_coverage_history" to "authenticated";

grant select on table "public"."blog_coverage_history" to "authenticated";

grant trigger on table "public"."blog_coverage_history" to "authenticated";

grant truncate on table "public"."blog_coverage_history" to "authenticated";

grant update on table "public"."blog_coverage_history" to "authenticated";

grant delete on table "public"."blog_coverage_history" to "service_role";

grant insert on table "public"."blog_coverage_history" to "service_role";

grant references on table "public"."blog_coverage_history" to "service_role";

grant select on table "public"."blog_coverage_history" to "service_role";

grant trigger on table "public"."blog_coverage_history" to "service_role";

grant truncate on table "public"."blog_coverage_history" to "service_role";

grant update on table "public"."blog_coverage_history" to "service_role";

grant delete on table "public"."blog_post_categories" to "anon";

grant insert on table "public"."blog_post_categories" to "anon";

grant references on table "public"."blog_post_categories" to "anon";

grant select on table "public"."blog_post_categories" to "anon";

grant trigger on table "public"."blog_post_categories" to "anon";

grant truncate on table "public"."blog_post_categories" to "anon";

grant update on table "public"."blog_post_categories" to "anon";

grant delete on table "public"."blog_post_categories" to "authenticated";

grant insert on table "public"."blog_post_categories" to "authenticated";

grant references on table "public"."blog_post_categories" to "authenticated";

grant select on table "public"."blog_post_categories" to "authenticated";

grant trigger on table "public"."blog_post_categories" to "authenticated";

grant truncate on table "public"."blog_post_categories" to "authenticated";

grant update on table "public"."blog_post_categories" to "authenticated";

grant delete on table "public"."blog_post_categories" to "service_role";

grant insert on table "public"."blog_post_categories" to "service_role";

grant references on table "public"."blog_post_categories" to "service_role";

grant select on table "public"."blog_post_categories" to "service_role";

grant trigger on table "public"."blog_post_categories" to "service_role";

grant truncate on table "public"."blog_post_categories" to "service_role";

grant update on table "public"."blog_post_categories" to "service_role";

grant delete on table "public"."blog_post_embeddings" to "anon";

grant insert on table "public"."blog_post_embeddings" to "anon";

grant references on table "public"."blog_post_embeddings" to "anon";

grant select on table "public"."blog_post_embeddings" to "anon";

grant trigger on table "public"."blog_post_embeddings" to "anon";

grant truncate on table "public"."blog_post_embeddings" to "anon";

grant update on table "public"."blog_post_embeddings" to "anon";

grant delete on table "public"."blog_post_embeddings" to "authenticated";

grant insert on table "public"."blog_post_embeddings" to "authenticated";

grant references on table "public"."blog_post_embeddings" to "authenticated";

grant select on table "public"."blog_post_embeddings" to "authenticated";

grant trigger on table "public"."blog_post_embeddings" to "authenticated";

grant truncate on table "public"."blog_post_embeddings" to "authenticated";

grant update on table "public"."blog_post_embeddings" to "authenticated";

grant delete on table "public"."blog_post_embeddings" to "service_role";

grant insert on table "public"."blog_post_embeddings" to "service_role";

grant references on table "public"."blog_post_embeddings" to "service_role";

grant select on table "public"."blog_post_embeddings" to "service_role";

grant trigger on table "public"."blog_post_embeddings" to "service_role";

grant truncate on table "public"."blog_post_embeddings" to "service_role";

grant update on table "public"."blog_post_embeddings" to "service_role";

grant delete on table "public"."blog_post_localizations" to "anon";

grant insert on table "public"."blog_post_localizations" to "anon";

grant references on table "public"."blog_post_localizations" to "anon";

grant select on table "public"."blog_post_localizations" to "anon";

grant trigger on table "public"."blog_post_localizations" to "anon";

grant truncate on table "public"."blog_post_localizations" to "anon";

grant update on table "public"."blog_post_localizations" to "anon";

grant delete on table "public"."blog_post_localizations" to "authenticated";

grant insert on table "public"."blog_post_localizations" to "authenticated";

grant references on table "public"."blog_post_localizations" to "authenticated";

grant select on table "public"."blog_post_localizations" to "authenticated";

grant trigger on table "public"."blog_post_localizations" to "authenticated";

grant truncate on table "public"."blog_post_localizations" to "authenticated";

grant update on table "public"."blog_post_localizations" to "authenticated";

grant delete on table "public"."blog_post_localizations" to "service_role";

grant insert on table "public"."blog_post_localizations" to "service_role";

grant references on table "public"."blog_post_localizations" to "service_role";

grant select on table "public"."blog_post_localizations" to "service_role";

grant trigger on table "public"."blog_post_localizations" to "service_role";

grant truncate on table "public"."blog_post_localizations" to "service_role";

grant update on table "public"."blog_post_localizations" to "service_role";

grant delete on table "public"."blog_post_revisions" to "anon";

grant insert on table "public"."blog_post_revisions" to "anon";

grant references on table "public"."blog_post_revisions" to "anon";

grant select on table "public"."blog_post_revisions" to "anon";

grant trigger on table "public"."blog_post_revisions" to "anon";

grant truncate on table "public"."blog_post_revisions" to "anon";

grant update on table "public"."blog_post_revisions" to "anon";

grant delete on table "public"."blog_post_revisions" to "authenticated";

grant insert on table "public"."blog_post_revisions" to "authenticated";

grant references on table "public"."blog_post_revisions" to "authenticated";

grant select on table "public"."blog_post_revisions" to "authenticated";

grant trigger on table "public"."blog_post_revisions" to "authenticated";

grant truncate on table "public"."blog_post_revisions" to "authenticated";

grant update on table "public"."blog_post_revisions" to "authenticated";

grant delete on table "public"."blog_post_revisions" to "service_role";

grant insert on table "public"."blog_post_revisions" to "service_role";

grant references on table "public"."blog_post_revisions" to "service_role";

grant select on table "public"."blog_post_revisions" to "service_role";

grant trigger on table "public"."blog_post_revisions" to "service_role";

grant truncate on table "public"."blog_post_revisions" to "service_role";

grant update on table "public"."blog_post_revisions" to "service_role";

grant delete on table "public"."blog_post_schedule_events" to "anon";

grant insert on table "public"."blog_post_schedule_events" to "anon";

grant references on table "public"."blog_post_schedule_events" to "anon";

grant select on table "public"."blog_post_schedule_events" to "anon";

grant trigger on table "public"."blog_post_schedule_events" to "anon";

grant truncate on table "public"."blog_post_schedule_events" to "anon";

grant update on table "public"."blog_post_schedule_events" to "anon";

grant delete on table "public"."blog_post_schedule_events" to "authenticated";

grant insert on table "public"."blog_post_schedule_events" to "authenticated";

grant references on table "public"."blog_post_schedule_events" to "authenticated";

grant select on table "public"."blog_post_schedule_events" to "authenticated";

grant trigger on table "public"."blog_post_schedule_events" to "authenticated";

grant truncate on table "public"."blog_post_schedule_events" to "authenticated";

grant update on table "public"."blog_post_schedule_events" to "authenticated";

grant delete on table "public"."blog_post_schedule_events" to "service_role";

grant insert on table "public"."blog_post_schedule_events" to "service_role";

grant references on table "public"."blog_post_schedule_events" to "service_role";

grant select on table "public"."blog_post_schedule_events" to "service_role";

grant trigger on table "public"."blog_post_schedule_events" to "service_role";

grant truncate on table "public"."blog_post_schedule_events" to "service_role";

grant update on table "public"."blog_post_schedule_events" to "service_role";

grant delete on table "public"."blog_post_tags" to "anon";

grant insert on table "public"."blog_post_tags" to "anon";

grant references on table "public"."blog_post_tags" to "anon";

grant select on table "public"."blog_post_tags" to "anon";

grant trigger on table "public"."blog_post_tags" to "anon";

grant truncate on table "public"."blog_post_tags" to "anon";

grant update on table "public"."blog_post_tags" to "anon";

grant delete on table "public"."blog_post_tags" to "authenticated";

grant insert on table "public"."blog_post_tags" to "authenticated";

grant references on table "public"."blog_post_tags" to "authenticated";

grant select on table "public"."blog_post_tags" to "authenticated";

grant trigger on table "public"."blog_post_tags" to "authenticated";

grant truncate on table "public"."blog_post_tags" to "authenticated";

grant update on table "public"."blog_post_tags" to "authenticated";

grant delete on table "public"."blog_post_tags" to "service_role";

grant insert on table "public"."blog_post_tags" to "service_role";

grant references on table "public"."blog_post_tags" to "service_role";

grant select on table "public"."blog_post_tags" to "service_role";

grant trigger on table "public"."blog_post_tags" to "service_role";

grant truncate on table "public"."blog_post_tags" to "service_role";

grant update on table "public"."blog_post_tags" to "service_role";

grant delete on table "public"."blog_post_versions" to "anon";

grant insert on table "public"."blog_post_versions" to "anon";

grant references on table "public"."blog_post_versions" to "anon";

grant select on table "public"."blog_post_versions" to "anon";

grant trigger on table "public"."blog_post_versions" to "anon";

grant truncate on table "public"."blog_post_versions" to "anon";

grant update on table "public"."blog_post_versions" to "anon";

grant delete on table "public"."blog_post_versions" to "authenticated";

grant insert on table "public"."blog_post_versions" to "authenticated";

grant references on table "public"."blog_post_versions" to "authenticated";

grant select on table "public"."blog_post_versions" to "authenticated";

grant trigger on table "public"."blog_post_versions" to "authenticated";

grant truncate on table "public"."blog_post_versions" to "authenticated";

grant update on table "public"."blog_post_versions" to "authenticated";

grant delete on table "public"."blog_post_versions" to "service_role";

grant insert on table "public"."blog_post_versions" to "service_role";

grant references on table "public"."blog_post_versions" to "service_role";

grant select on table "public"."blog_post_versions" to "service_role";

grant trigger on table "public"."blog_post_versions" to "service_role";

grant truncate on table "public"."blog_post_versions" to "service_role";

grant update on table "public"."blog_post_versions" to "service_role";

grant delete on table "public"."blog_posts" to "anon";

grant insert on table "public"."blog_posts" to "anon";

grant references on table "public"."blog_posts" to "anon";

grant select on table "public"."blog_posts" to "anon";

grant trigger on table "public"."blog_posts" to "anon";

grant truncate on table "public"."blog_posts" to "anon";

grant update on table "public"."blog_posts" to "anon";

grant delete on table "public"."blog_posts" to "authenticated";

grant insert on table "public"."blog_posts" to "authenticated";

grant references on table "public"."blog_posts" to "authenticated";

grant select on table "public"."blog_posts" to "authenticated";

grant trigger on table "public"."blog_posts" to "authenticated";

grant truncate on table "public"."blog_posts" to "authenticated";

grant update on table "public"."blog_posts" to "authenticated";

grant delete on table "public"."blog_posts" to "service_role";

grant insert on table "public"."blog_posts" to "service_role";

grant references on table "public"."blog_posts" to "service_role";

grant select on table "public"."blog_posts" to "service_role";

grant trigger on table "public"."blog_posts" to "service_role";

grant truncate on table "public"."blog_posts" to "service_role";

grant update on table "public"."blog_posts" to "service_role";

grant delete on table "public"."blog_tags" to "anon";

grant insert on table "public"."blog_tags" to "anon";

grant references on table "public"."blog_tags" to "anon";

grant select on table "public"."blog_tags" to "anon";

grant trigger on table "public"."blog_tags" to "anon";

grant truncate on table "public"."blog_tags" to "anon";

grant update on table "public"."blog_tags" to "anon";

grant delete on table "public"."blog_tags" to "authenticated";

grant insert on table "public"."blog_tags" to "authenticated";

grant references on table "public"."blog_tags" to "authenticated";

grant select on table "public"."blog_tags" to "authenticated";

grant trigger on table "public"."blog_tags" to "authenticated";

grant truncate on table "public"."blog_tags" to "authenticated";

grant update on table "public"."blog_tags" to "authenticated";

grant delete on table "public"."blog_tags" to "service_role";

grant insert on table "public"."blog_tags" to "service_role";

grant references on table "public"."blog_tags" to "service_role";

grant select on table "public"."blog_tags" to "service_role";

grant trigger on table "public"."blog_tags" to "service_role";

grant truncate on table "public"."blog_tags" to "service_role";

grant update on table "public"."blog_tags" to "service_role";

grant delete on table "public"."catalog_ai_events" to "anon";

grant insert on table "public"."catalog_ai_events" to "anon";

grant references on table "public"."catalog_ai_events" to "anon";

grant select on table "public"."catalog_ai_events" to "anon";

grant trigger on table "public"."catalog_ai_events" to "anon";

grant truncate on table "public"."catalog_ai_events" to "anon";

grant update on table "public"."catalog_ai_events" to "anon";

grant delete on table "public"."catalog_ai_events" to "authenticated";

grant insert on table "public"."catalog_ai_events" to "authenticated";

grant references on table "public"."catalog_ai_events" to "authenticated";

grant select on table "public"."catalog_ai_events" to "authenticated";

grant trigger on table "public"."catalog_ai_events" to "authenticated";

grant truncate on table "public"."catalog_ai_events" to "authenticated";

grant update on table "public"."catalog_ai_events" to "authenticated";

grant delete on table "public"."catalog_ai_events" to "service_role";

grant insert on table "public"."catalog_ai_events" to "service_role";

grant references on table "public"."catalog_ai_events" to "service_role";

grant select on table "public"."catalog_ai_events" to "service_role";

grant trigger on table "public"."catalog_ai_events" to "service_role";

grant truncate on table "public"."catalog_ai_events" to "service_role";

grant update on table "public"."catalog_ai_events" to "service_role";

grant delete on table "public"."catalog_ranking" to "anon";

grant insert on table "public"."catalog_ranking" to "anon";

grant references on table "public"."catalog_ranking" to "anon";

grant select on table "public"."catalog_ranking" to "anon";

grant trigger on table "public"."catalog_ranking" to "anon";

grant truncate on table "public"."catalog_ranking" to "anon";

grant update on table "public"."catalog_ranking" to "anon";

grant delete on table "public"."catalog_ranking" to "authenticated";

grant insert on table "public"."catalog_ranking" to "authenticated";

grant references on table "public"."catalog_ranking" to "authenticated";

grant select on table "public"."catalog_ranking" to "authenticated";

grant trigger on table "public"."catalog_ranking" to "authenticated";

grant truncate on table "public"."catalog_ranking" to "authenticated";

grant update on table "public"."catalog_ranking" to "authenticated";

grant delete on table "public"."catalog_ranking" to "service_role";

grant insert on table "public"."catalog_ranking" to "service_role";

grant references on table "public"."catalog_ranking" to "service_role";

grant select on table "public"."catalog_ranking" to "service_role";

grant trigger on table "public"."catalog_ranking" to "service_role";

grant truncate on table "public"."catalog_ranking" to "service_role";

grant update on table "public"."catalog_ranking" to "service_role";

grant delete on table "public"."contracts" to "anon";

grant insert on table "public"."contracts" to "anon";

grant references on table "public"."contracts" to "anon";

grant select on table "public"."contracts" to "anon";

grant trigger on table "public"."contracts" to "anon";

grant truncate on table "public"."contracts" to "anon";

grant update on table "public"."contracts" to "anon";

grant delete on table "public"."contracts" to "authenticated";

grant insert on table "public"."contracts" to "authenticated";

grant references on table "public"."contracts" to "authenticated";

grant select on table "public"."contracts" to "authenticated";

grant trigger on table "public"."contracts" to "authenticated";

grant truncate on table "public"."contracts" to "authenticated";

grant update on table "public"."contracts" to "authenticated";

grant delete on table "public"."contracts" to "service_role";

grant insert on table "public"."contracts" to "service_role";

grant references on table "public"."contracts" to "service_role";

grant select on table "public"."contracts" to "service_role";

grant trigger on table "public"."contracts" to "service_role";

grant truncate on table "public"."contracts" to "service_role";

grant update on table "public"."contracts" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."demand_predictions" to "anon";

grant insert on table "public"."demand_predictions" to "anon";

grant references on table "public"."demand_predictions" to "anon";

grant select on table "public"."demand_predictions" to "anon";

grant trigger on table "public"."demand_predictions" to "anon";

grant truncate on table "public"."demand_predictions" to "anon";

grant update on table "public"."demand_predictions" to "anon";

grant delete on table "public"."demand_predictions" to "authenticated";

grant insert on table "public"."demand_predictions" to "authenticated";

grant references on table "public"."demand_predictions" to "authenticated";

grant select on table "public"."demand_predictions" to "authenticated";

grant trigger on table "public"."demand_predictions" to "authenticated";

grant truncate on table "public"."demand_predictions" to "authenticated";

grant update on table "public"."demand_predictions" to "authenticated";

grant delete on table "public"."demand_predictions" to "service_role";

grant insert on table "public"."demand_predictions" to "service_role";

grant references on table "public"."demand_predictions" to "service_role";

grant select on table "public"."demand_predictions" to "service_role";

grant trigger on table "public"."demand_predictions" to "service_role";

grant truncate on table "public"."demand_predictions" to "service_role";

grant update on table "public"."demand_predictions" to "service_role";

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."experiments" to "anon";

grant insert on table "public"."experiments" to "anon";

grant references on table "public"."experiments" to "anon";

grant select on table "public"."experiments" to "anon";

grant trigger on table "public"."experiments" to "anon";

grant truncate on table "public"."experiments" to "anon";

grant update on table "public"."experiments" to "anon";

grant delete on table "public"."experiments" to "authenticated";

grant insert on table "public"."experiments" to "authenticated";

grant references on table "public"."experiments" to "authenticated";

grant select on table "public"."experiments" to "authenticated";

grant trigger on table "public"."experiments" to "authenticated";

grant truncate on table "public"."experiments" to "authenticated";

grant update on table "public"."experiments" to "authenticated";

grant delete on table "public"."experiments" to "service_role";

grant insert on table "public"."experiments" to "service_role";

grant references on table "public"."experiments" to "service_role";

grant select on table "public"."experiments" to "service_role";

grant trigger on table "public"."experiments" to "service_role";

grant truncate on table "public"."experiments" to "service_role";

grant update on table "public"."experiments" to "service_role";

grant delete on table "public"."integrations" to "anon";

grant insert on table "public"."integrations" to "anon";

grant references on table "public"."integrations" to "anon";

grant select on table "public"."integrations" to "anon";

grant trigger on table "public"."integrations" to "anon";

grant truncate on table "public"."integrations" to "anon";

grant update on table "public"."integrations" to "anon";

grant delete on table "public"."integrations" to "authenticated";

grant insert on table "public"."integrations" to "authenticated";

grant references on table "public"."integrations" to "authenticated";

grant select on table "public"."integrations" to "authenticated";

grant trigger on table "public"."integrations" to "authenticated";

grant truncate on table "public"."integrations" to "authenticated";

grant update on table "public"."integrations" to "authenticated";

grant delete on table "public"."integrations" to "service_role";

grant insert on table "public"."integrations" to "service_role";

grant references on table "public"."integrations" to "service_role";

grant select on table "public"."integrations" to "service_role";

grant trigger on table "public"."integrations" to "service_role";

grant truncate on table "public"."integrations" to "service_role";

grant update on table "public"."integrations" to "service_role";

grant delete on table "public"."lead_ai_insights" to "anon";

grant insert on table "public"."lead_ai_insights" to "anon";

grant references on table "public"."lead_ai_insights" to "anon";

grant select on table "public"."lead_ai_insights" to "anon";

grant trigger on table "public"."lead_ai_insights" to "anon";

grant truncate on table "public"."lead_ai_insights" to "anon";

grant update on table "public"."lead_ai_insights" to "anon";

grant delete on table "public"."lead_ai_insights" to "authenticated";

grant insert on table "public"."lead_ai_insights" to "authenticated";

grant references on table "public"."lead_ai_insights" to "authenticated";

grant select on table "public"."lead_ai_insights" to "authenticated";

grant trigger on table "public"."lead_ai_insights" to "authenticated";

grant truncate on table "public"."lead_ai_insights" to "authenticated";

grant update on table "public"."lead_ai_insights" to "authenticated";

grant delete on table "public"."lead_ai_insights" to "service_role";

grant insert on table "public"."lead_ai_insights" to "service_role";

grant references on table "public"."lead_ai_insights" to "service_role";

grant select on table "public"."lead_ai_insights" to "service_role";

grant trigger on table "public"."lead_ai_insights" to "service_role";

grant truncate on table "public"."lead_ai_insights" to "service_role";

grant update on table "public"."lead_ai_insights" to "service_role";

grant delete on table "public"."leads" to "anon";

grant insert on table "public"."leads" to "anon";

grant references on table "public"."leads" to "anon";

grant select on table "public"."leads" to "anon";

grant trigger on table "public"."leads" to "anon";

grant truncate on table "public"."leads" to "anon";

grant update on table "public"."leads" to "anon";

grant delete on table "public"."leads" to "authenticated";

grant insert on table "public"."leads" to "authenticated";

grant references on table "public"."leads" to "authenticated";

grant select on table "public"."leads" to "authenticated";

grant trigger on table "public"."leads" to "authenticated";

grant truncate on table "public"."leads" to "authenticated";

grant update on table "public"."leads" to "authenticated";

grant delete on table "public"."leads" to "service_role";

grant insert on table "public"."leads" to "service_role";

grant references on table "public"."leads" to "service_role";

grant select on table "public"."leads" to "service_role";

grant trigger on table "public"."leads" to "service_role";

grant truncate on table "public"."leads" to "service_role";

grant update on table "public"."leads" to "service_role";

grant delete on table "public"."media" to "anon";

grant insert on table "public"."media" to "anon";

grant references on table "public"."media" to "anon";

grant select on table "public"."media" to "anon";

grant trigger on table "public"."media" to "anon";

grant truncate on table "public"."media" to "anon";

grant update on table "public"."media" to "anon";

grant delete on table "public"."media" to "authenticated";

grant insert on table "public"."media" to "authenticated";

grant references on table "public"."media" to "authenticated";

grant select on table "public"."media" to "authenticated";

grant trigger on table "public"."media" to "authenticated";

grant truncate on table "public"."media" to "authenticated";

grant update on table "public"."media" to "authenticated";

grant delete on table "public"."media" to "service_role";

grant insert on table "public"."media" to "service_role";

grant references on table "public"."media" to "service_role";

grant select on table "public"."media" to "service_role";

grant trigger on table "public"."media" to "service_role";

grant truncate on table "public"."media" to "service_role";

grant update on table "public"."media" to "service_role";

grant delete on table "public"."media_assets" to "anon";

grant insert on table "public"."media_assets" to "anon";

grant references on table "public"."media_assets" to "anon";

grant select on table "public"."media_assets" to "anon";

grant trigger on table "public"."media_assets" to "anon";

grant truncate on table "public"."media_assets" to "anon";

grant update on table "public"."media_assets" to "anon";

grant delete on table "public"."media_assets" to "authenticated";

grant insert on table "public"."media_assets" to "authenticated";

grant references on table "public"."media_assets" to "authenticated";

grant select on table "public"."media_assets" to "authenticated";

grant trigger on table "public"."media_assets" to "authenticated";

grant truncate on table "public"."media_assets" to "authenticated";

grant update on table "public"."media_assets" to "authenticated";

grant delete on table "public"."media_assets" to "service_role";

grant insert on table "public"."media_assets" to "service_role";

grant references on table "public"."media_assets" to "service_role";

grant select on table "public"."media_assets" to "service_role";

grant trigger on table "public"."media_assets" to "service_role";

grant truncate on table "public"."media_assets" to "service_role";

grant update on table "public"."media_assets" to "service_role";

grant delete on table "public"."newsletter_subscribers" to "anon";

grant insert on table "public"."newsletter_subscribers" to "anon";

grant references on table "public"."newsletter_subscribers" to "anon";

grant select on table "public"."newsletter_subscribers" to "anon";

grant trigger on table "public"."newsletter_subscribers" to "anon";

grant truncate on table "public"."newsletter_subscribers" to "anon";

grant update on table "public"."newsletter_subscribers" to "anon";

grant delete on table "public"."newsletter_subscribers" to "authenticated";

grant insert on table "public"."newsletter_subscribers" to "authenticated";

grant references on table "public"."newsletter_subscribers" to "authenticated";

grant select on table "public"."newsletter_subscribers" to "authenticated";

grant trigger on table "public"."newsletter_subscribers" to "authenticated";

grant truncate on table "public"."newsletter_subscribers" to "authenticated";

grant update on table "public"."newsletter_subscribers" to "authenticated";

grant delete on table "public"."newsletter_subscribers" to "service_role";

grant insert on table "public"."newsletter_subscribers" to "service_role";

grant references on table "public"."newsletter_subscribers" to "service_role";

grant select on table "public"."newsletter_subscribers" to "service_role";

grant trigger on table "public"."newsletter_subscribers" to "service_role";

grant truncate on table "public"."newsletter_subscribers" to "service_role";

grant update on table "public"."newsletter_subscribers" to "service_role";

grant delete on table "public"."post_media" to "anon";

grant insert on table "public"."post_media" to "anon";

grant references on table "public"."post_media" to "anon";

grant select on table "public"."post_media" to "anon";

grant trigger on table "public"."post_media" to "anon";

grant truncate on table "public"."post_media" to "anon";

grant update on table "public"."post_media" to "anon";

grant delete on table "public"."post_media" to "authenticated";

grant insert on table "public"."post_media" to "authenticated";

grant references on table "public"."post_media" to "authenticated";

grant select on table "public"."post_media" to "authenticated";

grant trigger on table "public"."post_media" to "authenticated";

grant truncate on table "public"."post_media" to "authenticated";

grant update on table "public"."post_media" to "authenticated";

grant delete on table "public"."post_media" to "service_role";

grant insert on table "public"."post_media" to "service_role";

grant references on table "public"."post_media" to "service_role";

grant select on table "public"."post_media" to "service_role";

grant trigger on table "public"."post_media" to "service_role";

grant truncate on table "public"."post_media" to "service_role";

grant update on table "public"."post_media" to "service_role";

grant delete on table "public"."puppies" to "anon";

grant insert on table "public"."puppies" to "anon";

grant references on table "public"."puppies" to "anon";

grant select on table "public"."puppies" to "anon";

grant trigger on table "public"."puppies" to "anon";

grant truncate on table "public"."puppies" to "anon";

grant update on table "public"."puppies" to "anon";

grant delete on table "public"."puppies" to "authenticated";

grant insert on table "public"."puppies" to "authenticated";

grant references on table "public"."puppies" to "authenticated";

grant select on table "public"."puppies" to "authenticated";

grant trigger on table "public"."puppies" to "authenticated";

grant truncate on table "public"."puppies" to "authenticated";

grant update on table "public"."puppies" to "authenticated";

grant delete on table "public"."puppies" to "service_role";

grant insert on table "public"."puppies" to "service_role";

grant references on table "public"."puppies" to "service_role";

grant select on table "public"."puppies" to "service_role";

grant trigger on table "public"."puppies" to "service_role";

grant truncate on table "public"."puppies" to "service_role";

grant update on table "public"."puppies" to "service_role";

grant delete on table "public"."puppy_media" to "anon";

grant insert on table "public"."puppy_media" to "anon";

grant references on table "public"."puppy_media" to "anon";

grant select on table "public"."puppy_media" to "anon";

grant trigger on table "public"."puppy_media" to "anon";

grant truncate on table "public"."puppy_media" to "anon";

grant update on table "public"."puppy_media" to "anon";

grant delete on table "public"."puppy_media" to "authenticated";

grant insert on table "public"."puppy_media" to "authenticated";

grant references on table "public"."puppy_media" to "authenticated";

grant select on table "public"."puppy_media" to "authenticated";

grant trigger on table "public"."puppy_media" to "authenticated";

grant truncate on table "public"."puppy_media" to "authenticated";

grant update on table "public"."puppy_media" to "authenticated";

grant delete on table "public"."puppy_media" to "service_role";

grant insert on table "public"."puppy_media" to "service_role";

grant references on table "public"."puppy_media" to "service_role";

grant select on table "public"."puppy_media" to "service_role";

grant trigger on table "public"."puppy_media" to "service_role";

grant truncate on table "public"."puppy_media" to "service_role";

grant update on table "public"."puppy_media" to "service_role";

grant delete on table "public"."puppy_reviews" to "anon";

grant insert on table "public"."puppy_reviews" to "anon";

grant references on table "public"."puppy_reviews" to "anon";

grant select on table "public"."puppy_reviews" to "anon";

grant trigger on table "public"."puppy_reviews" to "anon";

grant truncate on table "public"."puppy_reviews" to "anon";

grant update on table "public"."puppy_reviews" to "anon";

grant delete on table "public"."puppy_reviews" to "authenticated";

grant insert on table "public"."puppy_reviews" to "authenticated";

grant references on table "public"."puppy_reviews" to "authenticated";

grant select on table "public"."puppy_reviews" to "authenticated";

grant trigger on table "public"."puppy_reviews" to "authenticated";

grant truncate on table "public"."puppy_reviews" to "authenticated";

grant update on table "public"."puppy_reviews" to "authenticated";

grant delete on table "public"."puppy_reviews" to "service_role";

grant insert on table "public"."puppy_reviews" to "service_role";

grant references on table "public"."puppy_reviews" to "service_role";

grant select on table "public"."puppy_reviews" to "service_role";

grant trigger on table "public"."puppy_reviews" to "service_role";

grant truncate on table "public"."puppy_reviews" to "service_role";

grant update on table "public"."puppy_reviews" to "service_role";

grant delete on table "public"."redirects" to "anon";

grant insert on table "public"."redirects" to "anon";

grant references on table "public"."redirects" to "anon";

grant select on table "public"."redirects" to "anon";

grant trigger on table "public"."redirects" to "anon";

grant truncate on table "public"."redirects" to "anon";

grant update on table "public"."redirects" to "anon";

grant delete on table "public"."redirects" to "authenticated";

grant insert on table "public"."redirects" to "authenticated";

grant references on table "public"."redirects" to "authenticated";

grant select on table "public"."redirects" to "authenticated";

grant trigger on table "public"."redirects" to "authenticated";

grant truncate on table "public"."redirects" to "authenticated";

grant update on table "public"."redirects" to "authenticated";

grant delete on table "public"."redirects" to "service_role";

grant insert on table "public"."redirects" to "service_role";

grant references on table "public"."redirects" to "service_role";

grant select on table "public"."redirects" to "service_role";

grant trigger on table "public"."redirects" to "service_role";

grant truncate on table "public"."redirects" to "service_role";

grant update on table "public"."redirects" to "service_role";

grant delete on table "public"."seo_history" to "anon";

grant insert on table "public"."seo_history" to "anon";

grant references on table "public"."seo_history" to "anon";

grant select on table "public"."seo_history" to "anon";

grant trigger on table "public"."seo_history" to "anon";

grant truncate on table "public"."seo_history" to "anon";

grant update on table "public"."seo_history" to "anon";

grant delete on table "public"."seo_history" to "authenticated";

grant insert on table "public"."seo_history" to "authenticated";

grant references on table "public"."seo_history" to "authenticated";

grant select on table "public"."seo_history" to "authenticated";

grant trigger on table "public"."seo_history" to "authenticated";

grant truncate on table "public"."seo_history" to "authenticated";

grant update on table "public"."seo_history" to "authenticated";

grant delete on table "public"."seo_history" to "service_role";

grant insert on table "public"."seo_history" to "service_role";

grant references on table "public"."seo_history" to "service_role";

grant select on table "public"."seo_history" to "service_role";

grant trigger on table "public"."seo_history" to "service_role";

grant truncate on table "public"."seo_history" to "service_role";

grant update on table "public"."seo_history" to "service_role";

grant delete on table "public"."seo_overrides" to "anon";

grant insert on table "public"."seo_overrides" to "anon";

grant references on table "public"."seo_overrides" to "anon";

grant select on table "public"."seo_overrides" to "anon";

grant trigger on table "public"."seo_overrides" to "anon";

grant truncate on table "public"."seo_overrides" to "anon";

grant update on table "public"."seo_overrides" to "anon";

grant delete on table "public"."seo_overrides" to "authenticated";

grant insert on table "public"."seo_overrides" to "authenticated";

grant references on table "public"."seo_overrides" to "authenticated";

grant select on table "public"."seo_overrides" to "authenticated";

grant trigger on table "public"."seo_overrides" to "authenticated";

grant truncate on table "public"."seo_overrides" to "authenticated";

grant update on table "public"."seo_overrides" to "authenticated";

grant delete on table "public"."seo_overrides" to "service_role";

grant insert on table "public"."seo_overrides" to "service_role";

grant references on table "public"."seo_overrides" to "service_role";

grant select on table "public"."seo_overrides" to "service_role";

grant trigger on table "public"."seo_overrides" to "service_role";

grant truncate on table "public"."seo_overrides" to "service_role";

grant update on table "public"."seo_overrides" to "service_role";

grant delete on table "public"."seo_rules" to "anon";

grant insert on table "public"."seo_rules" to "anon";

grant references on table "public"."seo_rules" to "anon";

grant select on table "public"."seo_rules" to "anon";

grant trigger on table "public"."seo_rules" to "anon";

grant truncate on table "public"."seo_rules" to "anon";

grant update on table "public"."seo_rules" to "anon";

grant delete on table "public"."seo_rules" to "authenticated";

grant insert on table "public"."seo_rules" to "authenticated";

grant references on table "public"."seo_rules" to "authenticated";

grant select on table "public"."seo_rules" to "authenticated";

grant trigger on table "public"."seo_rules" to "authenticated";

grant truncate on table "public"."seo_rules" to "authenticated";

grant update on table "public"."seo_rules" to "authenticated";

grant delete on table "public"."seo_rules" to "service_role";

grant insert on table "public"."seo_rules" to "service_role";

grant references on table "public"."seo_rules" to "service_role";

grant select on table "public"."seo_rules" to "service_role";

grant trigger on table "public"."seo_rules" to "service_role";

grant truncate on table "public"."seo_rules" to "service_role";

grant update on table "public"."seo_rules" to "service_role";

grant delete on table "public"."seo_suggestions" to "anon";

grant insert on table "public"."seo_suggestions" to "anon";

grant references on table "public"."seo_suggestions" to "anon";

grant select on table "public"."seo_suggestions" to "anon";

grant trigger on table "public"."seo_suggestions" to "anon";

grant truncate on table "public"."seo_suggestions" to "anon";

grant update on table "public"."seo_suggestions" to "anon";

grant delete on table "public"."seo_suggestions" to "authenticated";

grant insert on table "public"."seo_suggestions" to "authenticated";

grant references on table "public"."seo_suggestions" to "authenticated";

grant select on table "public"."seo_suggestions" to "authenticated";

grant trigger on table "public"."seo_suggestions" to "authenticated";

grant truncate on table "public"."seo_suggestions" to "authenticated";

grant update on table "public"."seo_suggestions" to "authenticated";

grant delete on table "public"."seo_suggestions" to "service_role";

grant insert on table "public"."seo_suggestions" to "service_role";

grant references on table "public"."seo_suggestions" to "service_role";

grant select on table "public"."seo_suggestions" to "service_role";

grant trigger on table "public"."seo_suggestions" to "service_role";

grant truncate on table "public"."seo_suggestions" to "service_role";

grant update on table "public"."seo_suggestions" to "service_role";

grant delete on table "public"."site_settings" to "anon";

grant insert on table "public"."site_settings" to "anon";

grant references on table "public"."site_settings" to "anon";

grant select on table "public"."site_settings" to "anon";

grant trigger on table "public"."site_settings" to "anon";

grant truncate on table "public"."site_settings" to "anon";

grant update on table "public"."site_settings" to "anon";

grant delete on table "public"."site_settings" to "authenticated";

grant insert on table "public"."site_settings" to "authenticated";

grant references on table "public"."site_settings" to "authenticated";

grant select on table "public"."site_settings" to "authenticated";

grant trigger on table "public"."site_settings" to "authenticated";

grant truncate on table "public"."site_settings" to "authenticated";

grant update on table "public"."site_settings" to "authenticated";

grant delete on table "public"."site_settings" to "service_role";

grant insert on table "public"."site_settings" to "service_role";

grant references on table "public"."site_settings" to "service_role";

grant select on table "public"."site_settings" to "service_role";

grant trigger on table "public"."site_settings" to "service_role";

grant truncate on table "public"."site_settings" to "service_role";

grant update on table "public"."site_settings" to "service_role";

grant delete on table "public"."tracking_audit_log" to "anon";

grant insert on table "public"."tracking_audit_log" to "anon";

grant references on table "public"."tracking_audit_log" to "anon";

grant select on table "public"."tracking_audit_log" to "anon";

grant trigger on table "public"."tracking_audit_log" to "anon";

grant truncate on table "public"."tracking_audit_log" to "anon";

grant update on table "public"."tracking_audit_log" to "anon";

grant delete on table "public"."tracking_audit_log" to "authenticated";

grant insert on table "public"."tracking_audit_log" to "authenticated";

grant references on table "public"."tracking_audit_log" to "authenticated";

grant select on table "public"."tracking_audit_log" to "authenticated";

grant trigger on table "public"."tracking_audit_log" to "authenticated";

grant truncate on table "public"."tracking_audit_log" to "authenticated";

grant update on table "public"."tracking_audit_log" to "authenticated";

grant delete on table "public"."tracking_audit_log" to "service_role";

grant insert on table "public"."tracking_audit_log" to "service_role";

grant references on table "public"."tracking_audit_log" to "service_role";

grant select on table "public"."tracking_audit_log" to "service_role";

grant trigger on table "public"."tracking_audit_log" to "service_role";

grant truncate on table "public"."tracking_audit_log" to "service_role";

grant update on table "public"."tracking_audit_log" to "service_role";

grant delete on table "public"."tracking_settings" to "anon";

grant insert on table "public"."tracking_settings" to "anon";

grant references on table "public"."tracking_settings" to "anon";

grant select on table "public"."tracking_settings" to "anon";

grant trigger on table "public"."tracking_settings" to "anon";

grant truncate on table "public"."tracking_settings" to "anon";

grant update on table "public"."tracking_settings" to "anon";

grant delete on table "public"."tracking_settings" to "authenticated";

grant insert on table "public"."tracking_settings" to "authenticated";

grant references on table "public"."tracking_settings" to "authenticated";

grant select on table "public"."tracking_settings" to "authenticated";

grant trigger on table "public"."tracking_settings" to "authenticated";

grant truncate on table "public"."tracking_settings" to "authenticated";

grant update on table "public"."tracking_settings" to "authenticated";

grant delete on table "public"."tracking_settings" to "service_role";

grant insert on table "public"."tracking_settings" to "service_role";

grant references on table "public"."tracking_settings" to "service_role";

grant select on table "public"."tracking_settings" to "service_role";

grant trigger on table "public"."tracking_settings" to "service_role";

grant truncate on table "public"."tracking_settings" to "service_role";

grant update on table "public"."tracking_settings" to "service_role";

grant delete on table "public"."webhook_outbox" to "anon";

grant insert on table "public"."webhook_outbox" to "anon";

grant references on table "public"."webhook_outbox" to "anon";

grant select on table "public"."webhook_outbox" to "anon";

grant trigger on table "public"."webhook_outbox" to "anon";

grant truncate on table "public"."webhook_outbox" to "anon";

grant update on table "public"."webhook_outbox" to "anon";

grant delete on table "public"."webhook_outbox" to "authenticated";

grant insert on table "public"."webhook_outbox" to "authenticated";

grant references on table "public"."webhook_outbox" to "authenticated";

grant select on table "public"."webhook_outbox" to "authenticated";

grant trigger on table "public"."webhook_outbox" to "authenticated";

grant truncate on table "public"."webhook_outbox" to "authenticated";

grant update on table "public"."webhook_outbox" to "authenticated";

grant delete on table "public"."webhook_outbox" to "service_role";

grant insert on table "public"."webhook_outbox" to "service_role";

grant references on table "public"."webhook_outbox" to "service_role";

grant select on table "public"."webhook_outbox" to "service_role";

grant trigger on table "public"."webhook_outbox" to "service_role";

grant truncate on table "public"."webhook_outbox" to "service_role";

grant update on table "public"."webhook_outbox" to "service_role";


  create policy "service_role_full_access"
  on "public"."admin_users"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "analytics_events_insert_service_role"
  on "public"."analytics_events"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "blog_comments_public_read"
  on "public"."blog_comments"
  as permissive
  for select
  to public
using ((approved = true));



  create policy "Permitir atualização apenas pelo serviço"
  on "public"."blog_post_embeddings"
  as permissive
  for update
  to public
using ((auth.role() = 'service_role'::text))
with check ((auth.role() = 'service_role'::text));



  create policy "Permitir deleção apenas pelo serviço"
  on "public"."blog_post_embeddings"
  as permissive
  for delete
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Permitir escrita apenas pelo serviço"
  on "public"."blog_post_embeddings"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "Permitir leitura pública de embeddings"
  on "public"."blog_post_embeddings"
  as permissive
  for select
  to public
using (true);



  create policy "blog_posts_public_read"
  on "public"."blog_posts"
  as permissive
  for select
  to public
using ((status = 'published'::text));



  create policy "integrations_delete_own"
  on "public"."integrations"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "integrations_insert_own"
  on "public"."integrations"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "integrations_select_own"
  on "public"."integrations"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "integrations_update_own"
  on "public"."integrations"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "leads_insert_public"
  on "public"."leads"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "leads_select_authenticated"
  on "public"."leads"
  as permissive
  for select
  to authenticated
using (true);



  create policy "public_read_puppies"
  on "public"."puppies"
  as permissive
  for select
  to anon, authenticated
using ((status = ANY (ARRAY['disponivel'::public.puppy_status, 'reservado'::public.puppy_status])));



  create policy "puppies_public_read"
  on "public"."puppies"
  as permissive
  for select
  to public
using (true);



  create policy "puppies_public_select"
  on "public"."puppies"
  as permissive
  for select
  to public
using ((status = ANY (ARRAY['disponivel'::public.puppy_status, 'reservado'::public.puppy_status])));



  create policy "puppy_media_public"
  on "public"."puppy_media"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.puppies p
  WHERE ((p.id = puppy_media.puppy_id) AND (p.status = ANY (ARRAY['disponivel'::public.puppy_status, 'reservado'::public.puppy_status]))))));



  create policy "puppy_reviews_admin_all"
  on "public"."puppy_reviews"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "puppy_reviews_select_approved"
  on "public"."puppy_reviews"
  as permissive
  for select
  to public
using ((approved = true));



  create policy "seo_overrides_public_read"
  on "public"."seo_overrides"
  as permissive
  for select
  to public
using (((entity_type = 'post'::text) AND (EXISTS ( SELECT 1
   FROM public.blog_posts p
  WHERE ((p.id = seo_overrides.entity_id) AND (p.status = 'published'::text))))));



  create policy "allow_public_read_site_settings"
  on "public"."site_settings"
  as permissive
  for select
  to anon
using ((id = 1));



  create policy "public_read_site_settings"
  on "public"."site_settings"
  as permissive
  for select
  to anon
using (true);



  create policy "site_settings_read"
  on "public"."site_settings"
  as permissive
  for select
  to anon
using (true);



  create policy "site_settings_select_auth"
  on "public"."site_settings"
  as permissive
  for select
  to authenticated
using (true);



  create policy "site_settings_update_auth"
  on "public"."site_settings"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "tracking_settings_delete_own"
  on "public"."tracking_settings"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "tracking_settings_insert_own"
  on "public"."tracking_settings"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "tracking_settings_select_own"
  on "public"."tracking_settings"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "tracking_settings_update_own"
  on "public"."tracking_settings"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER trg_admin_config_updated_at BEFORE UPDATE ON public.admin_config FOR EACH ROW EXECUTE FUNCTION public.set_admin_config_updated_at();

CREATE TRIGGER set_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER t_ai_generation_sessions_touch BEFORE UPDATE ON public.ai_generation_sessions FOR EACH ROW EXECUTE FUNCTION public.ai_generation_sessions_touch();

CREATE TRIGGER trg_autosales_sequences_updated_at BEFORE UPDATE ON public.autosales_sequences FOR EACH ROW EXECUTE FUNCTION public.set_autosales_sequences_updated_at();

CREATE TRIGGER t_blog_authors_slug_before BEFORE INSERT OR UPDATE ON public.blog_authors FOR EACH ROW EXECUTE FUNCTION public.blog_authors_slug_before();

CREATE TRIGGER t_blog_categories_touch BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

CREATE TRIGGER t_blog_post_localizations_touch BEFORE UPDATE ON public.blog_post_localizations FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

CREATE TRIGGER blog_posts_seo_score_trg BEFORE INSERT OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.trg_blog_posts_seo_score();

CREATE TRIGGER t_blog_posts_set_published_at BEFORE INSERT OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.blog_posts_set_published_at();

CREATE TRIGGER t_blog_posts_set_reading_time BEFORE INSERT OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.blog_posts_set_reading_time();

CREATE TRIGGER t_blog_posts_touch BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.blog_posts_touch();

CREATE TRIGGER trg_catalog_ranking_updated_at BEFORE UPDATE ON public.catalog_ranking FOR EACH ROW EXECUTE FUNCTION public.set_catalog_ranking_updated_at();

CREATE TRIGGER t_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER t_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_demand_predictions_updated_at BEFORE UPDATE ON public.demand_predictions FOR EACH ROW EXECUTE FUNCTION public.set_demand_predictions_updated_at();

CREATE TRIGGER t_experiments_touch BEFORE UPDATE ON public.experiments FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

CREATE TRIGGER t_integrations_touch BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_lead_ai_insights_updated_at BEFORE UPDATE ON public.lead_ai_insights FOR EACH ROW EXECUTE FUNCTION public.set_lead_ai_insights_updated_at();

CREATE TRIGGER t_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER t_puppies_status_dates BEFORE UPDATE ON public.puppies FOR EACH ROW EXECUTE FUNCTION public.puppies_status_dates();

CREATE TRIGGER t_puppies_updated_at BEFORE UPDATE ON public.puppies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER t_puppy_reviews_touch BEFORE UPDATE ON public.puppy_reviews FOR EACH ROW EXECUTE FUNCTION public.touch_puppy_reviews_updated_at();

CREATE TRIGGER trg_seo_history_updated_at BEFORE UPDATE ON public.seo_history FOR EACH ROW EXECUTE FUNCTION public.set_seo_history_updated_at();

CREATE TRIGGER t_seo_rules_touch BEFORE UPDATE ON public.seo_rules FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

CREATE TRIGGER t_site_settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.site_settings_touch();

CREATE TRIGGER t_tracking_settings_touch BEFORE UPDATE ON public.tracking_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_tracking_settings_updated_at BEFORE UPDATE ON public.tracking_settings FOR EACH ROW EXECUTE FUNCTION public.set_tracking_settings_updated_at();

CREATE TRIGGER t_webhook_outbox_touch BEFORE UPDATE ON public.webhook_outbox FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();


  create policy "public read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'puppy-media'::text));



