import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SothForge — Espacio de trabajo',
  description: 'Organiza equipos, proyectos y tareas en un solo espacio de trabajo.',
  icons: {
    icon: '/SothForgeIcon.webp',
    shortcut: '/SothForgeIcon.webp',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
