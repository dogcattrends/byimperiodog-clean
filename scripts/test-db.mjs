import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
 throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente. Defina a chave no ambiente para executar este script.')
}

async function testConnection() {
 const supabase = createClient(supabaseUrl, supabaseServiceKey)

 try {
 console.log('Testando conexão com o Supabase...')
 
 // Teste 1: Verificar conexão básica
 const { data: settings, error: settingsError } = await supabase
 .from('site_settings')
 .select('*')
 .limit(1)
 
 if (settingsError) {
 console.error('Erro ao acessar site_settings:', settingsError)
 } else {
 console.log('site_settings OK:', settings)
 }

 // Teste 2: Verificar tabelas operacionais do blog
 const { data: revisions, error: revisionsError } = await supabase
 .from('blog_post_revisions')
 .select('id')
 .limit(1)
 
 if (revisionsError) {
 console.error('Erro ao acessar blog_post_revisions:', revisionsError)
 } else {
 console.log('blog_post_revisions OK:', revisions)
 }

 const { data: embeddings, error: embeddingsError } = await supabase
 .from('blog_post_embeddings')
 .select('source,post_slug')
 .limit(1)

 if (embeddingsError) {
 console.error('Erro ao acessar blog_post_embeddings:', embeddingsError)
 } else {
 console.log('blog_post_embeddings OK:', embeddings)
 }

 // Teste 3: Verificar status da conexão
 const { error: healthError } = await supabase.rpc('get_status')
 if (healthError) {
 console.error('Erro ao verificar status:', healthError)
 } else {
 console.log('Conexão saudável')
 }

 } catch (err) {
 console.error('Erro geral:', err)
 }
}

testConnection()