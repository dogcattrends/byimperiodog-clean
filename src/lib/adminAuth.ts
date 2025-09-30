import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';

/** Layout guard: garante que usuário esteja autenticado via cookie 'adm' ou 'admin_auth'. */
export function requireAdminLayout() {
  const c = cookies();
  const adm = c.get('adm')?.value;
  const legacy = c.get('admin_auth')?.value;
  const ok = adm === 'true' || adm === '1' || legacy === '1';
  if (!ok) redirect('/admin/login');
}

/** Em /admin/login redireciona usuário já autenticado */
export function redirectIfAuthed() {
  const c = cookies();
  const adm = c.get('adm')?.value;
  const legacy = c.get('admin_auth')?.value;
  if (adm === 'true' || adm === '1' || legacy === '1') redirect('/admin/dashboard');
}

/** API guard legado para route handlers (recebe Request/NextRequest) */
export function requireAdminApi(req: Request | NextRequest){
  const expected = process.env.NEXT_PUBLIC_ADMIN_PASS || process.env.ADMIN_PASS;
  if(!expected) return null; // sem senha definida => não bloqueia (modo dev)
  try {
    const nreq = req as NextRequest;
    const cookieAuth = (nreq.cookies?.get?.('admin_auth')?.value) === '1' || (nreq.cookies?.get?.('adm')?.value) === 'true';
    if (cookieAuth) return null;
  } catch {}
  const pass = req.headers.get('x-admin-pass');
  if(pass === expected) return null;
  return NextResponse.json({ ok:false, error:'unauthorized' }, { status: 401 });
}

/** Alias simplificado usado por vários route handlers antigos. Mantemos para compatibilidade. */
export function requireAdmin(req: Request | NextRequest){
  return requireAdminApi(req);
}

export async function logAdminAction(params: { route:string; method:string; action?:string; payload?:any; actor?:string; ip?:string }){
  try {
    const sb = supabaseAdmin();
    await sb.from('admin_actions').insert([{ route: params.route, method: params.method, action: params.action||null, payload: params.payload||null, actor: params.actor||null, ip: params.ip||null }]);
  } catch {}
}
