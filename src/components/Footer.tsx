import { Sparkles, Mail } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-purple-500/50 transition-shadow duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">MailForge</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              AI-powered B2B email generation that helps sales teams craft compelling messages that actually get replies.
            </p>

          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Product</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/generator"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  Email Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  Features
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/about"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href="mailto:support@mailforge.ai" className="text-white/60 hover:text-white transition-colors duration-200 text-sm">
                  support@mailforge.ai
                </a>
              </li>
            </ul>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/privacy"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-white/60 hover:text-white transition-colors duration-200 text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2024 MailForge. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
  
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
