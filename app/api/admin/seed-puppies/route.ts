import fs from 'fs'
import path from 'path'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
 const secret = request.headers.get('x-admin-seed-secret')
 const expected = process.env.ADMIN_SEED_SECRET
 if (!expected || secret !== expected) {
 return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
 }

 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
 if (!supabaseUrl || !serviceKey) {
 return NextResponse.json({ ok: false, error: 'missing supabase envs' }, { status: 500 })
 }

 const file = path.resolve(process.cwd(), 'scripts', 'seed_puppies.json')
 if (!fs.existsSync(file)) {
 return NextResponse.json({ ok: false, error: 'seed file not found' }, { status: 400 })
 }

 const raw = fs.readFileSync(file, 'utf8')
 let records: any[]
 try {
 records = JSON.parse(raw)
 } catch (err) {
 return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
 }

 const client = createClient(supabaseUrl, serviceKey)

 const { data, error } = await client.from('puppies').upsert(records, { onConflict: 'id' }).select('id')
 if (error) {
 return NextResponse.json({ ok: false, error }, { status: 500 })
 }

 return NextResponse.json({ ok: true, inserted: Array.isArray(data) ? data.length : 0 })
}
