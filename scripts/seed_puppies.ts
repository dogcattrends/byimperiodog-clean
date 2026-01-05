/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import fs from 'fs'
import path from 'path'

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }

  const client = createClient(supabaseUrl, serviceKey)

  const file = path.resolve(process.cwd(), 'scripts', 'seed_puppies.json')
  if (!fs.existsSync(file)) {
    console.error('seed_puppies.json not found at', file)
    process.exit(1)
  }

  const raw = fs.readFileSync(file, 'utf8')
  const records = JSON.parse(raw)

  console.info(`Seeding ${records.length} puppies to table 'puppies' (upsert on id)`)

  const { data, error } = await client.from('puppies').upsert(records, { onConflict: 'id' }).select('*')

  if (error) {
    console.error('Supabase upsert error:', error)
    process.exit(1)
  }

  console.info('Upsert successful. Returned rows:', Array.isArray(data) ? data.length : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
