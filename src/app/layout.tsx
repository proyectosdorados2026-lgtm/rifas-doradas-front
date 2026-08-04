import type { Metadata, Viewport } from "next";
import { Syne, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import PausaGuard from "@/components/PausaGuard";
import AdminRouteShell from "@/components/admin/AdminRouteShell";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sueños Dorados | Panel",
  description: "Gestión interna de proyectos, ventas y sorteos",
  applicationName: "SD Panel",
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SD Panel",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#101010",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${syne.variable} ${plex.variable} ${plexMono.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--text-primary)]`}
      >
        <PausaGuard>
          <AdminRouteShell>{children}</AdminRouteShell>
        </PausaGuard>
      </body>
    </html>
  );
}
