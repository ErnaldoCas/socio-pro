import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Socio Pro',
  description: 'Tu socio digital de negocios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={geist.className}>
        {children}
        <NavBar />
      </body>
    </html>
  )
}