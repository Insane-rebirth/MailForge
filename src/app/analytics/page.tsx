'use client'

import { useEffect, useState } from 'react'

export default function AnalyticsPage() {
  const [status, setStatus] = useState({
    website: 'loading',
    api: 'loading',
    payment: 'loading',
  })

  useEffect(() => {
    const checkStatus = async () => {
      const results = {
        website: 'loading',
        api: 'loading',
        payment: 'loading',
      }

      try {
        const siteResponse = await fetch('https://getmailforge.top')
        results.website = siteResponse.ok ? 'online' : 'error'
      } catch {
        results.website = 'error'
      }

      try {
        const apiResponse = await fetch('https://getmailforge.top/api/check-subscription')
        results.api = apiResponse.status === 401 ? 'online' : 'error'
      } catch {
        results.api = 'error'
      }

      try {
        const paymentResponse = await fetch('https://www.creem.io/payment/prod_4dAo3HSgudsOS2yPl9l7p3', {
          method: 'HEAD',
        })
        results.payment = paymentResponse.ok || paymentResponse.status === 307 ? 'online' : 'error'
      } catch {
        results.payment = 'error'
      }

      setStatus(results)
    }

    checkStatus()
  }, [])

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'online':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-yellow-500'
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
            Online
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
            Error
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-medium text-yellow-500">
            <span className="h-1.5 w-1.5 animate-spin rounded-full border border-yellow-500"></span>
            Loading
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">MailForge Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Website Status</h3>
              {getStatusBadge(status.website)}
            </div>
            <p className="text-sm text-gray-400">https://getmailforge.top</p>
            <p className={`text-sm mt-2 ${getStatusColor(status.website)}`}>
              {status.website === 'online' ? 'Website is running normally' : 
               status.website === 'error' ? 'Website is down' : 'Checking...'}
            </p>
          </div>

          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">API Status</h3>
              {getStatusBadge(status.api)}
            </div>
            <p className="text-sm text-gray-400">API endpoints</p>
            <p className={`text-sm mt-2 ${getStatusColor(status.api)}`}>
              {status.api === 'online' ? 'All APIs are working' : 
               status.api === 'error' ? 'API connection failed' : 'Checking...'}
            </p>
          </div>

          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Payment Status</h3>
              {getStatusBadge(status.payment)}
            </div>
            <p className="text-sm text-gray-400">Creem payment gateway</p>
            <p className={`text-sm mt-2 ${getStatusColor(status.payment)}`}>
              {status.payment === 'online' ? 'Payment system is ready' : 
               status.payment === 'error' ? 'Payment gateway unreachable' : 'Checking...'}
            </p>
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e] mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Promotion Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg">
              <span className="text-gray-300">Reddit</span>
              <span className="text-green-500">✓ Published</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg">
              <span className="text-gray-300">Twitter/X</span>
              <span className="text-green-500">✓ Published</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg">
              <span className="text-gray-300">LinkedIn</span>
              <span className="text-green-500">✓ Published</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg">
              <span className="text-gray-300">Product Hunt</span>
              <span className="text-yellow-500">⏳ Pending CAPTCHA</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
          <h3 className="text-lg font-semibold text-white mb-4">Data Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0a0a0f] rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Analytics Tool</p>
              <p className="text-white font-medium">Plausible Analytics</p>
              <p className="text-xs text-gray-500 mt-1">Track visitors, page views, and conversions</p>
            </div>
            <div className="p-4 bg-[#0a0a0f] rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Dashboard URL</p>
              <p className="text-white font-medium">https://plausible.io/getmailforge.top</p>
              <p className="text-xs text-gray-500 mt-1">View detailed analytics dashboard</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-[#1a1a2e] rounded-xl border border-[#2a2a3e]">
          <h3 className="text-lg font-semibold text-white mb-4">Important Notes</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Social media posts were just published. It may take 24-72 hours to see significant engagement.</li>
            <li>• Check back in 2-3 days for meaningful traffic data.</li>
            <li>• Analytics will start tracking from the moment the new deployment is live.</li>
            <li>• For real-time platform insights, check each social media platform's native analytics.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
