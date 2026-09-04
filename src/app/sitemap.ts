import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date();
  return [
    { url: SITIO, lastModified: hoy, changeFrequency: "weekly", priority: 1 },
    { url: `${SITIO}/como-se-juega`, lastModified: hoy, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITIO}/home`, lastModified: hoy, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITIO}/play`, lastModified: hoy, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITIO}/privacidad`, lastModified: hoy, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITIO}/terminos`, lastModified: hoy, changeFrequency: "yearly", priority: 0.2 },
  ];
}
