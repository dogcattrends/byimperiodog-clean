import { blogCanonical, blogJsonLdOrg } from '@/lib/seo.blog';
import SeoJsonLd from '@/components/SeoJsonLd';

export default function Head(){
  const canonical = blogCanonical('/blog');
  const org = blogJsonLdOrg();
  return (
    <>
      <link rel="canonical" href={canonical} />
      <SeoJsonLd data={org} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
  <meta property="og:title" content="Blog | By Imperio Dog" />
      <meta property="og:description" content="Conteúdo especializado sobre Spitz Alemão, saúde e bem-estar." />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}