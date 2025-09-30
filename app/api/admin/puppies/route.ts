import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const dateLike = z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/);
const puppySchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(2).max(120).optional(),
  name: z.string().min(2).max(120).optional(),
  gender: z.enum(['male','female']).optional(),
  sexo: z.enum(['male','female']).optional(),
  color: z.string().min(2).max(60).optional(),
  cor: z.string().min(2).max(60).optional(),
  status: z.enum(['disponivel','reservado','vendido']).optional(),
  price_cents: z.number().int().min(0).max(5_000_000).nullable().optional(),
  preco: z.union([z.string(), z.number()]).optional(),
  image_url: z.string().url().max(600).nullable().optional(),
  imageUrl: z.string().url().max(600).nullable().optional(),
  descricao: z.string().max(2000).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  midia: z.array(z.string().url().max(600)).max(24).nullable().optional(),
  media: z.array(z.string().url().max(600)).max(24).nullable().optional(),
  // Aceita 'YYYY-MM-DD' ou ISO completo
  birthDate: dateLike.nullable().optional(),
  nascimento: dateLike.nullable().optional(),
  delivery: z.string().max(240).nullable().optional(),
  codigo: z.string().max(32).optional(),
  notes: z.string().max(4000).nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  reserved_at: z.string().datetime().nullable().optional(),
  sold_at: z.string().datetime().nullable().optional(),
});

// Normaliza valores de gênero vindos do banco para API (male/female)
function normalizeGender(val: string | null | undefined): 'male' | 'female' | null {
  if(!val) return null;
  const v = val.toLowerCase();
  if(v === 'male' || v === 'macho') return 'male';
  if(v === 'female' || v === 'femea' || v === 'fêmea') return 'female';
  return null;
}

// Converte valores male/female (ou já macho/femea) para formato esperado pelo enum do banco (macho/femea)
function toDbSexo(val: string | null | undefined): string | null {
  if(!val) return null;
  const v = val.toLowerCase();
  if(v === 'male' || v === 'macho') return 'macho';
  if(v === 'female' || v === 'femea' || v === 'fêmea') return 'femea';
  return null;
}

function extractMedia(raw: any, image_url?: string|null){
  let urls: string[] = [];
  const val = raw;
  if(Array.isArray(val)){
    if(val.length && typeof val[0] === 'object' && val[0]?.url){
      urls = val.map(v=> v?.url).filter(Boolean);
    } else if(val.every(v=> typeof v === 'string')){
      urls = val as string[];
    }
  } else if(typeof val === 'string') {
    try { const parsed = JSON.parse(val); return extractMedia(parsed, image_url); } catch {}
  }
  if(image_url && !urls.includes(image_url)) urls = [image_url, ...urls];
  // garante capa primeiro (já é image_url se veio)
  return Array.from(new Set(urls));
}

function serializeMedia(urls?: string[]|null){
  if(!urls?.length) return null;
  return urls.map(u=> ({ url:u, type:'image' }));
}

export async function GET(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const sb = supabaseAdmin();
  const detailed = 'id,codigo,nome,name,sexo,gender,status,cor,color,created_at,updated_at,price_cents,preco,descricao,description,midia,media,nascimento,birthDate,reserved_at,sold_at,notes,customer_id';
  let { data, error } = await sb.from('puppies').select(detailed).order('created_at', { ascending:false }).limit(1000);
  if(error){
    const msg = (error.message||'').toLowerCase();
    if(error.message==='supabase_offline_stub' || msg.includes('enotfound') || msg.includes('fetch failed') || msg.includes('getaddrinfo')){
      return NextResponse.json({ items: [], offline:true }, { status: 202 });
    }
    // tentativa fallback reduzida
    const fb = await sb.from('puppies').select('id,nome,name,gender,status,color,cor,created_at,price_cents,descricao,midia').limit(5000);
    if(fb.error){
      const m2 = (fb.error.message||'').toLowerCase();
      if(fb.error.message==='supabase_offline_stub' || m2.includes('enotfound') || m2.includes('fetch failed') || m2.includes('getaddrinfo')){
        return NextResponse.json({ items: [], offline:true }, { status: 202 });
      }
      return NextResponse.json({ error: 'list_failed', details: fb.error.message }, { status: 500 });
    }
    data = fb.data as any;
  }
  const items = (data||[]).map((row:any)=> {
    const midiaUrls = extractMedia(row.midia ?? row.media, undefined);
    const normGender = normalizeGender(row.gender ?? row.sexo);
    return {
      id: row.id,
      codigo: row.codigo || null,
      nome: row.nome ?? null,
      name: row.name ?? row.nome ?? null,
      gender: normGender,
      sexo: normGender, // devolve padronizado também
      status: row.status ?? null,
      color: row.color ?? row.cor ?? null,
      cor: row.cor ?? row.color ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
  price_cents: row.price_cents ?? (typeof row.preco==='number'? Math.round(row.preco*100): (row.preco? Math.round(parseFloat(row.preco)*100): null)),
      image_url: midiaUrls[0]||null,
      descricao: row.descricao ?? row.description ?? null,
      midia: midiaUrls,
      nascimento: row.nascimento ?? row.birthDate ?? null,
      reserved_at: row.reserved_at ?? null,
      sold_at: row.sold_at ?? null,
  notes: row.notes ?? null,
  customer_id: row.customer_id ?? null,
    };
  });
  return NextResponse.json({ items });
}

function normalizeDateInput(v: any): string | null {
  if(!v) return null;
  if(typeof v !== 'string') return null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v + 'T00:00:00.000Z';
  // Se já for ISO válido
  const t = Date.parse(v);
  if(!isNaN(t)) return new Date(t).toISOString();
  return null;
}

export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const body = await req.json();
  const parsed = puppySchema.partial().safeParse(body);
  if(!parsed.success){
    return NextResponse.json({ error:'validation', issues: parsed.error.issues },{ status:422 });
  }
  const sb = supabaseAdmin();
  const now = new Date().toISOString();
  const mediaUrls: string[]|null = Array.isArray(body.midia)? body.midia : (Array.isArray(body.media)? body.media : null);
  const codigo = body.codigo || Math.random().toString(16).slice(2,8).toUpperCase();
  // Construir lista de mídias consolidando image_url (capa) se fornecida
  let mediaUrlsFinal = mediaUrls || [];
  if(body.image_url && (!mediaUrlsFinal || mediaUrlsFinal.length===0)) mediaUrlsFinal = [body.image_url];
  const nascimentoNorm = normalizeDateInput(body.nascimento ?? body.birthDate ?? null);
  const payload:any = {
    codigo,
    nome: body.nome ?? body.name ?? null,
    name: body.name ?? body.nome ?? null,
  sexo: toDbSexo(body.sexo ?? body.gender ?? null),
  gender: normalizeGender(body.gender ?? body.sexo ?? null),
    cor: body.cor ?? body.color ?? null,
    color: body.color ?? body.cor ?? null,
    status: body.status ?? 'disponivel',
    price_cents: body.price_cents ?? null,
    preco: body.price_cents!=null? (body.price_cents/100).toFixed(2): (body.preco ?? null),
    descricao: body.descricao ?? body.description ?? null,
    notes: body.notes ?? body.descricao ?? body.description ?? null,
    midia: serializeMedia(mediaUrlsFinal),
  nascimento: nascimentoNorm,
    reserved_at: body.reserved_at ?? null,
    sold_at: body.sold_at ?? null,
    customer_id: body.customer_id ?? null,
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await sb.from('puppies').insert(payload).select('id');
  if(error){
    const msg = (error.message||'').toLowerCase();
    if(error.message==='supabase_offline_stub' || msg.includes('enotfound') || msg.includes('fetch failed') || msg.includes('getaddrinfo')) return NextResponse.json({ skipped:true, offline:true }, { status:202 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok:true, id: data?.[0]?.id });
}

export async function PUT(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const body = await req.json();
  const parsed = puppySchema.partial().safeParse(body);
  if(!parsed.success){
    return NextResponse.json({ error:'validation', issues: parsed.error.issues },{ status:422 });
  }
  const sb = supabaseAdmin();
  const id = body.id;
  if(!id) return NextResponse.json({ error:'id obrigatório' },{ status:400 });
  const patch:any = { updated_at: new Date().toISOString() };
  const mediaUrls: string[]|null = Array.isArray(body.midia)? body.midia : (Array.isArray(body.media)? body.media : null);
  let mediaUrlsFinal = mediaUrls || [];
  if(body.image_url && (!mediaUrlsFinal || mediaUrlsFinal.length===0)) mediaUrlsFinal = [body.image_url, ...(mediaUrlsFinal.filter((u:string)=> u!==body.image_url))];
  const nascimentoNorm = normalizeDateInput(body.nascimento ?? body.birthDate);
  const mapping: Record<string, any> = {
    codigo: body.codigo,
    nome: body.nome ?? body.name,
    name: body.name ?? body.nome,
  sexo: toDbSexo(body.sexo ?? body.gender),
  gender: normalizeGender(body.gender ?? body.sexo),
    cor: body.cor ?? body.color,
    color: body.color ?? body.cor,
    status: body.status,
    price_cents: body.price_cents,
    preco: body.price_cents!=null? (body.price_cents/100).toFixed(2): body.preco,
    descricao: body.descricao ?? body.description,
    notes: body.notes ?? body.descricao ?? body.description,
  nascimento: nascimentoNorm,
    reserved_at: body.reserved_at,
    sold_at: body.sold_at,
    customer_id: body.customer_id,
    midia: mediaUrlsFinal? serializeMedia(mediaUrlsFinal): undefined,
  };
  Object.entries(mapping).forEach(([k,v])=> { if(v!==undefined) patch[k]=v; });
  const { error } = await sb.from('puppies').update(patch).eq('id', id);
  if(error){
    const msg = (error.message||'').toLowerCase();
    if(error.message==='supabase_offline_stub' || msg.includes('enotfound') || msg.includes('fetch failed') || msg.includes('getaddrinfo')) return NextResponse.json({ skipped:true, offline:true }, { status:202 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok:true });
}

export async function DELETE(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if(!id) return NextResponse.json({ error:'id obrigatório' },{ status:400 });
  const sb = supabaseAdmin();
  const { error } = await sb.from('puppies').delete().eq('id', id);
  if(error){
    const msg = (error.message||'').toLowerCase();
    if(error.message==='supabase_offline_stub' || msg.includes('enotfound') || msg.includes('fetch failed') || msg.includes('getaddrinfo')) return NextResponse.json({ skipped:true, offline:true }, { status:202 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok:true });
}
