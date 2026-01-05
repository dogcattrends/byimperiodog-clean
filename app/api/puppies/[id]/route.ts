import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Variáveis de ambiente Supabase não definidas (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).' }, { status: 500 });
  }

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/puppies?id=eq.${encodeURIComponent(id)}&select=*`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json',
      },
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: text || 'Erro ao consultar Supabase' }, { status: res.status });
    }

    const data = JSON.parse(text);
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Filhote não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
