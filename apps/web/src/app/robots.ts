import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/", "/_static/", "/_vercel/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/sitemap.xml`,
  };
};

export default robots;
