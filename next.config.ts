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

      // Link corto para compartir en redes. Va con los parámetros de medición
      // pegados acá y no en el link que se pega, así queda corto y sigue
      // separándose del tráfico que llega por mail.
      //
      // `permanent: false` a propósito: un 308 lo cachean los navegadores para
      // siempre y después no hay forma de cambiarle el destino.
      {
        source: "/c",
        destination: "/comunidad?utm_source=twitter&utm_medium=social&utm_campaign=comunidad",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
