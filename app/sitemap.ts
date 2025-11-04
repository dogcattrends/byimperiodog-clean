import type { MetadataRoute } from "next";

const PUBLIC_ROUTES = [
  "/",
  "/filhotes",
  "/reserve-seu-filhote",
  "/sobre",
  "/blog",
  "/contato",
  "/faq-do-tutor",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/politica-editorial",
].filter((path) => !path.startsWith("/admin"));

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br";

  return PUBLIC_ROUTES.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

