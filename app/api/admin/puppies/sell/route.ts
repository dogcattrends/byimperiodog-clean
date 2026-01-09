import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { clearAdminSupabaseCookies, isJwtExpiredError } from '@/lib/adminSession';
import { supabaseAdminOrUser } from '@/lib/supabaseAdminOrUser';

export async function POST(req: NextRequest){
  const auth = requireAdmin(req); if(auth) return auth;
  try {
    const { puppy_id, client_name, client_phone, client_email } = await req.json();
    if(!puppy_id || !client_name) return NextResponse.json({ error:'puppy_id e client_name obrigatórios' },{ status:400 });
    const { client: sb, mode } = supabaseAdminOrUser(req);
    if (!sb) {
      return NextResponse.json(
        { error: mode === 'missing_token' ? 'Sessao admin ausente. Refaça login.' : 'Cliente Supabase indisponível.' },
        { status: 401 },
      );
    }
    // update puppy status
    const { error: upErr } = await sb.from('puppies').update({ status:'vendido', updated_at: new Date().toISOString() }).eq('id', puppy_id);
    if (upErr) {
      if (isJwtExpiredError(upErr)) {
        clearAdminSupabaseCookies();
        return NextResponse.json({ ok: false, error: 'Sessão expirada. Refaça login.' }, { status: 401 });
      }
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    // insert contract (se tabela existir)
    try {
      await sb.from('contracts').insert([{ puppy_id, client_name, client_phone: client_phone||null, client_email: client_email||null, status:'pending', created_at: new Date().toISOString() }]);
    } catch (e) { /* ignore optional contracts table */ }
    return NextResponse.json({ ok:true });
  } catch(e:any){
    if (isJwtExpiredError(e)) {
      clearAdminSupabaseCookies();
      return NextResponse.json({ ok: false, error: 'Sessão expirada. Refaça login.' }, { status: 401 });
    }
    return NextResponse.json({ error: e?.message || 'erro' },{ status:500 });
  }
}

