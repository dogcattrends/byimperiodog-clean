import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npmnuihgydadihktglrd.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente. Defina a chave no ambiente para executar este script.')
}

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY ausente. Defina a chave no ambiente para executar este script.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

async function generateEmbeddings() {
  try {
    // 1. Buscar posts que ainda não têm embeddings
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, content_mdx, excerpt')
      .eq('status', 'published')
      .limit(5) // Limitar para teste
    
    if (postsError) {
      console.error('Erro ao buscar posts:', postsError)
      return
    }

    console.log(`Encontrados ${posts.length} posts para processar`)

    // 2. Para cada post, gerar embedding e salvar
    for (const post of posts) {
      try {
        // Preparar o texto para embedding (título + conteúdo)
        const text = `Título: ${post.title}\n\nResumo: ${post.excerpt}\n\nConteúdo: ${post.content_mdx}`
        
        // Gerar embedding via OpenAI
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
          encoding_format: "float"
        })

        // Salvar embedding no banco
        const { error: saveError } = await supabase
          .from('blog_post_embeddings')
          .upsert({
            post_id: post.id,
            source: 'openai',
            embedding: JSON.stringify(response.data[0].embedding),
            updated_at: new Date().toISOString()
          })

        if (saveError) {
          console.error(`Erro ao salvar embedding para post ${post.id}:`, saveError)
        } else {
          console.log(`✅ Embedding gerado e salvo para post ${post.id}`)
        }

      } catch (err) {
        console.error(`Erro ao processar post ${post.id}:`, err)
      }
    }

  } catch (err) {
    console.error('Erro geral:', err)
  }
}

generateEmbeddings()