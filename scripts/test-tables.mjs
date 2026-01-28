import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
 throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente. Defina a chave no ambiente para executar este script.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testTables() {
 const tables = [
 'analytics_events',
 'blog_categories',
 'blog_comments',
 'blog_post_embeddings',
 'media'
 ]

 for (const table of tables) {
 try {
 const { data, error } = await supabase
 .from(table)
 .select('count')
 .limit(1)

 if (error) {
 console.error(`Erro na tabela ${table}:`, error)
 } else {
 console.log(`✅ Tabela ${table} OK`)
 }
 } catch (err) {
 console.error(`Erro ao testar tabela ${table}:`, err)
 }
 }
}

testTables()