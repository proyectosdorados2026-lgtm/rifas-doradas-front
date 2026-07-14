import type { Metadata } from "next";
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
  title: "Sistema de Rifas | Panel",
  description: "Gestión de rifas, ventas y sorteos",
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
