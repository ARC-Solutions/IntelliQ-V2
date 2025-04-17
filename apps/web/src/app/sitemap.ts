import type { MetadataRoute } from "next";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  return [
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/about`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
      lastModified: new Date().toISOString(),
    },
    {
      url: "https://docs.intelliq.dev/",
      lastModified: new Date().toISOString(),
    },
  ];
};

export default sitemap;
