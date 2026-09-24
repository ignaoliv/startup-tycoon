import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // permite abrir el dev server desde el celu en la misma red
  allowedDevOrigins: ["192.168.1.70", "192.168.1.*", "*.local"],

  async redirects() {
    return [
      // La página se llamó /proyectos hasta el 24/09/2026. El link ya salió en
      // un mail, está en el sitemap y puede estar indexado, así que el redirect
      // es permanente y se queda: es lo que le dice al buscador que la página
      // se mudó en vez de que desapareció.
      { source: "/proyectos", destination: "/comunidad", permanent: true },
    ];
  },
};

export default nextConfig;
