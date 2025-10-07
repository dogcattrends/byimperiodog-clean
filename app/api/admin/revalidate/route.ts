import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * POST /api/admin/revalidate
 * Body: { path?: string; slug?: string }
 * Header: x-admin-token = ADMIN_TOKEN (ou DEBUG_TOKEN)
 * Se slug fornecido, revalida /blog/[slug] e /blog; se path fornecido revalida path literal.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  const adminToken = process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN;
  if(!adminToken || token !== adminToken){
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let parsed: unknown;
  try { parsed = await req.json(); } catch { parsed = {}; }
  const { path, slug } = (parsed as { path?: string; slug?: string }) || {};
  try {
    if(slug){
      revalidatePath('/blog');
      revalidatePath(`/blog/${slug}`);
      return NextResponse.json({ ok:true, revalidated:['/blog', `/blog/${slug}`] });
    }
    if(path){
      revalidatePath(path);
      return NextResponse.json({ ok:true, revalidated:[path] });
    }
    return NextResponse.json({ error: 'missing-path-or-slug' }, { status:400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unexpected-error';
    return NextResponse.json({ error: msg }, { status:500 });
  }
}
