

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."contract_status" AS ENUM (
 'pendente',
 'assinado',
 'cancelado'
);


ALTER TYPE "public"."contract_status" OWNER TO "postgres";


CREATE TYPE "public"."lead_status" AS ENUM (
 'novo',
 'contatado',
 'qualificado',
 'perdido',
 'convertido'
);


ALTER TYPE "public"."lead_status" OWNER TO "postgres";


CREATE TYPE "public"."puppy_status" AS ENUM (
 'disponivel',
 'reservado',
 'vendido',
 'indisponivel'
);


ALTER TYPE "public"."puppy_status" OWNER TO "postgres";


CREATE TYPE "public"."sexo_type" AS ENUM (
 'macho',
 'femea'
);


ALTER TYPE "public"."sexo_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_touch_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end $$;


ALTER FUNCTION "public"."_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ai_generation_sessions_touch"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;$$;


ALTER FUNCTION "public"."ai_generation_sessions_touch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_authors_slug_before"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 if NEW.slug is null or NEW.slug = '' then
 NEW.slug := lower(regexp_replace(coalesce(NEW.name,''),'[^a-z0-9]+','-','g'));
 end if;
 return NEW;
end;$$;


ALTER FUNCTION "public"."blog_authors_slug_before"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_posts_set_published_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 if NEW.status = 'published' and (NEW.published_at is null) then
 NEW.published_at = now();
 end if;
 return NEW;
end;
$$;


ALTER FUNCTION "public"."blog_posts_set_published_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_posts_set_reading_time"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
declare
 wc integer := 0;
begin
 -- naive word count from excerpt + content_mdx
 wc := coalesce(array_length(regexp_split_to_array(coalesce(new.excerpt,'') || ' ' || coalesce(new.content_mdx,''), '\\s+'),1), 0);
 if (new.reading_time is null) then
 new.reading_time := greatest(1, ceil(wc::numeric / 200.0));
 end if;
 return new;
end $$;


ALTER FUNCTION "public"."blog_posts_set_reading_time"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_posts_touch"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."blog_posts_touch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."campaign_breakdown_v1"("tz" "text", "days" integer, "source" "text" DEFAULT NULL::"text") RETURNS TABLE("label" "text", "leads" integer, "contacted" integer, "contracts" integer, "conv" numeric)
 LANGUAGE "sql" STABLE
 AS $$
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
$$;


ALTER FUNCTION "public"."campaign_breakdown_v1"("tz" "text", "days" integer, "source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."distinct_sources"("tz" "text", "days" integer) RETURNS TABLE("source" "text")
 LANGUAGE "sql" STABLE
 AS $$
 with period_start as (
 select ((date_trunc('day', (now() at time zone tz)) - make_interval(days => days - 1)) at time zone tz) as ts
 )
 select coalesce(utm_source, 'direct')::text as source
 from leads
 where created_at >= (select ts from period_start)
 group by 1
 order by 1;
$$;


ALTER FUNCTION "public"."distinct_sources"("tz" "text", "days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") RETURNS integer
 LANGUAGE "plpgsql"
 AS $_$
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
$_$;


ALTER FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gen_short_code"("n" integer DEFAULT 8) RETURNS "text"
 LANGUAGE "sql" STABLE
 AS $$
 select upper(substr(encode(gen_random_bytes(8),'hex'),1,n));
$$;


ALTER FUNCTION "public"."gen_short_code"("n" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."kpi_counts_v2"("tz" "text", "days" integer, "source" "text" DEFAULT NULL::"text") RETURNS TABLE("leads_today" integer, "leads_period" integer, "contacted_period" integer, "contracts_period" integer, "puppies_available" integer, "sla_min" integer)
 LANGUAGE "sql" STABLE
 AS $$
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
 (select count(*) from leads_today_tz) as leads_today,
 (select count(*) from leads_filtered) as leads_period,
 (select c from contacts) as contacted_period,
 (select c from contracts_f) as contracts_period,
 (select count(*) from puppies where status::text in ('disponivel','available')) as puppies_available,
 coalesce((select avg_min from sla_calc), 0) as sla_min;
$$;


ALTER FUNCTION "public"."kpi_counts_v2"("tz" "text", "days" integer, "source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) RETURNS TABLE("day" "date", "value" bigint)
 LANGUAGE "sql" STABLE
 AS $$
 select date_trunc('day', created_at)::date as day,
 count(*)::bigint as value
 from leads
 where created_at >= from_ts
 group by 1
 order by 1;
$$;


ALTER FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leads_daily_tz_v2"("tz" "text", "days" integer, "source" "text" DEFAULT NULL::"text") RETURNS TABLE("day" "date", "value" bigint)
 LANGUAGE "sql" STABLE
 AS $$
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
$$;


ALTER FUNCTION "public"."leads_daily_tz_v2"("tz" "text", "days" integer, "source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."puppies_status_dates"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 if new.status = 'reservado' and new.reserved_at is null then
 new.reserved_at = now();
 end if;
 if new.status = 'vendido' and new.sold_at is null then
 new.sold_at = now();
 end if;
 return new;
end;
$$;


ALTER FUNCTION "public"."puppies_status_dates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_admin_config_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."set_admin_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_autosales_sequences_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = timezone('utc', now());
 return new;
end;
$$;


ALTER FUNCTION "public"."set_autosales_sequences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_catalog_ranking_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."set_catalog_ranking_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_demand_predictions_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."set_demand_predictions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_lead_ai_insights_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."set_lead_ai_insights_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_seo_history_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."set_seo_history_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_tracking_settings_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."set_tracking_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."site_settings_touch"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."site_settings_touch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."source_breakdown_v1"("tz" "text", "days" integer) RETURNS TABLE("label" "text", "leads" integer, "contacted" integer, "contracts" integer, "conv" numeric)
 LANGUAGE "sql" STABLE
 AS $$
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
$$;


ALTER FUNCTION "public"."source_breakdown_v1"("tz" "text", "days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_puppy_reviews_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
BEGIN
 NEW.updated_at = now();
 RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_puppy_reviews_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_blog_posts_seo_score"() RETURNS "trigger"
 LANGUAGE "plpgsql"
 AS $$
BEGIN
 NEW.seo_score := fn_compute_seo_score(NEW.content_mdx, NEW.seo_title, NEW.seo_description, NEW.excerpt);
 return NEW;
END;
$$;


ALTER FUNCTION "public"."trg_blog_posts_seo_score"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_config" (
 "id" "text" NOT NULL,
 "brand_name" "text",
 "brand_tagline" "text",
 "contact_email" "text",
 "contact_phone" "text",
 "instagram" "text",
 "tiktok" "text",
 "whatsapp_message" "text",
 "template_first_contact" "text",
 "template_followup" "text",
 "avg_response_minutes" integer,
 "followup_rules" "text",
 "seo_title_default" "text",
 "seo_description_default" "text",
 "seo_meta_tags" "text",
 "created_at" timestamp with time zone DEFAULT "now"(),
 "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
 "user_id" "uuid" NOT NULL,
 "email" "text" NOT NULL,
 "role" "text" DEFAULT 'admin'::"text" NOT NULL,
 "name" "text",
 "active" boolean DEFAULT true NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_users" IS 'Controle de acesso ao painel administrativo';



CREATE TABLE IF NOT EXISTS "public"."ai_generation_sessions" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "topic" "text" NOT NULL,
 "phase" "text" DEFAULT 'outline'::"text" NOT NULL,
 "progress" integer DEFAULT 0 NOT NULL,
 "status" "text" DEFAULT 'active'::"text" NOT NULL,
 "error_message" "text",
 "post_id" "uuid",
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 CONSTRAINT "ai_generation_sessions_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."ai_generation_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_tasks" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "type" "text" NOT NULL,
 "topic" "text",
 "post_id" "uuid",
 "phase" "text",
 "status" "text" DEFAULT 'pending'::"text" NOT NULL,
 "progress" integer DEFAULT 0 NOT NULL,
 "payload" "jsonb",
 "result" "jsonb",
 "error_message" "text",
 "started_at" timestamp with time zone,
 "finished_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "name" "text" NOT NULL,
 "value" numeric,
 "metric_id" "text",
 "label" "text",
 "meta" "jsonb",
 "path" "text",
 "ua" "text",
 "ip" "inet",
 "ts" timestamp with time zone DEFAULT "now"() NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autosales_logs" (
 "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
 "sequence_id" "uuid" NOT NULL,
 "lead_id" "uuid" NOT NULL,
 "puppy_id" "uuid",
 "message_type" "text" NOT NULL,
 "content" "text" NOT NULL,
 "cta_link" "text",
 "status" "text" DEFAULT 'queued'::"text" NOT NULL,
 "error" "text",
 "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
 "objections" "text"[] DEFAULT ARRAY[]::"text"[],
 "sent_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."autosales_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autosales_sequences" (
 "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
 "lead_id" "uuid" NOT NULL,
 "puppy_id" "uuid",
 "tone" "text",
 "urgency" "text",
 "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
 "next_step" "text",
 "next_run_at" timestamp with time zone,
 "step_index" integer DEFAULT 0 NOT NULL,
 "total_steps" integer DEFAULT 0 NOT NULL,
 "fallback_required" boolean DEFAULT false NOT NULL,
 "fallback_reason" "text",
 "bypass_human" boolean DEFAULT false NOT NULL,
 "metrics" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
 "strategy" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
 "last_message_type" "text",
 "last_message_sent_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."autosales_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_authors" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "name" "text" NOT NULL,
 "bio" "text",
 "avatar_url" "text",
 "socials" "jsonb" DEFAULT '{}'::"jsonb",
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "slug" "text"
);


ALTER TABLE "public"."blog_authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_categories" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "name" "text" NOT NULL,
 "slug" "text" NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_comments" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "post_id" "uuid",
 "author_name" "text",
 "author_email" "text",
 "body" "text" NOT NULL,
 "approved" boolean DEFAULT false,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "parent_id" "uuid",
 "user_agent" "text",
 "ip_hash" "text",
 "ai_score" numeric,
 "akismet_score" numeric
);


ALTER TABLE "public"."blog_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_coverage_history" (
 "id" bigint NOT NULL,
 "snapshot_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "covered" integer NOT NULL,
 "total" integer NOT NULL,
 "percent" integer NOT NULL,
 "missing" "jsonb"
);


ALTER TABLE "public"."blog_coverage_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."blog_coverage_history_id_seq"
 START WITH 1
 INCREMENT BY 1
 NO MINVALUE
 NO MAXVALUE
 CACHE 1;


ALTER SEQUENCE "public"."blog_coverage_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."blog_coverage_history_id_seq" OWNED BY "public"."blog_coverage_history"."id";



CREATE TABLE IF NOT EXISTS "public"."blog_post_categories" (
 "post_id" "uuid" NOT NULL,
 "category_id" "uuid" NOT NULL
);


ALTER TABLE "public"."blog_post_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_embeddings" (
 "post_id" "uuid" NOT NULL,
 "source" "text" DEFAULT 'db'::"text" NOT NULL,
 "embedding" "text",
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_post_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_localizations" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "post_id" "uuid" NOT NULL,
 "lang" "text" NOT NULL,
 "slug" "text" NOT NULL,
 "title" "text" NOT NULL,
 "subtitle" "text",
 "content_mdx" "text",
 "seo_title" "text",
 "seo_description" "text",
 "og_image_url" "text",
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_post_localizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_revisions" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "post_id" "uuid",
 "snapshot" "jsonb" NOT NULL,
 "reason" "text",
 "created_by" "uuid",
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_post_revisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_schedule_events" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "post_id" "uuid",
 "run_at" timestamp with time zone NOT NULL,
 "action" "text" NOT NULL,
 "payload" "jsonb",
 "executed_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_post_schedule_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_tags" (
 "post_id" "uuid" NOT NULL,
 "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."blog_post_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_versions" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "post_id" "uuid" NOT NULL,
 "snapshot" "jsonb" NOT NULL,
 "reason" "text",
 "created_by" "text",
 "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_post_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "slug" "text" NOT NULL,
 "title" "text" NOT NULL,
 "subtitle" "text",
 "cover_url" "text",
 "excerpt" "text",
 "content_mdx" "text",
 "status" "text" DEFAULT 'draft'::"text" NOT NULL,
 "scheduled_at" timestamp with time zone,
 "published_at" timestamp with time zone,
 "author_id" "uuid",
 "seo_title" "text",
 "seo_description" "text",
 "og_image_url" "text",
 "lang" "text" DEFAULT 'pt-BR'::"text",
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "content_blocks_json" "jsonb",
 "gallery_json" "jsonb" DEFAULT '[]'::"jsonb",
 "canonical_url" "text",
 "reading_time" integer,
 "updated_by" "uuid",
 "tsv" "tsvector" GENERATED ALWAYS AS (((("setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("title", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("subtitle", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("excerpt", ''::"text")), 'C'::"char")) || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("content_mdx", ''::"text")), 'D'::"char"))) STORED,
 "seo_score" integer,
 "cover_alt" "text",
 "category" "text",
 "tags" "text"[] DEFAULT '{}'::"text"[],
 CONSTRAINT "blog_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'review'::"text", 'scheduled'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."blog_posts" IS 'Posts do blog By Império Dog';



COMMENT ON COLUMN "public"."blog_posts"."category" IS 'Primary category for the blog post (optional)';



COMMENT ON COLUMN "public"."blog_posts"."tags" IS 'Array of tags associated with the post';



CREATE TABLE IF NOT EXISTS "public"."blog_tags" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "name" "text" NOT NULL,
 "slug" "text" NOT NULL
);


ALTER TABLE "public"."blog_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_ai_events" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "event_type" "text" NOT NULL,
 "puppy_id" "uuid",
 "user_session" "text",
 "badge" "text",
 "old_position" integer,
 "new_position" integer,
 "ctr_before" numeric,
 "ctr_after" numeric,
 "dwell_before_ms" integer,
 "dwell_after_ms" integer,
 "personalized" boolean,
 "clicked" boolean,
 "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalog_ai_events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."catalog_ai_metrics" AS
 SELECT "event_type",
 "count"(*) AS "total",
 "avg"(("ctr_after" - COALESCE("ctr_before", (0)::numeric))) AS "avg_ctr_delta",
 "avg"(("dwell_after_ms" - COALESCE("dwell_before_ms", 0))) AS "avg_dwell_delta"
 FROM "public"."catalog_ai_events"
 GROUP BY "event_type";


ALTER VIEW "public"."catalog_ai_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_ranking" (
 "puppy_id" "uuid" NOT NULL,
 "score" integer DEFAULT 0 NOT NULL,
 "flag" "text",
 "reason" "text",
 "rank_order" integer,
 "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalog_ranking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "code" "text" DEFAULT "public"."gen_short_code"(8) NOT NULL,
 "puppy_id" "uuid" NOT NULL,
 "customer_id" "uuid",
 "status" "public"."contract_status" DEFAULT 'pendente'::"public"."contract_status" NOT NULL,
 "signed_at" timestamp with time zone,
 "hemograma_path" "text",
 "laudo_path" "text",
 "payload" "jsonb" DEFAULT '{}'::"jsonb",
 "lead_id" "uuid",
 "total_price_cents" integer
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "nome" "text" NOT NULL,
 "email" "text",
 "telefone" "text",
 "cpf" "text",
 "endereco" "text",
 "cidade" "text",
 "estado" "text",
 "cep" "text",
 "notes" "text"
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demand_predictions" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "color" "text",
 "sex" "text",
 "week_start_date" "date",
 "week_end_date" "date",
 "predicted_leads" numeric,
 "predicted_shortage" boolean,
 "recommendation" "text",
 "risk_alert" "text",
 "features" "jsonb",
 "created_at" timestamp with time zone DEFAULT "now"(),
 "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."demand_predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "lead_id" "uuid",
 "event_type" "text" NOT NULL,
 "meta" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experiments" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "key" "text" NOT NULL,
 "name" "text" NOT NULL,
 "description" "text",
 "status" "text" DEFAULT 'draft'::"text" NOT NULL,
 "audience" "text",
 "variants" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
 "starts_at" timestamp with time zone,
 "ends_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."experiments" OWNER TO "postgres";


COMMENT ON TABLE "public"."experiments" IS 'A/B tests and experiments configuration';



COMMENT ON COLUMN "public"."experiments"."key" IS 'Unique identifier used in tracking events';



COMMENT ON COLUMN "public"."experiments"."variants" IS 'Array of variant definitions with keys, labels, and traffic weights';



CREATE TABLE IF NOT EXISTS "public"."integrations" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "user_id" "uuid" NOT NULL,
 "provider" "text" NOT NULL,
 "access_token" "text" NOT NULL,
 "refresh_token" "text",
 "expires_at" timestamp with time zone,
 "provider_account_id" "text",
 "metadata" "jsonb" DEFAULT '{}'::"jsonb",
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 CONSTRAINT "integrations_provider_check" CHECK (("provider" = ANY (ARRAY['facebook'::"text", 'google_analytics'::"text", 'google_tag_manager'::"text", 'tiktok'::"text"])))
);


ALTER TABLE "public"."integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_ai_insights" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "lead_id" "uuid" NOT NULL,
 "intent" "text",
 "urgency" "text",
 "risk" "text",
 "score" integer,
 "desired_color" "text",
 "desired_sex" "text",
 "desired_city" "text",
 "desired_timeframe" "text",
 "budget_inferred" "text",
 "emotional_tone" "text",
 "matched_puppy_id" "uuid",
 "suggested_puppies" "jsonb",
 "alerts" "jsonb",
 "next_step" "text",
 "insights" "jsonb",
 "processed_at" timestamp with time zone DEFAULT "now"(),
 "created_at" timestamp with time zone DEFAULT "now"(),
 "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_ai_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "nome" "text",
 "telefone" "text",
 "cidade" "text",
 "preferencia" "text",
 "mensagem" "text",
 "utm_source" "text",
 "utm_medium" "text",
 "utm_campaign" "text",
 "referer" "text",
 "page" "text",
 "gclid" "text",
 "fbclid" "text",
 "status" "public"."lead_status" DEFAULT 'novo'::"public"."lead_status" NOT NULL,
 "notes" "text",
 "first_name" "text",
 "last_name" "text",
 "phone" "text",
 "source" "text",
 "first_responded_at" timestamp with time zone
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "url" "text" NOT NULL,
 "alt" "text",
 "width" integer,
 "height" integer,
 "credits" "text",
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_assets" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "file_path" "text" NOT NULL,
 "mime" "text",
 "width" integer,
 "height" integer,
 "size_bytes" integer,
 "tags" "text"[],
 "dominant_color" "text",
 "alt" "text",
 "caption" "text",
 "source" "text",
 "created_by" "text",
 "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "email" "text" NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_media" (
 "post_id" "uuid" NOT NULL,
 "media_id" "uuid" NOT NULL,
 "role" "text" DEFAULT 'gallery'::"text" NOT NULL,
 "position" integer DEFAULT 0,
 CONSTRAINT "post_media_role_check" CHECK (("role" = ANY (ARRAY['cover'::"text", 'gallery'::"text", 'inline'::"text"])))
);


ALTER TABLE "public"."post_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."puppies" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "codigo" "text" DEFAULT "public"."gen_short_code"(6),
 "nome" "text",
 "sexo" "public"."sexo_type",
 "cor" "text",
 "nascimento" "date",
 "pedigree" "text",
 "microchip" "text",
 "preco" numeric(12,2) DEFAULT 0,
 "status" "public"."puppy_status" DEFAULT 'disponivel'::"public"."puppy_status" NOT NULL,
 "reserved_at" timestamp with time zone,
 "sold_at" timestamp with time zone,
 "customer_id" "uuid",
 "midia" "jsonb" DEFAULT '[]'::"jsonb",
 "notes" "text",
 "name" "text",
 "color" "text",
 "gender" "text",
 "price_cents" integer,
 "descricao" "text",
 CONSTRAINT "puppies_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text"]))),
 CONSTRAINT "puppies_preco_check" CHECK (("preco" >= (0)::numeric))
);


ALTER TABLE "public"."puppies" OWNER TO "postgres";


COMMENT ON TABLE "public"."puppies" IS 'Catálogo de filhotes Spitz Alemão disponíveis';



CREATE TABLE IF NOT EXISTS "public"."puppy_media" (
 "id" bigint NOT NULL,
 "puppy_id" "uuid",
 "url" "text" NOT NULL,
 "mime_hint" "text",
 "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."puppy_media" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."puppy_media_id_seq"
 START WITH 1
 INCREMENT BY 1
 NO MINVALUE
 NO MAXVALUE
 CACHE 1;


ALTER SEQUENCE "public"."puppy_media_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."puppy_media_id_seq" OWNED BY "public"."puppy_media"."id";



CREATE TABLE IF NOT EXISTS "public"."puppy_reviews" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "puppy_id" "uuid" NOT NULL,
 "author_name" "text" NOT NULL,
 "author_email" "text",
 "rating" integer NOT NULL,
 "comment" "text",
 "approved" boolean DEFAULT false NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 CONSTRAINT "puppy_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."puppy_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."puppy_reviews" IS 'Avaliações e reviews de filhotes para AggregateRating schema';



COMMENT ON COLUMN "public"."puppy_reviews"."rating" IS 'Nota de 1 a 5 estrelas';



COMMENT ON COLUMN "public"."puppy_reviews"."approved" IS 'Review aprovado pela moderação para exibição pública';



CREATE TABLE IF NOT EXISTS "public"."redirects" (
 "from_path" "text" NOT NULL,
 "to_url" "text" NOT NULL,
 "type" "text" DEFAULT 'permanent'::"text" NOT NULL,
 "active" boolean DEFAULT true NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."redirects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_history" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "route" "text" NOT NULL,
 "action" "text" NOT NULL,
 "before" "jsonb",
 "after" "jsonb",
 "applied_by" "text" DEFAULT 'autopilot'::"text",
 "created_at" timestamp with time zone DEFAULT "now"(),
 "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seo_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_overrides" (
 "entity_type" "text" NOT NULL,
 "entity_id" "uuid",
 "entity_ref" "text",
 "data_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
 "updated_by" "uuid",
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seo_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_rules" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "scope" "text" NOT NULL,
 "scope_ref" "text",
 "rules_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
 "active" boolean DEFAULT true NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seo_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_suggestions" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "entity_type" "text" NOT NULL,
 "entity_id" "uuid",
 "entity_ref" "text",
 "data_json" "jsonb" NOT NULL,
 "score" numeric,
 "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
 "created_by" "uuid",
 "approved_by" "uuid",
 "approved_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seo_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
 "id" integer DEFAULT 1 NOT NULL,
 "gtm_id" "text",
 "ga4_id" "text",
 "meta_pixel_id" "text",
 "tiktok_pixel_id" "text",
 "google_ads_id" "text",
 "google_ads_label" "text",
 "pinterest_tag_id" "text",
 "hotjar_id" "text",
 "clarity_id" "text",
 "meta_domain_verify" "text",
 "fb_capi_token" "text",
 "tiktok_api_token" "text",
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "custom_pixels" "jsonb" DEFAULT '[]'::"jsonb",
 "google_site_verification" "text",
 "ai_primary_provider" "text",
 "ai_primary_base_url" "text",
 "ai_primary_model" "text",
 "ai_primary_api_key" "text",
 "ai_fallback_provider" "text",
 "ai_fallback_base_url" "text",
 "ai_fallback_model" "text",
 "ai_fallback_api_key" "text",
 "ai_vector_index" "text",
 "ai_observability_webhook" "text",
 CONSTRAINT "site_settings_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."site_settings" IS 'Configurações globais do site - mantém linha única (id=1)';



CREATE TABLE IF NOT EXISTS "public"."tracking_audit_log" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "admin_id" "uuid",
 "environment" "text" NOT NULL,
 "before" "jsonb",
 "after" "jsonb",
 "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tracking_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracking_settings" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "user_id" "uuid" NOT NULL,
 "facebook_pixel_id" "text",
 "ga_measurement_id" "text",
 "gtm_container_id" "text",
 "tiktok_pixel_id" "text",
 "is_facebook_pixel_enabled" boolean DEFAULT false NOT NULL,
 "is_ga_enabled" boolean DEFAULT false NOT NULL,
 "is_gtm_enabled" boolean DEFAULT false NOT NULL,
 "is_tiktok_enabled" boolean DEFAULT false NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "environment" "text" NOT NULL
);


ALTER TABLE "public"."tracking_settings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_contracts_status" AS
 SELECT "status",
 ("count"(*))::integer AS "total"
 FROM "public"."contracts"
 GROUP BY "status";


ALTER VIEW "public"."v_contracts_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_dashboard_overview" AS
 WITH "base" AS (
 SELECT ( SELECT "count"(*) AS "count"
 FROM "public"."leads"
 WHERE (("leads"."created_at")::"date" = CURRENT_DATE)) AS "leads_hoje",
 ( SELECT "count"(*) AS "count"
 FROM "public"."leads"
 WHERE ("leads"."created_at" >= ("now"() - '7 days'::interval))) AS "leads_semana",
 ( SELECT "count"(*) AS "count"
 FROM "public"."puppies"
 WHERE ("puppies"."status" = 'disponivel'::"public"."puppy_status")) AS "filhotes_disponiveis",
 ( SELECT "count"(*) AS "count"
 FROM "public"."leads") AS "leads_total",
 ( SELECT "count"(*) AS "count"
 FROM "public"."leads"
 WHERE ("leads"."status" = 'convertido'::"public"."lead_status")) AS "leads_convertidos"
 )
 SELECT "leads_hoje",
 "leads_semana",
 "filhotes_disponiveis",
 CASE
 WHEN ("leads_total" = 0) THEN (0)::numeric
 ELSE "round"(((("leads_convertidos")::numeric / ("leads_total")::numeric) * (100)::numeric), 2)
 END AS "taxa_conversao_pct"
 FROM "base";


ALTER VIEW "public"."v_dashboard_overview" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_lead_sources_7d" AS
 SELECT COALESCE("utm_source", 'desconhecido'::"text") AS "origem",
 "count"(*) AS "total"
 FROM "public"."leads"
 WHERE ("created_at" >= ("now"() - '7 days'::interval))
 GROUP BY COALESCE("utm_source", 'desconhecido'::"text")
 ORDER BY ("count"(*)) DESC;


ALTER VIEW "public"."v_lead_sources_7d" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_leads_by_day_30d" AS
 SELECT (("created_at" AT TIME ZONE 'utc'::"text"))::"date" AS "day",
 ("count"(*))::integer AS "total"
 FROM "public"."leads"
 WHERE ("created_at" >= ("now"() - '30 days'::interval))
 GROUP BY ((("created_at" AT TIME ZONE 'utc'::"text"))::"date")
 ORDER BY ((("created_at" AT TIME ZONE 'utc'::"text"))::"date");


ALTER VIEW "public"."v_leads_by_day_30d" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_leads_funnel" AS
 SELECT "status",
 ("count"(*))::integer AS "total"
 FROM "public"."leads"
 GROUP BY "status";


ALTER VIEW "public"."v_leads_funnel" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_puppies_status" AS
 SELECT "status",
 ("count"(*))::integer AS "total"
 FROM "public"."puppies"
 GROUP BY "status";


ALTER VIEW "public"."v_puppies_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_sla_avg_7d" AS
 SELECT "round"("avg"((EXTRACT(epoch FROM ("first_responded_at" - "created_at")) / (60)::numeric)), 1) AS "sla_min"
 FROM "public"."leads"
 WHERE (("first_responded_at" IS NOT NULL) AND ("created_at" >= ("now"() - '7 days'::interval)));


ALTER VIEW "public"."v_sla_avg_7d" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_top_sources_30d" AS
 SELECT COALESCE(NULLIF("utm_source", ''::"text"), NULLIF("source", ''::"text"), 'direto'::"text") AS "src",
 ("count"(*))::integer AS "total"
 FROM "public"."leads"
 WHERE ("created_at" >= ("now"() - '30 days'::interval))
 GROUP BY COALESCE(NULLIF("utm_source", ''::"text"), NULLIF("source", ''::"text"), 'direto'::"text")
 ORDER BY (("count"(*))::integer) DESC
 LIMIT 10;


ALTER VIEW "public"."v_top_sources_30d" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_outbox" (
 "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
 "event" "text" NOT NULL,
 "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
 "status" "text" DEFAULT 'pending'::"text" NOT NULL,
 "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."webhook_outbox" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blog_coverage_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."blog_coverage_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."puppy_media" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."puppy_media_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_config"
 ADD CONSTRAINT "admin_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
 ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
 ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."ai_generation_sessions"
 ADD CONSTRAINT "ai_generation_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_tasks"
 ADD CONSTRAINT "ai_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
 ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autosales_logs"
 ADD CONSTRAINT "autosales_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autosales_sequences"
 ADD CONSTRAINT "autosales_sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_authors"
 ADD CONSTRAINT "blog_authors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_authors"
 ADD CONSTRAINT "blog_authors_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_categories"
 ADD CONSTRAINT "blog_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."blog_categories"
 ADD CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_categories"
 ADD CONSTRAINT "blog_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_comments"
 ADD CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_coverage_history"
 ADD CONSTRAINT "blog_coverage_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_post_categories"
 ADD CONSTRAINT "blog_post_categories_pkey" PRIMARY KEY ("post_id", "category_id");



ALTER TABLE ONLY "public"."blog_post_embeddings"
 ADD CONSTRAINT "blog_post_embeddings_pkey" PRIMARY KEY ("post_id", "source");



ALTER TABLE ONLY "public"."blog_post_localizations"
 ADD CONSTRAINT "blog_post_localizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_post_localizations"
 ADD CONSTRAINT "blog_post_localizations_post_lang_uniq" UNIQUE ("post_id", "lang");



ALTER TABLE ONLY "public"."blog_post_localizations"
 ADD CONSTRAINT "blog_post_localizations_slug_lang_uniq" UNIQUE ("slug", "lang");



ALTER TABLE ONLY "public"."blog_post_revisions"
 ADD CONSTRAINT "blog_post_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_post_schedule_events"
 ADD CONSTRAINT "blog_post_schedule_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_post_tags"
 ADD CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("post_id", "tag_id");



ALTER TABLE ONLY "public"."blog_post_versions"
 ADD CONSTRAINT "blog_post_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
 ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
 ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_tags"
 ADD CONSTRAINT "blog_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."blog_tags"
 ADD CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_tags"
 ADD CONSTRAINT "blog_tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."catalog_ai_events"
 ADD CONSTRAINT "catalog_ai_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_ranking"
 ADD CONSTRAINT "catalog_ranking_pkey" PRIMARY KEY ("puppy_id");



ALTER TABLE ONLY "public"."contracts"
 ADD CONSTRAINT "contracts_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."contracts"
 ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
 ADD CONSTRAINT "customers_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."customers"
 ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
 ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
 ADD CONSTRAINT "customers_telefone_key" UNIQUE ("telefone");



ALTER TABLE ONLY "public"."demand_predictions"
 ADD CONSTRAINT "demand_predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
 ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."experiments"
 ADD CONSTRAINT "experiments_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."experiments"
 ADD CONSTRAINT "experiments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
 ADD CONSTRAINT "integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."integrations"
 ADD CONSTRAINT "integrations_user_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."lead_ai_insights"
 ADD CONSTRAINT "lead_ai_insights_lead_id_key" UNIQUE ("lead_id");



ALTER TABLE ONLY "public"."lead_ai_insights"
 ADD CONSTRAINT "lead_ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
 ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_assets"
 ADD CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media"
 ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscribers"
 ADD CONSTRAINT "newsletter_subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscribers"
 ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_media"
 ADD CONSTRAINT "post_media_pkey" PRIMARY KEY ("post_id", "media_id", "role");



ALTER TABLE ONLY "public"."puppies"
 ADD CONSTRAINT "puppies_codigo_key" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."puppies"
 ADD CONSTRAINT "puppies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."puppy_media"
 ADD CONSTRAINT "puppy_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."puppy_reviews"
 ADD CONSTRAINT "puppy_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redirects"
 ADD CONSTRAINT "redirects_pkey" PRIMARY KEY ("from_path");



ALTER TABLE ONLY "public"."seo_history"
 ADD CONSTRAINT "seo_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_overrides"
 ADD CONSTRAINT "seo_overrides_uniq" UNIQUE ("entity_type", "entity_id", "entity_ref");



ALTER TABLE ONLY "public"."seo_rules"
 ADD CONSTRAINT "seo_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_suggestions"
 ADD CONSTRAINT "seo_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
 ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_audit_log"
 ADD CONSTRAINT "tracking_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_settings"
 ADD CONSTRAINT "tracking_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_settings"
 ADD CONSTRAINT "tracking_settings_user_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."webhook_outbox"
 ADD CONSTRAINT "webhook_outbox_pkey" PRIMARY KEY ("id");



CREATE INDEX "admin_users_email_idx" ON "public"."admin_users" USING "btree" ("email");



CREATE INDEX "ai_tasks_post_idx" ON "public"."ai_tasks" USING "btree" ("post_id");



CREATE INDEX "ai_tasks_status_idx" ON "public"."ai_tasks" USING "btree" ("status");



CREATE INDEX "analytics_events_name_idx" ON "public"."analytics_events" USING "btree" ("name");



CREATE INDEX "analytics_events_path_idx" ON "public"."analytics_events" USING "btree" ("path");



CREATE INDEX "analytics_events_ts_idx" ON "public"."analytics_events" USING "btree" ("ts" DESC);



CREATE INDEX "blog_post_versions_post_idx" ON "public"."blog_post_versions" USING "btree" ("post_id");



CREATE INDEX "blog_posts_category_lower_idx" ON "public"."blog_posts" USING "btree" ("lower"("category"));



CREATE INDEX "blog_posts_tags_gin_idx" ON "public"."blog_posts" USING "gin" ("tags");



CREATE INDEX "blog_posts_tsv_gin" ON "public"."blog_posts" USING "gin" ("tsv");



CREATE INDEX "catalog_ranking_rank_idx" ON "public"."catalog_ranking" USING "btree" ("rank_order");



CREATE INDEX "catalog_ranking_score_idx" ON "public"."catalog_ranking" USING "btree" ("score" DESC);



CREATE INDEX "idx_autosales_logs_lead" ON "public"."autosales_logs" USING "btree" ("lead_id");



CREATE INDEX "idx_autosales_logs_sequence" ON "public"."autosales_logs" USING "btree" ("sequence_id");



CREATE INDEX "idx_autosales_sequences_lead" ON "public"."autosales_sequences" USING "btree" ("lead_id");



CREATE INDEX "idx_autosales_sequences_status_run" ON "public"."autosales_sequences" USING "btree" ("status", "next_run_at");



CREATE INDEX "idx_blog_authors_slug" ON "public"."blog_authors" USING "btree" ("slug");



CREATE INDEX "idx_blog_comments_parent" ON "public"."blog_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_blog_comments_post" ON "public"."blog_comments" USING "btree" ("post_id", "approved", "created_at" DESC);



CREATE INDEX "idx_blog_comments_post_approved_created" ON "public"."blog_comments" USING "btree" ("post_id", "approved", "created_at" DESC);



CREATE INDEX "idx_blog_comments_post_id" ON "public"."blog_comments" USING "btree" ("post_id");



CREATE INDEX "idx_blog_coverage_history_snapshot" ON "public"."blog_coverage_history" USING "btree" ("snapshot_at" DESC);



CREATE INDEX "idx_blog_post_categories_category" ON "public"."blog_post_categories" USING "btree" ("category_id");



CREATE INDEX "idx_blog_post_categories_post" ON "public"."blog_post_categories" USING "btree" ("post_id");



CREATE INDEX "idx_blog_post_localizations_post" ON "public"."blog_post_localizations" USING "btree" ("post_id");



CREATE INDEX "idx_blog_post_revisions_post" ON "public"."blog_post_revisions" USING "btree" ("post_id", "created_at" DESC);



CREATE INDEX "idx_blog_post_schedule_events_run_at" ON "public"."blog_post_schedule_events" USING "btree" ("run_at");



CREATE INDEX "idx_blog_post_tags_post" ON "public"."blog_post_tags" USING "btree" ("post_id");



CREATE INDEX "idx_blog_post_tags_tag" ON "public"."blog_post_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_blog_posts_published_at" ON "public"."blog_posts" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "idx_blog_posts_status_published" ON "public"."blog_posts" USING "btree" ("status", "published_at" DESC);



CREATE INDEX "idx_blog_posts_status_published_at" ON "public"."blog_posts" USING "btree" ("status", "published_at" DESC);



CREATE INDEX "idx_catalog_ai_events_puppy" ON "public"."catalog_ai_events" USING "btree" ("puppy_id");



CREATE INDEX "idx_catalog_ai_events_type_created" ON "public"."catalog_ai_events" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "idx_contracts_code" ON "public"."contracts" USING "btree" ("code");



CREATE INDEX "idx_contracts_created_at" ON "public"."contracts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contracts_signed_at" ON "public"."contracts" USING "btree" ("signed_at");



CREATE INDEX "idx_contracts_status" ON "public"."contracts" USING "btree" ("status");



CREATE INDEX "idx_customers_cpf" ON "public"."customers" USING "btree" ("cpf");



CREATE INDEX "idx_customers_created_at" ON "public"."customers" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_telefone" ON "public"."customers" USING "btree" ("telefone");



CREATE INDEX "idx_events_created_at" ON "public"."events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_events_event_type" ON "public"."events" USING "btree" ("event_type");



CREATE INDEX "idx_experiments_key" ON "public"."experiments" USING "btree" ("key");



CREATE INDEX "idx_experiments_status" ON "public"."experiments" USING "btree" ("status");



CREATE INDEX "idx_integrations_user_provider" ON "public"."integrations" USING "btree" ("user_id", "provider");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_post_media_media" ON "public"."post_media" USING "btree" ("media_id");



CREATE INDEX "idx_post_media_post" ON "public"."post_media" USING "btree" ("post_id");



CREATE INDEX "idx_puppies_codigo" ON "public"."puppies" USING "btree" ("codigo");



CREATE INDEX "idx_puppies_created_at" ON "public"."puppies" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_puppies_status" ON "public"."puppies" USING "btree" ("status");



CREATE INDEX "idx_puppy_reviews_approved" ON "public"."puppy_reviews" USING "btree" ("approved");



CREATE INDEX "idx_puppy_reviews_created_at" ON "public"."puppy_reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_puppy_reviews_puppy_id" ON "public"."puppy_reviews" USING "btree" ("puppy_id");



CREATE INDEX "idx_seo_overrides_entity" ON "public"."seo_overrides" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_seo_rules_scope" ON "public"."seo_rules" USING "btree" ("scope", "active");



CREATE INDEX "idx_seo_suggestions_entity" ON "public"."seo_suggestions" USING "btree" ("entity_type", "entity_id", "status", "created_at" DESC);



CREATE INDEX "idx_site_settings_updated_at" ON "public"."site_settings" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_tracking_settings_user" ON "public"."tracking_settings" USING "btree" ("user_id");



CREATE INDEX "leads_phone_created_idx" ON "public"."leads" USING "btree" ("phone", "created_at" DESC);



CREATE INDEX "media_assets_tags_idx" ON "public"."media_assets" USING "gin" ("tags");



CREATE INDEX "post_media_role_idx" ON "public"."post_media" USING "btree" ("role");



CREATE UNIQUE INDEX "tracking_settings_env_idx" ON "public"."tracking_settings" USING "btree" ("environment");



CREATE OR REPLACE TRIGGER "blog_posts_seo_score_trg" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."trg_blog_posts_seo_score"();



CREATE OR REPLACE TRIGGER "set_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "t_ai_generation_sessions_touch" BEFORE UPDATE ON "public"."ai_generation_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."ai_generation_sessions_touch"();



CREATE OR REPLACE TRIGGER "t_blog_authors_slug_before" BEFORE INSERT OR UPDATE ON "public"."blog_authors" FOR EACH ROW EXECUTE FUNCTION "public"."blog_authors_slug_before"();



CREATE OR REPLACE TRIGGER "t_blog_categories_touch" BEFORE UPDATE ON "public"."blog_categories" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_blog_post_localizations_touch" BEFORE UPDATE ON "public"."blog_post_localizations" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_blog_posts_set_published_at" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."blog_posts_set_published_at"();



CREATE OR REPLACE TRIGGER "t_blog_posts_set_reading_time" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."blog_posts_set_reading_time"();



CREATE OR REPLACE TRIGGER "t_blog_posts_touch" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."blog_posts_touch"();



CREATE OR REPLACE TRIGGER "t_contracts_updated_at" BEFORE UPDATE ON "public"."contracts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_experiments_touch" BEFORE UPDATE ON "public"."experiments" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_integrations_touch" BEFORE UPDATE ON "public"."integrations" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_puppies_status_dates" BEFORE UPDATE ON "public"."puppies" FOR EACH ROW EXECUTE FUNCTION "public"."puppies_status_dates"();



CREATE OR REPLACE TRIGGER "t_puppies_updated_at" BEFORE UPDATE ON "public"."puppies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "t_puppy_reviews_touch" BEFORE UPDATE ON "public"."puppy_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."touch_puppy_reviews_updated_at"();



CREATE OR REPLACE TRIGGER "t_seo_rules_touch" BEFORE UPDATE ON "public"."seo_rules" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_site_settings_touch" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."site_settings_touch"();



CREATE OR REPLACE TRIGGER "t_tracking_settings_touch" BEFORE UPDATE ON "public"."tracking_settings" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_webhook_outbox_touch" BEFORE UPDATE ON "public"."webhook_outbox" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_admin_config_updated_at" BEFORE UPDATE ON "public"."admin_config" FOR EACH ROW EXECUTE FUNCTION "public"."set_admin_config_updated_at"();



CREATE OR REPLACE TRIGGER "trg_autosales_sequences_updated_at" BEFORE UPDATE ON "public"."autosales_sequences" FOR EACH ROW EXECUTE FUNCTION "public"."set_autosales_sequences_updated_at"();



CREATE OR REPLACE TRIGGER "trg_catalog_ranking_updated_at" BEFORE UPDATE ON "public"."catalog_ranking" FOR EACH ROW EXECUTE FUNCTION "public"."set_catalog_ranking_updated_at"();



CREATE OR REPLACE TRIGGER "trg_demand_predictions_updated_at" BEFORE UPDATE ON "public"."demand_predictions" FOR EACH ROW EXECUTE FUNCTION "public"."set_demand_predictions_updated_at"();



CREATE OR REPLACE TRIGGER "trg_lead_ai_insights_updated_at" BEFORE UPDATE ON "public"."lead_ai_insights" FOR EACH ROW EXECUTE FUNCTION "public"."set_lead_ai_insights_updated_at"();



CREATE OR REPLACE TRIGGER "trg_seo_history_updated_at" BEFORE UPDATE ON "public"."seo_history" FOR EACH ROW EXECUTE FUNCTION "public"."set_seo_history_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tracking_settings_updated_at" BEFORE UPDATE ON "public"."tracking_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_tracking_settings_updated_at"();



ALTER TABLE ONLY "public"."ai_generation_sessions"
 ADD CONSTRAINT "ai_generation_sessions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_tasks"
 ADD CONSTRAINT "ai_tasks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."autosales_logs"
 ADD CONSTRAINT "autosales_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autosales_logs"
 ADD CONSTRAINT "autosales_logs_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."autosales_logs"
 ADD CONSTRAINT "autosales_logs_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "public"."autosales_sequences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autosales_sequences"
 ADD CONSTRAINT "autosales_sequences_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autosales_sequences"
 ADD CONSTRAINT "autosales_sequences_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_comments"
 ADD CONSTRAINT "blog_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_comments"
 ADD CONSTRAINT "blog_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_categories"
 ADD CONSTRAINT "blog_post_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_categories"
 ADD CONSTRAINT "blog_post_categories_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_embeddings"
 ADD CONSTRAINT "blog_post_embeddings_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_localizations"
 ADD CONSTRAINT "blog_post_localizations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_revisions"
 ADD CONSTRAINT "blog_post_revisions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_schedule_events"
 ADD CONSTRAINT "blog_post_schedule_events_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_tags"
 ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_tags"
 ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_versions"
 ADD CONSTRAINT "blog_post_versions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_posts"
 ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."blog_authors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."catalog_ranking"
 ADD CONSTRAINT "catalog_ranking_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
 ADD CONSTRAINT "contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contracts"
 ADD CONSTRAINT "contracts_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
 ADD CONSTRAINT "events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_ai_insights"
 ADD CONSTRAINT "lead_ai_insights_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_ai_insights"
 ADD CONSTRAINT "lead_ai_insights_matched_puppy_id_fkey" FOREIGN KEY ("matched_puppy_id") REFERENCES "public"."puppies"("id");



ALTER TABLE ONLY "public"."post_media"
 ADD CONSTRAINT "post_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_media"
 ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."puppies"
 ADD CONSTRAINT "puppies_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."puppy_media"
 ADD CONSTRAINT "puppy_media_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."puppy_reviews"
 ADD CONSTRAINT "puppy_reviews_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracking_audit_log"
 ADD CONSTRAINT "tracking_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Permitir atualização apenas pelo serviço" ON "public"."blog_post_embeddings" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Permitir deleção apenas pelo serviço" ON "public"."blog_post_embeddings" FOR DELETE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Permitir escrita apenas pelo serviço" ON "public"."blog_post_embeddings" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Permitir leitura pública de embeddings" ON "public"."blog_post_embeddings" FOR SELECT USING (true);



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow_public_read_site_settings" ON "public"."site_settings" FOR SELECT TO "anon" USING (("id" = 1));



ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analytics_events_insert_service_role" ON "public"."analytics_events" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."blog_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_comments_public_read" ON "public"."blog_comments" FOR SELECT USING (("approved" = true));



ALTER TABLE "public"."blog_post_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_posts_public_read" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"text"));



ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."integrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "integrations_delete_own" ON "public"."integrations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "integrations_insert_own" ON "public"."integrations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "integrations_select_own" ON "public"."integrations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "integrations_update_own" ON "public"."integrations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_insert_public" ON "public"."leads" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "leads_select_authenticated" ON "public"."leads" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "public_read_puppies" ON "public"."puppies" FOR SELECT TO "authenticated", "anon" USING (("status" = ANY (ARRAY['disponivel'::"public"."puppy_status", 'reservado'::"public"."puppy_status"])));



CREATE POLICY "public_read_site_settings" ON "public"."site_settings" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."puppies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "puppies_public_read" ON "public"."puppies" FOR SELECT USING (true);



CREATE POLICY "puppies_public_select" ON "public"."puppies" FOR SELECT USING (("status" = ANY (ARRAY['disponivel'::"public"."puppy_status", 'reservado'::"public"."puppy_status"])));



ALTER TABLE "public"."puppy_media" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "puppy_media_public" ON "public"."puppy_media" FOR SELECT USING ((EXISTS ( SELECT 1
 FROM "public"."puppies" "p"
 WHERE (("p"."id" = "puppy_media"."puppy_id") AND ("p"."status" = ANY (ARRAY['disponivel'::"public"."puppy_status", 'reservado'::"public"."puppy_status"]))))));



ALTER TABLE "public"."puppy_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "puppy_reviews_admin_all" ON "public"."puppy_reviews" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "puppy_reviews_select_approved" ON "public"."puppy_reviews" FOR SELECT USING (("approved" = true));



ALTER TABLE "public"."seo_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "seo_overrides_public_read" ON "public"."seo_overrides" FOR SELECT USING ((("entity_type" = 'post'::"text") AND (EXISTS ( SELECT 1
 FROM "public"."blog_posts" "p"
 WHERE (("p"."id" = "seo_overrides"."entity_id") AND ("p"."status" = 'published'::"text"))))));



CREATE POLICY "service_role_full_access" ON "public"."admin_users" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_settings_read" ON "public"."site_settings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "site_settings_select_auth" ON "public"."site_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "site_settings_update_auth" ON "public"."site_settings" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."tracking_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tracking_settings_delete_own" ON "public"."tracking_settings" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "tracking_settings_insert_own" ON "public"."tracking_settings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "tracking_settings_select_own" ON "public"."tracking_settings" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "tracking_settings_update_own" ON "public"."tracking_settings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ai_generation_sessions_touch"() TO "anon";
GRANT ALL ON FUNCTION "public"."ai_generation_sessions_touch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ai_generation_sessions_touch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_authors_slug_before"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_authors_slug_before"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_authors_slug_before"() TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_posts_set_published_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_posts_set_published_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_posts_set_published_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_posts_set_reading_time"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_posts_set_reading_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_posts_set_reading_time"() TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_posts_touch"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_posts_touch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_posts_touch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."campaign_breakdown_v1"("tz" "text", "days" integer, "source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."campaign_breakdown_v1"("tz" "text", "days" integer, "source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."campaign_breakdown_v1"("tz" "text", "days" integer, "source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."distinct_sources"("tz" "text", "days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."distinct_sources"("tz" "text", "days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."distinct_sources"("tz" "text", "days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."gen_short_code"("n" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."gen_short_code"("n" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gen_short_code"("n" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."kpi_counts_v2"("tz" "text", "days" integer, "source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."kpi_counts_v2"("tz" "text", "days" integer, "source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."kpi_counts_v2"("tz" "text", "days" integer, "source" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."leads_daily_tz_v2"("tz" "text", "days" integer, "source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."leads_daily_tz_v2"("tz" "text", "days" integer, "source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."leads_daily_tz_v2"("tz" "text", "days" integer, "source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."puppies_status_dates"() TO "anon";
GRANT ALL ON FUNCTION "public"."puppies_status_dates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."puppies_status_dates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_admin_config_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_admin_config_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_admin_config_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_autosales_sequences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_autosales_sequences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_autosales_sequences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_catalog_ranking_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_catalog_ranking_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_catalog_ranking_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_demand_predictions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_demand_predictions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_demand_predictions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_lead_ai_insights_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_lead_ai_insights_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_lead_ai_insights_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_seo_history_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_seo_history_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_seo_history_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_tracking_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_tracking_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tracking_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."site_settings_touch"() TO "anon";
GRANT ALL ON FUNCTION "public"."site_settings_touch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."site_settings_touch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."source_breakdown_v1"("tz" "text", "days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."source_breakdown_v1"("tz" "text", "days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."source_breakdown_v1"("tz" "text", "days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_puppy_reviews_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_puppy_reviews_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_puppy_reviews_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_blog_posts_seo_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_blog_posts_seo_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_blog_posts_seo_score"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_config" TO "anon";
GRANT ALL ON TABLE "public"."admin_config" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_config" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."ai_generation_sessions" TO "anon";
GRANT ALL ON TABLE "public"."ai_generation_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_generation_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_tasks" TO "anon";
GRANT ALL ON TABLE "public"."ai_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."autosales_logs" TO "anon";
GRANT ALL ON TABLE "public"."autosales_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."autosales_logs" TO "service_role";



GRANT ALL ON TABLE "public"."autosales_sequences" TO "anon";
GRANT ALL ON TABLE "public"."autosales_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."autosales_sequences" TO "service_role";



GRANT ALL ON TABLE "public"."blog_authors" TO "anon";
GRANT ALL ON TABLE "public"."blog_authors" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_authors" TO "service_role";



GRANT ALL ON TABLE "public"."blog_categories" TO "anon";
GRANT ALL ON TABLE "public"."blog_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_categories" TO "service_role";



GRANT ALL ON TABLE "public"."blog_comments" TO "anon";
GRANT ALL ON TABLE "public"."blog_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_comments" TO "service_role";



GRANT ALL ON TABLE "public"."blog_coverage_history" TO "anon";
GRANT ALL ON TABLE "public"."blog_coverage_history" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_coverage_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."blog_coverage_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."blog_coverage_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."blog_coverage_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_categories" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_categories" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_localizations" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_localizations" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_localizations" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_revisions" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_revisions" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_schedule_events" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_schedule_events" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_schedule_events" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_tags" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_tags" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_versions" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_versions" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."blog_tags" TO "anon";
GRANT ALL ON TABLE "public"."blog_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_tags" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_ai_events" TO "anon";
GRANT ALL ON TABLE "public"."catalog_ai_events" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_ai_events" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_ai_metrics" TO "anon";
GRANT ALL ON TABLE "public"."catalog_ai_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_ai_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_ranking" TO "anon";
GRANT ALL ON TABLE "public"."catalog_ranking" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_ranking" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."demand_predictions" TO "anon";
GRANT ALL ON TABLE "public"."demand_predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."demand_predictions" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."experiments" TO "anon";
GRANT ALL ON TABLE "public"."experiments" TO "authenticated";
GRANT ALL ON TABLE "public"."experiments" TO "service_role";



GRANT ALL ON TABLE "public"."integrations" TO "anon";
GRANT ALL ON TABLE "public"."integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."integrations" TO "service_role";



GRANT ALL ON TABLE "public"."lead_ai_insights" TO "anon";
GRANT ALL ON TABLE "public"."lead_ai_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_ai_insights" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";



GRANT ALL ON TABLE "public"."media_assets" TO "anon";
GRANT ALL ON TABLE "public"."media_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."media_assets" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."post_media" TO "anon";
GRANT ALL ON TABLE "public"."post_media" TO "authenticated";
GRANT ALL ON TABLE "public"."post_media" TO "service_role";



GRANT ALL ON TABLE "public"."puppies" TO "anon";
GRANT ALL ON TABLE "public"."puppies" TO "authenticated";
GRANT ALL ON TABLE "public"."puppies" TO "service_role";



GRANT ALL ON TABLE "public"."puppy_media" TO "anon";
GRANT ALL ON TABLE "public"."puppy_media" TO "authenticated";
GRANT ALL ON TABLE "public"."puppy_media" TO "service_role";



GRANT ALL ON SEQUENCE "public"."puppy_media_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."puppy_media_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."puppy_media_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."puppy_reviews" TO "anon";
GRANT ALL ON TABLE "public"."puppy_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."puppy_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."redirects" TO "anon";
GRANT ALL ON TABLE "public"."redirects" TO "authenticated";
GRANT ALL ON TABLE "public"."redirects" TO "service_role";



GRANT ALL ON TABLE "public"."seo_history" TO "anon";
GRANT ALL ON TABLE "public"."seo_history" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_history" TO "service_role";



GRANT ALL ON TABLE "public"."seo_overrides" TO "anon";
GRANT ALL ON TABLE "public"."seo_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."seo_rules" TO "anon";
GRANT ALL ON TABLE "public"."seo_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_rules" TO "service_role";



GRANT ALL ON TABLE "public"."seo_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."seo_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."tracking_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_settings" TO "anon";
GRANT ALL ON TABLE "public"."tracking_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_settings" TO "service_role";



GRANT ALL ON TABLE "public"."v_contracts_status" TO "anon";
GRANT ALL ON TABLE "public"."v_contracts_status" TO "authenticated";
GRANT ALL ON TABLE "public"."v_contracts_status" TO "service_role";



GRANT ALL ON TABLE "public"."v_dashboard_overview" TO "anon";
GRANT ALL ON TABLE "public"."v_dashboard_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."v_dashboard_overview" TO "service_role";



GRANT ALL ON TABLE "public"."v_lead_sources_7d" TO "anon";
GRANT ALL ON TABLE "public"."v_lead_sources_7d" TO "authenticated";
GRANT ALL ON TABLE "public"."v_lead_sources_7d" TO "service_role";



GRANT ALL ON TABLE "public"."v_leads_by_day_30d" TO "anon";
GRANT ALL ON TABLE "public"."v_leads_by_day_30d" TO "authenticated";
GRANT ALL ON TABLE "public"."v_leads_by_day_30d" TO "service_role";



GRANT ALL ON TABLE "public"."v_leads_funnel" TO "anon";
GRANT ALL ON TABLE "public"."v_leads_funnel" TO "authenticated";
GRANT ALL ON TABLE "public"."v_leads_funnel" TO "service_role";



GRANT ALL ON TABLE "public"."v_puppies_status" TO "anon";
GRANT ALL ON TABLE "public"."v_puppies_status" TO "authenticated";
GRANT ALL ON TABLE "public"."v_puppies_status" TO "service_role";



GRANT ALL ON TABLE "public"."v_sla_avg_7d" TO "anon";
GRANT ALL ON TABLE "public"."v_sla_avg_7d" TO "authenticated";
GRANT ALL ON TABLE "public"."v_sla_avg_7d" TO "service_role";



GRANT ALL ON TABLE "public"."v_top_sources_30d" TO "anon";
GRANT ALL ON TABLE "public"."v_top_sources_30d" TO "authenticated";
GRANT ALL ON TABLE "public"."v_top_sources_30d" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_outbox" TO "anon";
GRANT ALL ON TABLE "public"."webhook_outbox" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_outbox" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






