import type { MetadataRoute } from 'next'

/** Manifest PWA — panel interno (no indexar ni promocionar públicamente). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sueños Dorados — Panel interno',
    short_name: 'SD Panel',
    description: 'Acceso restringido al equipo. Gestión de ventas y proyectos.',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#101010',
    theme_color: '#101010',
    lang: 'es',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
