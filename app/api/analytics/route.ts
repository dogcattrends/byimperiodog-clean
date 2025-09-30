import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Endpoint leve de coleta de métricas. Objetivos:
// - Nunca derrubar UX se a tabela ainda não existe ou se a key não está configurada.
// - Permitir desligar via env (DISABLE_ANALYTICS=1).
// - Validar input mínimo.
// - Devolver 202 em casos onde decidimos ignorar (sem persistência) para evitar spam de erros 500 no log.
export async function POST(req: NextRequest) {
  // Short‑circuit se desativado por configuração
  if (process.env.DISABLE_ANALYTICS === '1') {
    return NextResponse.json({ disabled: true }, { status: 202 });
  }
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { name, value, id, label, meta, path, ts } = body || {};
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }

  const ua = req.headers.get('user-agent') || null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || (req as any).ip || null;

  // Monta payload (campos opcionais normalizados)
  const payload: Record<string, any> = {
    name,
    value: typeof value === 'number' ? value : null,
    metric_id: id ?? null,
    label: label ?? null,
    meta: meta ?? null,
    path: path ?? null,
    ua,
    ip,
    ts: ts ? new Date(ts).toISOString() : new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  // Tentativa de persistência; se ambiente não configurado ou tabela ausente, devolve 202 silencioso.
  try {
    let sb;
    try {
      sb = supabaseAdmin();
    } catch (e: any) {
      // Falha de configuração (ex: falta SERVICE_ROLE) -> não é erro fatal para o usuário final
      return NextResponse.json({ skipped: 'supabase_admin_unavailable' }, { status: 202 });
    }

    let insertError: any = null;
    try {
      const { error } = await sb.from('analytics_events').insert(payload);
      insertError = error;
    } catch (err:any){
      insertError = err;
    }
    if (insertError) {
      const error: any = insertError;
      const msg = (error?.message||'').toLowerCase();
      // Log estruturado para debug
      console.error('[analytics.insert.error]', {
        message: error?.message,
        code: (error as any)?.code,
        stack: error?.stack?.split('\n').slice(0,4).join(' | '),
        originalPayload: { name: payload.name, path: payload.path }
      });
      if (msg.includes('fetch failed') || msg.includes('enotfound') || msg.includes('getaddrinfo')) {
        return NextResponse.json({ skipped:'network_unreachable' }, { status:202 });
      }
      if (error?.message === 'supabase_offline_stub') {
        return NextResponse.json({ skipped: 'offline_stub' }, { status: 202 });
      }
      const code = (error as any).code;
      if (code === '42P01' || code === '42501') {
        return NextResponse.json({ skipped: 'table_missing_or_rls', code }, { status: 202 });
      }
      // Em desenvolvimento, não gerar 500 ruidoso — converte em 202 para não poluir console
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ skipped: 'dev_other_error', code, message: error?.message }, { status: 202 });
      }
      return NextResponse.json({ error: error.message || 'insert_failed', code, offline: msg.includes('getaddrinfo')? true: undefined }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Erro inesperado
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

