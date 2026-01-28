import { join } from "path";

const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
 ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
 : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
 env: {
 NEXT_PUBLIC_BUILD_TIME: buildTimestamp,
 },

 compress: true,
 poweredByHeader: false,
 productionBrowserSourceMaps: false,

 experimental: {
 typedRoutes: false,
 optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
 },

 typescript: {
 ignoreBuildErrors: true,
 },

 images: {
 formats: ["image/avif", "image/webp"],
 deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
 imageSizes: [16, 24, 32, 48, 64, 96, 128, 160, 256, 320],
 minimumCacheTTL: 31536000,
 unoptimized: true, // Disable image optimization for Netlify compatibility

 remotePatterns: [
 { protocol: "https", hostname: "images.unsplash.com" },
 { protocol: "https", hostname: "placehold.co" },
 { protocol: "https", hostname: "dummyimage.com" },
 { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
 { protocol: "https", hostname: "clinicavetspitz.com.br", pathname: "/**" },
 // Supabase Storage (blobs, images, media)
 { protocol: "https", hostname: "npmnuihgydadihktglrd.supabase.co", pathname: "/storage/v1/object/public/**" },
 { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
 ...(supabaseHostname
 ? [
 {
 protocol: "https",
 hostname: supabaseHostname,
 pathname: "/storage/v1/object/public/**",
 },
 {
 protocol: "http",
 hostname: supabaseHostname,
 pathname: "/storage/v1/object/public/**",
 },
 ]
 : []),
 // Permite dev local independente de NEXT_PUBLIC_SUPABASE_URL
 { protocol: "http", hostname: "127.0.0.1", pathname: "/storage/v1/object/public/**" },
 { protocol: "http", hostname: "localhost", pathname: "/storage/v1/object/public/**" },
 ],
 },

 async headers() {
 const headers = [
 {
 source: "/(.*)",
 headers: [
 { key: "X-Frame-Options", value: "DENY" },
 { key: "X-Content-Type-Options", value: "nosniff" },
 { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
 { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
 ],
 },
 ];

 // IMPORTANTE: em dev, nunca use cache agressivo para /_next/static.
 // Isso causa chunks desatualizados no navegador e erros tipo: "Cannot read properties of undefined (reading 'call')".
 if (process.env.NODE_ENV === "production") {
 headers.push(
 {
 source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)",
 headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
 },
 {
 source: "/_next/static/:path*",
 headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
 },
 {
 source: "/_next/image:path*",
 headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
 },
 );
 } else {
 // DEV: nunca cachear o runtime do webpack (ex.: /_next/static/chunks/webpack.js não tem hash)
 // para evitar mismatch de chunks após rebuild.
 headers.push(
 {
 source: "/_next/static/:path*",
 headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
 },
 {
 source: "/_next/image:path*",
 headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
 },
 );
 }

 return headers;
 },

 // ✅ SEM "config: any" (isso era TS e quebrava no .mjs)
 webpack: (config) => {
 config.resolve = config.resolve || {};
 config.resolve.alias = config.resolve.alias || {};
 config.resolve.alias["contentlayer/generated"] = join(process.cwd(), ".contentlayer/generated");
 return config;
 },
};

export default nextConfig;
