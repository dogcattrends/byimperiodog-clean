/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      // buckets públicos do Supabase: <project>.supabase.co
      { protocol: "https", hostname: "*.supabase.co" },
  { protocol: "https", hostname: "dummyimage.com" },
    ],
  },
};
export default nextConfig;
