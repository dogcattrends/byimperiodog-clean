import { supabasePublic } from "@/lib/supabasePublic";

export const revalidate = 60; // revalidate feed each minute

export async function GET() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/,"");
  const selfUrl = `${site}/blog/rss.xml`;
  const sb = supabasePublic();
  const { data } = await sb
    .from("blog_posts")
  .select("id,slug,title,excerpt,content_mdx,published_at,updated_at,cover_url,cover_alt, blog_authors(name,slug), blog_post_categories(category_id,blog_categories(name,slug))")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);
  const items = data || [];
  const updated = items[0]?.updated_at || new Date().toISOString();

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Blog | By Império Dog</title>
    <link>${site}/blog</link>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml" />
    <description>Novidades e conteúdos sobre Spitz Alemão Anão</description>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <image>
      <url>${site}/byimperiologo.png</url>
      <title>By Império Dog</title>
      <link>${site}</link>
    </image>
    ${items
      .map((p: any) => {
        const url = `${site}/blog/${p.slug}`;
        const cats = (p.blog_post_categories||[]).map((c:any)=> c.blog_categories?.name).filter(Boolean) as string[];
        const author = p.blog_authors?.name || 'By Imperio Dog';
        const cover = p.cover_url ? `<enclosure url="${p.cover_url}" length="0" type="image/jpeg" />` : '';
  // Prévia segura: usa excerpt; se quiser enriquecer, converter MDX->HTML em pipeline offline
  const html = (p.excerpt || '').slice(0, 4000);
        return `<item>\n  <title>${escapeXml(p.title || "Post")}</title>\n  <link>${url}</link>\n  <guid isPermaLink="true">${url}</guid>\n  <pubDate>${new Date(p.published_at || updated).toUTCString()}</pubDate>\n  <author>${escapeXml(author)} &lt;no-reply@byimperiodog.com.br&gt;</author>\n  ${cats.map(c=>`<category>${escapeXml(c)}</category>`).join('')}\n  ${cover}\n  <description>${escapeXml(p.excerpt || "")}</description>\n  <content:encoded><![CDATA[${html}]]></content:encoded>\n</item>`;
      })
      .join("\n")}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

function escapeXml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

