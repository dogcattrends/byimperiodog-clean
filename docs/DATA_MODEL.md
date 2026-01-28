# Modelo de Dados

## Principios
- **Sanity e a fonte unica do conteudo editorial** (Titulo, slug, descricao, TL;DR, key takeaways, FAQ, fontes e corpo do texto) - veja `studio/schemas/post.ts`. O Supabase armazena apenas metadados, metricas e eventos; o corpo do post nao deve ser duplicado.
- **Eventos e metas ficam no Supabase**, com tabelas especificas para leads, analytics, tracking, IA e operacoes administrativas. Use o endpoint `/api/analytics` como fonte oficial de persistencia de eventos.
- **LGPD e seguranca**: campos como `consent_lgpd` e `consent_timestamp` em `leads` vem do endpoint `app/api/leads/route.ts`, controles de acesso via `supabaseAdmin()` e tokens protegidos garantem que apenas a service role escreve dados sensiveis.

## Tabelas-chave no Supabase
- **`leads`** (`sql/leads.sql`): armazena contato, preferencias (sexo, cor, prazo), contexto da pagina (`page_*`, `utm_*`, `source`, `referer`, `ip_address`, `user_agent`), consentimento e status (`novo`, `em_contato`, `fechado`, `perdido`). Indices em telefone, status e data aceleram os paineis do modulo de Analytics.
- **`analytics_events`** (`sql/analytics_events.sql` + `app/api/analytics/route.ts`): eventos genericos com `name`, `value`, `label`, `meta`, `path`, `ua`, `ip`, `ts`. A politica recomendada permite apenas insercoes vindas da service role e responde com 202 se a tabela estiver ausente.
- **`lead_download_tokens`** (`sql/lead_download_tokens.sql` + `app/api/download/guia/route.ts`): guarda tokens expiráveis atrelados aos leads que baixam o guia, registra `version` e `used_at` e valida restrições de acesso; a rota `/download/guia` atualiza `used_at`, marca `pdf_downloaded` em `analytics_events` e redireciona para o PDF correto.
- **`tracking_settings`** (`sql/tracking_settings.sql` + `app/api/tracking/settings/route.ts`): controle por ambiente (`environment`, GTM, GA4, Meta, TikTok e verificacoes de dominio) com log opcional (`tracking_audit_log`). O gatilho `trg_tracking_settings_updated_at` atualiza `updated_at` automaticamente.
- **`site_settings` + `admin_config`** (`sql/site_settings.sql`, `sql/admin_config.sql` + `app/api/admin/settings/route.ts`): armazenam IDs publicos de pixels, mensagens padronizadas, metas semanais, textos de follow-up e tokens privados (Meta CAPI, TikTok API). Contam com RLS e sao usados pelo `ConfigTabs`.
- **`admin_actions`** (`sql/admin_actions.sql` + `src/lib/adminAuth.ts`): registro de rotas administrativas via `logAdminAction`, dando visibilidade de falhas em configuracoes, webhooks e updates criticos.
- **`ai_generation_sessions`, `ai_tasks`, `blog_post_versions`, `media_assets`, `post_media`** (`sql/blog_ai_infra.sql`, `sql/ai_core.sql`): infraestrutura da IA. `ai_generation_sessions` guarda topicos, fases e progressos; `ai_tasks` documenta cada etapa (outline, draft, optimize, assets); `blog_post_versions` versiona snapshots; `media_assets` e `post_media` controlam capas/galerias geradas pela IA (veja `src/lib/aiPipeline.ts` e `scripts/ai-tasks-worker.mjs`).
- **Blog (editorial)**: **Sanity é a fonte única** para posts/autores/categorias/tags (ver `studio/schemas/post.ts`). No Supabase ficam apenas dados operacionais relacionados ao blog (ex.: `blog_comments`, `blog_post_revisions`, `blog_post_embeddings`, `blog_post_schedule_events`, `media_assets/post_media`), preferindo chaves por `post_slug`/`entity_ref`.
- **`blog_post_schedule_events` + `blog_coverage_history`** (`sql/blog_ai_infra.sql`): agendamentos adicionais de publicacao e snapshots do mapa topicos (topical map), usados por scripts e dashboards internos.

## Outros pontos relevantes
- **Eventos de tracking customizados**: `track.event()` (`src/lib/track.ts`) dispara `page_view`, `cta_click`, `generate_lead` e experimentos; o payload chega a `/api/analytics` e vira registros em `analytics_events`.
- **IA e RAG**: `scripts/ai-tasks-worker.mjs` consome `ai_tasks`; os resultados operacionais (revisões, embeddings, sugestões) ficam no Supabase, mas o conteúdo editorial final é aplicado/publicado no Sanity; `app/api/qa/route.ts` usa embeddings (com fallback lexical em `src/lib/rag.ts`) para responder perguntas.
- **Lead magnet e tokens de download**: embora em evolucao, qualquer persistencia de tokens (ex.: `lead_download_tokens`) deve ficar isolada, e o PDF em storage seguro; o corpo do PDF nao deve residir em tabelas publicas.

## Restricoes operacionais
- **Sem duplicacao editorial**: evite copiar `studio/schemas/post.ts:content` para Supabase/Storage. Todas as alteracoes publicadas passam pelo Sanity e pelos webhooks dedicados.
- **Consentimento sempre**: tracking em `src/lib/events.ts` so dispara se `analytics` ou `marketing` estiverem liberados; o endpoint `/api/analytics` responde 202 caso o servico esteja desabilitado.
- **RLS e roles**: tabelas expostas (ex.: `site_settings`, `tracking_settings`) usam Row Level Security, e operacoes criticas devem usar `SUPABASE_SERVICE_ROLE_KEY`.
