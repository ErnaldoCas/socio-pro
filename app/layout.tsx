import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Socio Pro',
  description: 'Tu socio digital de negocios',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Socio Pro',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#16a34a',
}

// Script que se ejecuta ANTES del render para evitar flash de tema incorrecto
const temaScript = `
  (function() {
    try {
      var guardado = localStorage.getItem('tema');
      var prefiereDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (guardado === 'oscuro' || (!guardado && prefiereDark)) {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Anti-flash: aplica el tema antes de que React hidrate */}
        <script dangerouslySetInnerHTML={{ __html: temaScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Socio Pro" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={geist.className}>
        {children}
      </body>
    </html>
  )
}