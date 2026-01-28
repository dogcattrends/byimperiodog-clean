import crypto from 'node:crypto'

import dotenv from 'dotenv'

import {createClient} from '@sanity/client'

// Load local env files (do not print secrets).
dotenv.config({path: '.env.local'})
dotenv.config()

type PortableTextBlock = {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3'
  children: Array<{_type: 'span'; _key: string; text: string; marks: string[]}>
  markDefs: unknown[]
}

type ImageValue = {
  _type: 'image'
  asset: {_type: 'reference'; _ref: string}
}

const env = {
  projectId: process.env.SANITY_PROJECT_ID || 'mgw96j4i',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2023-08-01',
  token: process.env.SANITY_TOKEN,
}

function requireEnv(name: keyof typeof env): string {
  const value = env[name]
  if (!value) {
    throw new Error(
      `Missing ${String(name)}. Set it in your environment (e.g., .env.local). Required for write operations.`,
    )
  }
  return value
}

const client = createClient({
  projectId: env.projectId,
  dataset: env.dataset,
  apiVersion: env.apiVersion,
  token: requireEnv('token'),
  useCdn: false,
})

function key() {
  return crypto.randomBytes(8).toString('hex')
}

function block(style: PortableTextBlock['style'], text: string): PortableTextBlock {
  return {
    _type: 'block',
    _key: key(),
    style,
    markDefs: [],
    children: [{_type: 'span', _key: key(), text, marks: []}],
  }
}

function paragraph(text: string) {
  return block('normal', text)
}

function h2(text: string) {
  return block('h2', text)
}

function bulletList(items: string[]) {
  // Simple bullet list as multiple paragraphs with prefix.
  // This avoids relying on listItem schema variations.
  return items.map((item) => paragraph(`• ${item}`))
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function makeCoverSvg(opts: {title: string; subtitle: string}) {
  const title = escapeXml(opts.title)
  const subtitle = escapeXml(opts.subtitle)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#052e2b"/>
      <stop offset="55%" stop-color="#0a5c4f"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <circle cx="1300" cy="200" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="320" cy="640" r="280" fill="#ffffff" opacity="0.05"/>
  <rect x="120" y="140" width="1360" height="620" rx="42" fill="url(#glow)" stroke="#ffffff" stroke-opacity="0.14"/>

  <text x="200" y="290" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="54" font-weight="800" fill="#ffffff">
    ${title}
  </text>
  <text x="200" y="360" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="28" font-weight="600" fill="#eafff7" opacity="0.92">
    ${subtitle}
  </text>

  <text x="200" y="700" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="18" font-weight="600" fill="#eafff7" opacity="0.85" letter-spacing="0.24em">
    BY IMPÉRIO DOG • GUIA DO TUTOR
  </text>
</svg>`
}

async function uploadCoverSvg(opts: {title: string; subtitle: string}) {
  const svg = makeCoverSvg(opts)
  const filename = `cover-${slugify(opts.title)}.svg`

  const asset = await client.assets.upload('image', Buffer.from(svg, 'utf8'), {
    filename,
    contentType: 'image/svg+xml',
  })

  return asset._id
}

async function createPost(params: {
  title: string
  subtitle: string
  authorId: string
  body: PortableTextBlock[]
  publishedAt: string
}) {
  const coverAssetId = await uploadCoverSvg({title: params.title, subtitle: params.subtitle})

  const doc = {
    _id: `drafts.${crypto.randomUUID()}`,
    _type: 'post',
    title: params.title,
    slug: {current: slugify(params.title)},
    author: {_type: 'reference', _ref: params.authorId},
    publishedAt: params.publishedAt,
    mainImage: {_type: 'image', asset: {_type: 'reference', _ref: coverAssetId}} satisfies ImageValue,
    body: params.body,
  }

  const created = await client.create(doc)
  return created._id as string
}

async function resolveAuthorId() {
  const explicit = process.env.SANITY_AUTHOR_ID
  if (explicit) return explicit

  const fallbackName = process.env.SANITY_AUTHOR_NAME || 'By Império Dog Team'
  const id = await client.fetch<string | null>(
    '*[_type == "author" && name == $name][0]._id',
    {name: fallbackName},
  )
  if (!id) {
    throw new Error(
      `Could not resolve author. Set SANITY_AUTHOR_ID or create an author with name="${fallbackName}" in Sanity.`,
    )
  }
  return id
}

async function main() {
  const authorId = await resolveAuthorId()

  const now = new Date()
  const yyyy = now.getFullYear()
  const publishedAt = new Date(Date.UTC(yyyy, now.getMonth(), now.getDate(), 12, 0, 0)).toISOString()

  const posts: Array<{title: string; subtitle: string; body: PortableTextBlock[]}> = [
    {
      title: `Preço do Spitz Alemão Anão (Lulu da Pomerânia) em ${yyyy}: guia de investimento e fatores`,
      subtitle: 'Faixas de valor, documentação e próximos passos (sem enrolação).',
      body: [
        paragraph(
          `Se você está pesquisando quanto custa um Spitz Alemão Anão (Lulu da Pomerânia), a resposta honesta é: varia. E varia por motivos bem específicos — linhagem, planejamento, socialização, documentação e suporte.`,
        ),
        h2('O que realmente influencia o preço (e por quê)'),
          ...bulletList([
          'Linhagem/pedigree: previsibilidade de características e histórico.',
          'Rotina e socialização: tempo de dedicação e qualidade do manejo.',
          'Disponibilidade e demanda: perfil e cores variam conforme ninhadas.',
          'Suporte ao tutor: orientação na adaptação e prevenção.',
          ]),
        h2('Como comparar opções sem cair em ciladas'),
          ...bulletList([
          'Peça informações atuais (fotos/vídeos recentes) e alinhe expectativa de perfil.',
          'Confirme documentação e contrato (claro e objetivo).',
          'Pergunte sobre rotina do filhote, alimentação e socialização.',
          ]),
        h2('Próximo passo recomendado'),
        paragraph(
          'Use o catálogo para ver disponibilidade real e depois peça a faixa atual no WhatsApp informando cidade/UF, prazo e faixa de investimento. Isso acelera o atendimento e evita desencontro de informações.',
        ),
      ],
    },
    {
      title: `Como comprar Spitz Alemão Anão com segurança em ${yyyy}: checklist e processo`,
      subtitle: 'O passo a passo para escolher bem e evitar dor de cabeça.',
      body: [
        paragraph(
          'Comprar um filhote é uma decisão emocional, mas o processo precisa ser objetivo. Este guia organiza o passo a passo para você comprar Spitz Alemão Anão (Lulu da Pomerânia) com segurança.',
        ),
        h2('Passo a passo (simples e prático)'),
        ...bulletList([
          'Defina o perfil: rotina da casa, pets/crianças, tempo de adaptação.',
          'Veja disponibilidade: escolha com base em informações atuais.',
          'Alinhe documentos e contrato: clareza antes de qualquer reserva.',
          'Combine entrega e primeiros cuidados: adaptação, alimentação e rotina.',
        ]),
        h2('Checklist antes de reservar'),
        ...bulletList([
          'Contrato + orientações iniciais.',
          'Histórico de saúde e cuidados preventivos.',
          'Suporte pós-entrega para adaptação.',
          'Alinhamento de prazo/logística.',
        ]),
        h2('O que mandar no WhatsApp para acelerar'),
        ...bulletList([
          'Cidade/UF e prazo (para quando você quer o filhote).',
          'Preferência de perfil (cor/sexo) e rotina da família.',
          'Faixa de investimento estimada.',
        ]),
      ],
    },
    {
      title: `Criador de Spitz confiável: checklist de transparência e sinais de alerta (${yyyy})`,
      subtitle: 'Critérios objetivos para decidir com segurança.',
      body: [
        paragraph(
          'A busca por “criador de Spitz confiável” geralmente acontece depois de ver anúncios e preços muito diferentes. Este guia foca em critérios objetivos para você comparar opções e decidir com segurança.',
        ),
        h2('Checklist de transparência'),
        ...bulletList([
          'Responde perguntas sobre rotina e adaptação (não só “fechar agora”).',
          'Mostra informações atuais e mantém consistência no atendimento.',
          'Explica contrato, documentação e próximos passos com clareza.',
          'Oferece suporte pós-entrega e orientação ao tutor.',
        ]),
        h2('Sinais de alerta'),
        ...bulletList([
          'Pressa excessiva sem checar sua rotina/pets/crianças.',
          'Evita falar de contrato/documentação ou muda detalhes com frequência.',
          'Não tem processo claro de entrega e acompanhamento.',
        ]),
        h2('Como decidir rápido (sem ansiedade)'),
        paragraph(
          'Uma decisão boa é a que fecha a lacuna de informação: perfil, prazo, logística, documentação e suporte. Quando esses pontos estão claros, a escolha fica simples.',
        ),
      ],
    },
  ]

  const createdIds: string[] = []
  for (const p of posts) {
    // eslint-disable-next-line no-console
    console.log(`Creating post: ${p.title}`)
    const id = await createPost({
      title: p.title,
      subtitle: p.subtitle,
      authorId,
      body: p.body,
      publishedAt,
    })
    createdIds.push(id)
    // eslint-disable-next-line no-console
    console.log(`Created: ${id}`)
  }

  // eslint-disable-next-line no-console
  console.log('\nDone. Posts created as DRAFTs (drafts.*). Publish them in Studio when ready.')
  // eslint-disable-next-line no-console
  console.log(`Project: ${env.projectId} / Dataset: ${env.dataset}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
