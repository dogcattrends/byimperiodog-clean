export type Json =
 | string
 | number
 | boolean
 | null
 | { [key: string]: Json | undefined }
 | Json[]

export type Database = {
 graphql_public: {
 Tables: {
 [_ in never]: never
 }
 Views: {
 [_ in never]: never
 }
 Functions: {
 graphql: {
 Args: {
 extensions?: Json
 operationName?: string
 query?: string
 variables?: Json
 }
 Returns: Json
 }
 }
 Enums: {
 [_ in never]: never
 }
 CompositeTypes: {
 [_ in never]: never
 }
 }
 public: {
 Tables: {
 admin_actions: {
 Row: {
 action: string | null
 actor: string | null
 created_at: string
 duration_ms: number | null
 error_message: string | null
 id: string
 ip: string | null
 method: string
 payload: Json | null
 route: string
 status_code: number | null
 user_agent: string | null
 }
 Insert: {
 action?: string | null
 actor?: string | null
 created_at?: string
 duration_ms?: number | null
 error_message?: string | null
 id?: string
 ip?: string | null
 method: string
 payload?: Json | null
 route: string
 status_code?: number | null
 user_agent?: string | null
 }
 Update: {
 action?: string | null
 actor?: string | null
 created_at?: string
 duration_ms?: number | null
 error_message?: string | null
 id?: string
 ip?: string | null
 method?: string
 payload?: Json | null
 route?: string
 status_code?: number | null
 user_agent?: string | null
 }
 Relationships: []
 }
 admin_config: {
 Row: {
 avg_response_minutes: number | null
 brand_name: string | null
 brand_tagline: string | null
 contact_email: string | null
 contact_phone: string | null
 created_at: string | null
 followup_rules: string | null
 id: string
 instagram: string | null
 seo_description_default: string | null
 seo_meta_tags: string | null
 seo_title_default: string | null
 template_first_contact: string | null
 template_followup: string | null
 tiktok: string | null
 updated_at: string | null
 whatsapp_message: string | null
 }
 Insert: {
 avg_response_minutes?: number | null
 brand_name?: string | null
 brand_tagline?: string | null
 contact_email?: string | null
 contact_phone?: string | null
 created_at?: string | null
 followup_rules?: string | null
 id: string
 instagram?: string | null
 seo_description_default?: string | null
 seo_meta_tags?: string | null
 seo_title_default?: string | null
 template_first_contact?: string | null
 template_followup?: string | null
 tiktok?: string | null
 updated_at?: string | null
 whatsapp_message?: string | null
 }
 Update: {
 avg_response_minutes?: number | null
 brand_name?: string | null
 brand_tagline?: string | null
 contact_email?: string | null
 contact_phone?: string | null
 created_at?: string | null
 followup_rules?: string | null
 id?: string
 instagram?: string | null
 seo_description_default?: string | null
 seo_meta_tags?: string | null
 seo_title_default?: string | null
 template_first_contact?: string | null
 template_followup?: string | null
 tiktok?: string | null
 updated_at?: string | null
 whatsapp_message?: string | null
 }
 Relationships: []
 }
 admin_users: {
 Row: {
 active: boolean
 created_at: string
 email: string
 name: string | null
 role: string
 updated_at: string
 user_id: string
 }
 Insert: {
 active?: boolean
 created_at?: string
 email: string
 name?: string | null
 role?: string
 updated_at?: string
 user_id: string
 }
 Update: {
 active?: boolean
 created_at?: string
 email?: string
 name?: string | null
 role?: string
 updated_at?: string
 user_id?: string
 }
 Relationships: []
 }
 blog_authors: {
 Row: {
 avatar_url: string | null
 bio: string | null
 created_at: string
 id: string
 name: string
 socials: Json | null
 }
 Insert: {
 avatar_url?: string | null
 bio?: string | null
 created_at?: string
 id?: string
 name: string
 socials?: Json | null
 }
 Update: {
 avatar_url?: string | null
 bio?: string | null
 created_at?: string
 id?: string
 name?: string
 socials?: Json | null
 }
 Relationships: []
 }
 blog_post_tags: {
 Row: {
 post_id: string
 tag_id: string
 }
 Insert: {
 post_id: string
 tag_id: string
 }
 Update: {
 post_id?: string
 tag_id?: string
 }
 Relationships: [
 {
 foreignKeyName: "blog_post_tags_post_id_fkey"
 columns: ["post_id"]
 isOneToOne: false
 referencedRelation: "blog_posts"
 referencedColumns: ["id"]
 },
 {
 foreignKeyName: "blog_post_tags_tag_id_fkey"
 columns: ["tag_id"]
 isOneToOne: false
 referencedRelation: "blog_tags"
 referencedColumns: ["id"]
 },
 ]
 }
 blog_posts: {
 Row: {
 author_id: string | null
 content_mdx: string | null
 cover_url: string | null
 created_at: string
 excerpt: string | null
 id: string
 lang: string | null
 og_image_url: string | null
 published_at: string | null
 reading_time: number | null
 scheduled_at: string | null
 seo_description: string | null
 seo_title: string | null
 slug: string
 status: string
 subtitle: string | null
 title: string
 updated_at: string
 }
 Insert: {
 author_id?: string | null
 content_mdx?: string | null
 cover_url?: string | null
 created_at?: string
 excerpt?: string | null
 id?: string
 lang?: string | null
 og_image_url?: string | null
 published_at?: string | null
 reading_time?: number | null
 scheduled_at?: string | null
 seo_description?: string | null
 seo_title?: string | null
 slug: string
 status?: string
 subtitle?: string | null
 title: string
 updated_at?: string
 }
 Update: {
 author_id?: string | null
 content_mdx?: string | null
 cover_url?: string | null
 created_at?: string
 excerpt?: string | null
 id?: string
 lang?: string | null
 og_image_url?: string | null
 published_at?: string | null
 reading_time?: number | null
 scheduled_at?: string | null
 seo_description?: string | null
 seo_title?: string | null
 slug?: string
 status?: string
 subtitle?: string | null
 title?: string
 updated_at?: string
 }
 Relationships: [
 {
 foreignKeyName: "blog_posts_author_id_fkey"
 columns: ["author_id"]
 isOneToOne: false
 referencedRelation: "blog_authors"
 referencedColumns: ["id"]
 },
 ]
 }
 blog_tags: {
 Row: {
 id: string
 name: string
 slug: string
 }
 Insert: {
 id?: string
 name: string
 slug: string
 }
 Update: {
 id?: string
 name?: string
 slug?: string
 }
 Relationships: []
 }
 catalog_ranking: {
 Row: {
 flag: string | null
 puppy_id: string
 rank_order: number | null
 reason: string | null
 score: number
 updated_at: string | null
 }
 Insert: {
 flag?: string | null
 puppy_id: string
 rank_order?: number | null
 reason?: string | null
 score?: number
 updated_at?: string | null
 }
 Update: {
 flag?: string | null
 puppy_id?: string
 rank_order?: number | null
 reason?: string | null
 score?: number
 updated_at?: string | null
 }
 Relationships: [
 {
 foreignKeyName: "catalog_ranking_puppy_id_fkey"
 columns: ["puppy_id"]
 isOneToOne: true
 referencedRelation: "puppies"
 referencedColumns: ["id"]
 },
 ]
 }
 leads: {
 Row: {
 cidade: string | null
 cor_preferida: string | null
 created_at: string
 data_contato: string | null
 email: string | null
 estado: string | null
 id: string
 lead_ai_insights: Json | null
 nome: string | null
 notas: string | null
 origem: string | null
 prioridade: string | null
 sexo_preferido: string | null
 status: string | null
 telefone: string | null
 updated_at: string | null
 }
 Insert: {
 cidade?: string | null
 cor_preferida?: string | null
 created_at?: string
 data_contato?: string | null
 email?: string | null
 estado?: string | null
 id?: string
 lead_ai_insights?: Json | null
 nome?: string | null
 notas?: string | null
 origem?: string | null
 prioridade?: string | null
 sexo_preferido?: string | null
 status?: string | null
 telefone?: string | null
 updated_at?: string | null
 }
 Update: {
 cidade?: string | null
 cor_preferida?: string | null
 created_at?: string
 data_contato?: string | null
 email?: string | null
 estado?: string | null
 id?: string
 lead_ai_insights?: Json | null
 nome?: string | null
 notas?: string | null
 origem?: string | null
 prioridade?: string | null
 sexo_preferido?: string | null
 status?: string | null
 telefone?: string | null
 updated_at?: string | null
 }
 Relationships: []
 }
 media_assets: {
 Row: {
 alt: string | null
 caption: string | null
 created_at: string
 file_path: string
 id: string
 source: string | null
 tags: string[] | null
 }
 Insert: {
 alt?: string | null
 caption?: string | null
 created_at?: string
 file_path: string
 id?: string
 source?: string | null
 tags?: string[] | null
 }
 Update: {
 alt?: string | null
 caption?: string | null
 created_at?: string
 file_path?: string
 id?: string
 source?: string | null
 tags?: string[] | null
 }
 Relationships: []
 }
 post_media: {
 Row: {
 created_at: string
 media_id: string
 position: number
 post_id: string
 role: string
 }
 Insert: {
 created_at?: string
 media_id: string
 position?: number
 post_id: string
 role: string
 }
 Update: {
 created_at?: string
 media_id?: string
 position?: number
 post_id?: string
 role?: string
 }
 Relationships: [
 {
 foreignKeyName: "post_media_media_id_fkey"
 columns: ["media_id"]
 isOneToOne: false
 referencedRelation: "media_assets"
 referencedColumns: ["id"]
 },
 {
 foreignKeyName: "post_media_post_id_fkey"
 columns: ["post_id"]
 isOneToOne: false
 referencedRelation: "blog_posts"
 referencedColumns: ["id"]
 },
 ]
 }
 puppies: {
 Row: {
 codigo: string | null
 color: string | null
 cor: string | null
 cover_url: string | null
 created_at: string
 customer_id: string | null
 descricao: string | null
 description: string | null
 gender: string | null
 id: string
 media: string[] | null
 microchip: string | null
 midia: string | null
 name: string | null
 nascimento: string | null
 nome: string | null
 cidade: string | null
 estado: string | null
 notes: string | null
 pedigree: string | null
 preco: number | null
 price: number | null
 price_cents: number | null
 reserved_at: string | null
 sexo: string | null
 sold_at: string | null
 status: string | null
 updated_at: string
 }
 Insert: {
 codigo?: string | null
 color?: string | null
 cor?: string | null
 cover_url?: string | null
 created_at?: string
 customer_id?: string | null
 descricao?: string | null
 description?: string | null
 gender?: string | null
 id?: string
 media?: string[] | null
 microchip?: string | null
 midia?: string | null
 name?: string | null
 nascimento?: string | null
 nome?: string | null
 cidade?: string | null
 estado?: string | null
 notes?: string | null
 pedigree?: string | null
 preco?: number | null
 price?: number | null
 price_cents?: number | null
 reserved_at?: string | null
 sexo?: string | null
 sold_at?: string | null
 status?: string | null
 updated_at?: string
 }
 Update: {
 codigo?: string | null
 color?: string | null
 cor?: string | null
 cover_url?: string | null
 created_at?: string
 customer_id?: string | null
 descricao?: string | null
 description?: string | null
 gender?: string | null
 id?: string
 media?: string[] | null
 microchip?: string | null
 midia?: string | null
 name?: string | null
 nascimento?: string | null
 nome?: string | null
 cidade?: string | null
 estado?: string | null
 notes?: string | null
 pedigree?: string | null
 preco?: number | null
 price?: number | null
 price_cents?: number | null
 reserved_at?: string | null
 sexo?: string | null
 sold_at?: string | null
 status?: string | null
 updated_at?: string
 }
 Relationships: []
 }
 site_settings: {
 Row: {
 ai_fallback_api_key: string | null
 ai_fallback_base_url: string | null
 ai_fallback_model: string | null
 ai_fallback_provider: string | null
 ai_observability_webhook: string | null
 ai_primary_api_key: string | null
 ai_primary_base_url: string | null
 ai_primary_model: string | null
 ai_primary_provider: string | null
 ai_vector_index: string | null
 avg_response_minutes: number | null
 brand_name: string | null
 brand_tagline: string | null
 clarity_id: string | null
 contact_email: string | null
 contact_phone: string | null
 custom_pixels: Json | null
 fb_capi_token: string | null
 followup_rules: string | null
 ga4_id: string | null
 google_ads_id: string | null
 google_ads_label: string | null
 google_site_verification: string | null
 gtm_id: string | null
 hotjar_id: string | null
 id: number
 instagram: string | null
 meta_domain_verify: string | null
 meta_pixel_id: string | null
 pinterest_tag_id: string | null
 seo_description_default: string | null
 seo_meta_tags: string | null
 seo_title_default: string | null
 template_first_contact: string | null
 template_followup: string | null
 tiktok: string | null
 tiktok_api_token: string | null
 tiktok_pixel_id: string | null
 updated_at: string
 weekly_post_goal: number | null
 whatsapp_message: string | null
 }
 Insert: {
 ai_fallback_api_key?: string | null
 ai_fallback_base_url?: string | null
 ai_fallback_model?: string | null
 ai_fallback_provider?: string | null
 ai_observability_webhook?: string | null
 ai_primary_api_key?: string | null
 ai_primary_base_url?: string | null
 ai_primary_model?: string | null
 ai_primary_provider?: string | null
 ai_vector_index?: string | null
 avg_response_minutes?: number | null
 brand_name?: string | null
 brand_tagline?: string | null
 clarity_id?: string | null
 contact_email?: string | null
 contact_phone?: string | null
 custom_pixels?: Json | null
 fb_capi_token?: string | null
 followup_rules?: string | null
 ga4_id?: string | null
 google_ads_id?: string | null
 google_ads_label?: string | null
 google_site_verification?: string | null
 gtm_id?: string | null
 hotjar_id?: string | null
 id?: number
 instagram?: string | null
 meta_domain_verify?: string | null
 meta_pixel_id?: string | null
 pinterest_tag_id?: string | null
 seo_description_default?: string | null
 seo_meta_tags?: string | null
 seo_title_default?: string | null
 template_first_contact?: string | null
 template_followup?: string | null
 tiktok?: string | null
 tiktok_api_token?: string | null
 tiktok_pixel_id?: string | null
 updated_at?: string
 weekly_post_goal?: number | null
 whatsapp_message?: string | null
 }
 Update: {
 ai_fallback_api_key?: string | null
 ai_fallback_base_url?: string | null
 ai_fallback_model?: string | null
 ai_fallback_provider?: string | null
 ai_observability_webhook?: string | null
 ai_primary_api_key?: string | null
 ai_primary_base_url?: string | null
 ai_primary_model?: string | null
 ai_primary_provider?: string | null
 ai_vector_index?: string | null
 avg_response_minutes?: number | null
 brand_name?: string | null
 brand_tagline?: string | null
 clarity_id?: string | null
 contact_email?: string | null
 contact_phone?: string | null
 custom_pixels?: Json | null
 fb_capi_token?: string | null
 followup_rules?: string | null
 ga4_id?: string | null
 google_ads_id?: string | null
 google_ads_label?: string | null
 google_site_verification?: string | null
 gtm_id?: string | null
 hotjar_id?: string | null
 id?: number
 instagram?: string | null
 meta_domain_verify?: string | null
 meta_pixel_id?: string | null
 pinterest_tag_id?: string | null
 seo_description_default?: string | null
 seo_meta_tags?: string | null
 seo_title_default?: string | null
 template_first_contact?: string | null
 template_followup?: string | null
 tiktok?: string | null
 tiktok_api_token?: string | null
 tiktok_pixel_id?: string | null
 updated_at?: string
 weekly_post_goal?: number | null
 whatsapp_message?: string | null
 }
 Relationships: []
 }
 }
 Views: {
 [_ in never]: never
 }
 Functions: {
 [_ in never]: never
 }
 Enums: {
 [_ in never]: never
 }
 CompositeTypes: {
 [_ in never]: never
 }
 }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
 DefaultSchemaTableNameOrOptions extends
 | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
 | { schema: keyof DatabaseWithoutInternals },
 TableName extends DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
 }
 ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
 DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
 : never = never,
> = DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
}
 ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
 DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
 Row: infer R
 }
 ? R
 : never
 : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
 DefaultSchema["Views"])
 ? (DefaultSchema["Tables"] &
 DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
 Row: infer R
 }
 ? R
 : never
 : never

export type TablesInsert<
 DefaultSchemaTableNameOrOptions extends
 | keyof DefaultSchema["Tables"]
 | { schema: keyof DatabaseWithoutInternals },
 TableName extends DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
 }
 ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
 : never = never,
> = DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
}
 ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
 Insert: infer I
 }
 ? I
 : never
 : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
 ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
 Insert: infer I
 }
 ? I
 : never
 : never

export type TablesUpdate<
 DefaultSchemaTableNameOrOptions extends
 | keyof DefaultSchema["Tables"]
 | { schema: keyof DatabaseWithoutInternals },
 TableName extends DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
 }
 ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
 : never = never,
> = DefaultSchemaTableNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
}
 ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
 Update: infer U
 }
 ? U
 : never
 : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
 ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
 Update: infer U
 }
 ? U
 : never
 : never

export type Enums<
 DefaultSchemaEnumNameOrOptions extends
 | keyof DefaultSchema["Enums"]
 | { schema: keyof DatabaseWithoutInternals },
 EnumName extends DefaultSchemaEnumNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
 }
 ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
 : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
}
 ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
 : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
 ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
 : never

export type CompositeTypes<
 PublicCompositeTypeNameOrOptions extends
 | keyof DefaultSchema["CompositeTypes"]
 | { schema: keyof DatabaseWithoutInternals },
 CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
 }
 ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
 : never = never,
> = PublicCompositeTypeNameOrOptions extends {
 schema: keyof DatabaseWithoutInternals
}
 ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
 : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
 ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
 : never

export const Constants = {
 graphql_public: {
 Enums: {},
 },
 public: {
 Enums: {},
 },
} as const

// ----------------------------
// App-level canonical types
// ----------------------------

export type PuppySex = "macho" | "femea";
export type PuppyStatus = "disponivel" | "reservado" | "vendido";

// Schema esperado pela migration em sql/puppies.sql
export type PuppyRow = {
 id: string;
 slug: string;
 title: string;
 sex: PuppySex;
 color: string;
 city: string;
 state: string;
 price_cents: number;
 status: PuppyStatus;
 main_image_url: string | null;
 gallery: Json;
 badges: Json;
 description: string | null;
 is_active: boolean;
 created_at: string;
 updated_at: string;
};

