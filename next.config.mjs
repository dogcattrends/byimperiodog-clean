import { join } from "path";

const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: buildTimestamp,
  },
  // ============================================================================
  // PERFORMANCE: Bundle optimization & code splitting
  // ============================================================================
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  experimental: {
    typedRoutes: false,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  
  // ============================================================================
  // PERFORMANCE: Images optimization (AVIF/WebP automático)
  // ============================================================================
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 ano
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "dummyimage.com" },
    ],
  },
  
  // ============================================================================
  // PERFORMANCE: Headers (Cache-Control para assets estáticos)
  // ============================================================================
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["contentlayer/generated"] = join(process.cwd(), ".contentlayer/generated");
    return config;
  },
};

export default nextConfig;

