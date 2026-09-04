import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin"] },
      // buscadores con IA: los dejamos entrar para aparecer en sus respuestas
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Claude-Web", "Google-Extended", "Applebot-Extended"], allow: "/" },
    ],
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
