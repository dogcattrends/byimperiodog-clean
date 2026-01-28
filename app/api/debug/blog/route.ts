import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { sanityClient } from '@/lib/sanity/client';

// GET /api/debug/blog (requer header x-debug-token = process.env.DEBUG_TOKEN)
export async function GET(req: NextRequest){
 const token = req.headers.get('x-debug-token');
 if(!process.env.DEBUG_TOKEN || token !== process.env.DEBUG_TOKEN){
 return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
 }

 const statuses = ['draft', 'review', 'scheduled', 'published', 'archived'] as const;
 const pairs = await Promise.all(
 statuses.map(async (status) => {
 const count = await sanityClient.fetch<number>(
 status === 'published'
 ? `count(*[_type == "post" && (!defined(status) || status == "published")])`
 : `count(*[_type == "post" && status == $status])`,
 status === 'published' ? {} : { status }
 );
 return [status, Number(count || 0)] as const;
 })
 );

 const counts: Record<string, number> = Object.fromEntries(pairs);
 return NextResponse.json({ counts });
}