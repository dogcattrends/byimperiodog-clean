import 'dotenv/config'
import { createClient } from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.SANITY_API_VERSION ?? process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2023-08-01'
const token = process.env.SANITY_TOKEN

if (!projectId || !dataset) {
 throw new Error('SANITY_PROJECT_ID/SANITY_DATASET ausentes. Defina as variáveis para executar este script.')
}

const sanity = createClient({ projectId, dataset, apiVersion, token, useCdn: !token, perspective: token ? 'raw' : 'published' })

async function checkPosts() {
 const posts = await sanity.fetch(`*[_type=="post"]{_id,status, "slug": slug.current, title}`)

 console.log('Posts no Sanity:', Array.isArray(posts) ? posts.length : 0)
 if (Array.isArray(posts) && posts.length > 0) {
 const statusCount = posts.reduce((acc, post) => {
 const st = post.status || 'unknown'
 acc[st] = (acc[st] || 0) + 1
 return acc
 }, {})
 console.table(statusCount)

 console.log('\nExemplo de post:')
 console.log(JSON.stringify(posts[0], null, 2))
 }
}

checkPosts()