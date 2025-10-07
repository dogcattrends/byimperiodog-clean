import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET /api/admin/blog/:id/versions?limit=20
export async function GET(req: NextRequest, ctx: { params:{ id:string } }){
  const auth = requireAdmin(req); if(auth) return auth;
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')||20),1),100);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('blog_post_versions')
    .select('id, created_at, reason')
    .eq('post_id', ctx.params.id)
    .order('created_at', { ascending:false })
    .limit(limit);
  if(error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ versions: data||[] });
}
