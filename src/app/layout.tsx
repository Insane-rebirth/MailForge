import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MailForge - AI-Powered B2B Email Generator',
  description: 'Generate personalized B2B sales emails that actually get replies. 10x faster, 5x more replies.',
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