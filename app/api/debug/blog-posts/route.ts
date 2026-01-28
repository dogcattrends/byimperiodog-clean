import { NextResponse } from 'next/server';

import { sanityBlogRepo } from '@/lib/sanity/blogRepo';

export const dynamic = 'force-dynamic';

export async function GET() {
 try {
 const hasToken = Boolean(process.env.SANITY_TOKEN);
 const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
 
 const result = await sanityBlogRepo.listSummaries({
 limit: 10,
 offset: 0,
 });

 return NextResponse.json({
 success: true,
 hasSanityToken: hasToken,
 hasProjectId: Boolean(projectId),
 itemsCount: result.items.length,
 total: result.total,
 firstItem: result.items[0] ? {
 id: result.items[0].id,
 slug: result.items[0].slug,
 title: result.items[0].title,
 } : null,
 });
 } catch (error) {
 return NextResponse.json({
 success: false,
 error: error instanceof Error ? error.message : String(error),
 }, { status: 500 });
 }
}
