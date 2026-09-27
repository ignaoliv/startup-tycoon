import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/seo";
import { fetchProyectos } from "@/lib/perfil";

/** Se regenera cada hora para que los perfiles nuevos entren solos. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hoy = new Date();
  const fijas: MetadataRoute.Sitemap = [
    { url: SITIO, lastModified: hoy, changeFrequency: "weekly", priority: 1 },
    { url: `${SITIO}/comunidad`, lastModified: hoy, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITIO}/como-se-juega`, lastModified: hoy, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITIO}/vibecoins`, lastModified: hoy, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITIO}/home`, lastModified: hoy, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITIO}/play`, lastModified: hoy, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITIO}/privacidad`, lastModified: hoy, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITIO}/terminos`, lastModified: hoy, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Cada perfil con proyecto es una página real que alguien va a compartir.
  // Si la base no responde, el sitemap sale igual con las fijas.
  try {
    const proyectos = await fetchProyectos(500);
    // La consulta devuelve una fila por PROYECTO, y una persona puede tener
    // varios: sin agrupar, su /u/handle saldría repetido tantas veces como
    // proyectos tenga. Se queda la fecha del más nuevo.
    const porHandle = new Map<string, Date>();
    for (const p of proyectos) {
      const fecha = new Date(p.created_at);
      const previa = porHandle.get(p.handle);
      if (!previa || fecha > previa) porHandle.set(p.handle, fecha);
    }
    return [
      ...fijas,
      ...[...porHandle].map(([handle, lastModified]) => ({
        url: `${SITIO}/u/${handle}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return fijas;
  }
}
