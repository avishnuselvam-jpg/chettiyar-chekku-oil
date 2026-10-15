import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://chettiyarchekku.com";

  return [
    {
      url: baseUrl,
      lastModified: "2026-10-15T00:00:00.000Z",
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];
}