import type { MetadataRoute } from "next";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  return [
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/single-player/quiz`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/multiplayer`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/documents`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/random-quiz`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/history`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/bookmarks`,
      lastModified: new Date().toISOString(),
    },
    {
      url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/settings`,
      lastModified: new Date().toISOString(),
    },
  ];
};

export default sitemap;
