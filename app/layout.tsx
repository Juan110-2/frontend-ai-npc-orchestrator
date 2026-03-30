import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'PsicoSim - Plataforma de Simulacion Conversacional',
  description: 'Plataforma academica de simulacion conversacional en psicologia para entrenamiento de estudiantes y docentes',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="ml-64 flex-1 transition-all duration-300">
            <div className="min-h-screen bg-background">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
