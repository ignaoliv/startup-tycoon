import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Startup Tycoon";
const description = "Fundá una startup hecha 100% con IA: contratá agentes, shippeá features, levantá rondas y llegá a unicornio antes que tus amigos.";

export const metadata: Metadata = {
  metadataBase: new URL("https://vibecodingame.com"),
  title: { default: title, template: "%s · Startup Tycoon" },
  description,
  applicationName: title,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title },
  openGraph: {
    type: "website",
    siteName: title,
    title,
    description,
    url: "/",
    locale: "es_AR",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#fbf7ef",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
