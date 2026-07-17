'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Cookie } from 'lucide-react'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('mailforge_cookie_consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('mailforge_cookie_consent', 'true')
    setShowBanner(false)
  }

  const handleReject = () => {
    localStorage.setItem('mailforge_cookie_consent', 'false')
    localStorage.removeItem('mailforge_subscription')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a1a2e] border-t border-[#2a2a3e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Privacy & Cookies</h3>
              <p className="text-white/60 text-sm max-w-md">
                We use cookies to improve your experience, analyze usage, and personalize content. By using MailForge, you agree to our{' '}
                <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a> and{' '}
                <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white/70 hover:text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Accept All
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-2 hover:bg-[#2a2a3e] rounded-lg text-white/50 hover:text-white transition-colors md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}