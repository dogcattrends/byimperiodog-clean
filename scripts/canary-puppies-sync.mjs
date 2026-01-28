import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
 console.error(
 'Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run canary.'
 )
 process.exit(2)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function poll(getter, { tries = 8, delayMs = 250 } = {}) {
 let last
 for (let i = 0; i < tries; i++) {
 last = await getter()
 if (last?.ok) return last
 await sleep(delayMs)
 }
 return last
}

async function main() {
 const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
 auth: { persistSession: false },
 })

 const id = crypto.randomUUID()
 const canaryName1 = `CANARY_SYNC_${new Date().toISOString()}_${id.slice(0, 8)}`
 const canaryName2 = `${canaryName1}_UPDATED`

 console.log('[canary] project:', new URL(SUPABASE_URL).hostname)
 console.log('[canary] legacy puppies id:', id)

 // Ensure cleanup even if a step fails
 try {
 // 1) INSERT into legacy (should trigger upsert into puppies_v2)
 {
 const { error } = await supabase.from('puppies').insert({
 id,
 name: canaryName1,
 status: 'vendido', // must be in v2 enum, and should not be publicly listed
 sexo: 'macho',
 price_cents: 123,
 cidade: 'CANARY',
 estado: 'ZZ',
 descricao: 'canary row for verifying legacy→v2 triggers (auto-cleaned)',
 midia: [],
 })

 if (error) throw new Error(`[insert legacy] ${error.message}`)
 console.log('[canary] inserted legacy row')
 }

 // 2) Verify v2 exists
 {
 const result = await poll(async () => {
 const { data, error } = await supabase
 .from('puppies_v2')
 .select('id,name,status,price,gender,updated_at')
 .eq('id', id)
 .maybeSingle()

 if (error) return { ok: false, error }
 if (!data) return { ok: false }
 return { ok: true, data }
 })

 if (!result?.ok) {
 const details = result?.error?.message ? `; ${result.error.message}` : ''
 throw new Error(`[verify v2 after insert] did not find row${details}`)
 }

 console.log('[canary] v2 row after insert:', {
 id: result.data.id,
 name: result.data.name,
 status: result.data.status,
 price: result.data.price,
 gender: result.data.gender,
 })
 }

 // 3) UPDATE legacy, verify v2 updates
 {
 const { error } = await supabase
 .from('puppies')
 .update({ name: canaryName2, price_cents: 456 })
 .eq('id', id)

 if (error) throw new Error(`[update legacy] ${error.message}`)
 console.log('[canary] updated legacy row')

 const result = await poll(async () => {
 const { data, error } = await supabase
 .from('puppies_v2')
 .select('id,name,price,updated_at')
 .eq('id', id)
 .maybeSingle()

 if (error) return { ok: false, error }
 if (!data) return { ok: false }
 const ok = data.name === canaryName2 && data.price === 456
 return { ok, data }
 })

 if (!result?.ok) {
 const got = result?.data
 ? `got name=${JSON.stringify(result.data.name)} price=${JSON.stringify(result.data.price)}`
 : 'no row'
 throw new Error(`[verify v2 after update] mismatch; ${got}`)
 }

 console.log('[canary] v2 row after update:', {
 id: result.data.id,
 name: result.data.name,
 price: result.data.price,
 })
 }

 // 4) DELETE legacy, verify v2 deletes
 {
 const { error } = await supabase.from('puppies').delete().eq('id', id)
 if (error) throw new Error(`[delete legacy] ${error.message}`)
 console.log('[canary] deleted legacy row')

 const result = await poll(
 async () => {
 const { data, error } = await supabase
 .from('puppies_v2')
 .select('id')
 .eq('id', id)
 .maybeSingle()

 if (error) return { ok: false, error }
 return { ok: !data, data }
 },
 { tries: 10, delayMs: 250 }
 )

 if (!result?.ok) {
 throw new Error('[verify v2 after delete] v2 row still exists')
 }

 console.log('[canary] v2 row removed after delete ✅')
 }

 console.log('[canary] SUCCESS ✅ legacy→v2 triggers are working end-to-end')
 } finally {
 // Best-effort cleanup in case we failed mid-way
 await supabase.from('puppies').delete().eq('id', id)
 await supabase.from('puppies_v2').delete().eq('id', id)
 }
}

main().catch((err) => {
 console.error(String(err?.stack || err))
 process.exit(1)
})
