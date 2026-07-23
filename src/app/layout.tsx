import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Footer from '@/components/Footer'

const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const CookieBanner = dynamic(() => import('@/components/CookieBanner'), { ssr: false })
const Toaster = dynamic(() => import('react-hot-toast').then((mod) => ({ default: mod.Toaster })), { ssr: false })

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MailForge - AI-Powered B2B Email Generator',
  description: 'Generate professional B2B emails in seconds. AI-powered email generator for cold outreach, follow-ups, and campaigns. Free to start.',
  keywords: ['b2b email generator', 'ai email writing tool', 'cold outreach email', 'business email generator', 'ai email assistant', 'email marketing automation', 'b2b sales email', 'email writing'],
  metadataBase: new URL('https://getmailforge.top'),
  openGraph: {
    title: 'MailForge - AI-Powered B2B Email Generator',
    description: 'Generate professional B2B emails in seconds. AI-powered email generator for cold outreach, follow-ups, and campaigns.',
    url: 'https://getmailforge.top',
    siteName: 'MailForge',
    images: [
      {
        url: 'https://getmailforge.top/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MailForge - AI Email Generator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MailForge - AI-Powered B2B Email Generator',
    description: 'Generate professional B2B emails in seconds. AI-powered email generator.',
    creator: '@MailForgeAI',
    images: ['https://getmailforge.top/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#0a0a0f] text-white`}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <CookieBanner />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid #2a2a3e',
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/plausible@4.0.0/dist/plausible.global.js';
                script.defer = true;
                script.dataset.domain = 'getmailforge.top';
                document.head.appendChild(script);
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}