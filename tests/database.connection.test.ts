import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://npmnuihgydadihktglrd.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  describe.skip('Testes de Conexão com Banco de Dados', () => {
    it('requer SUPABASE_SERVICE_ROLE_KEY para rodar', () => {
      expect(serviceRoleKey).toBeTruthy()
    })
  })
} else {

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

describe('Testes de Conexão com Banco de Dados', () => {
  it('deve conectar ao Supabase', async () => {
    const { data, error } = await supabase.from('site_settings').select('*').limit(1)
    if (error) console.error('Erro de conexão:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)

  it('deve verificar a tabela de blog posts', async () => {
    const { data, error } = await supabase.from('blog_posts').select('*').limit(1)
    if (error) console.error('Erro na tabela blog_posts:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)

  it('deve verificar a tabela de análises', async () => {
    const { data, error } = await supabase.from('analytics_events').select('*').limit(1)
    if (error) console.error('Erro na tabela analytics_events:', error)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  }, 10000)
})

}