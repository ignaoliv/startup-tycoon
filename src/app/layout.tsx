import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const title = "Vibe Coding Game";
const description = "Fundá una startup hecha 100% con IA y sumate a la comunidad de vibecoders: contratá agentes, shippeá features, llegá a unicornio y compartí el producto que estás vibecodeando de verdad.";

export const metadata: Metadata = {
  metadataBase: new URL("https://vibecodingame.com"),
  title: { default: title, template: "%s · Vibe Coding Game" },
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
  keywords: ["vibecoding", "vibecoders", "comunidad de vibecoding", "juego de startups", "startup con IA", "agentes de IA"],
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
      <body className="min-h-dvh antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
