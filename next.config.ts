import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // permite abrir el dev server desde el celu en la misma red
  allowedDevOrigins: ["192.168.1.70", "192.168.1.*", "*.local"],
};

export default nextConfig;
