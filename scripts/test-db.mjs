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

    // Teste 2: Verificar tabela de blog posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1)
    
    if (postsError) {
      console.error('Erro ao acessar blog_posts:', postsError)
    } else {
      console.log('blog_posts OK:', posts)
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