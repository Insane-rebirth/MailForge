'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, CreditCard, Zap, Check, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Profile } from '@/types'
import { getSupabase } from '@/lib/supabase/client'

const planLimits: Record<string, number> = {
  free: 20,
  pro: 500,
  business: Infinity,
}

const planPrices: Record<string, string> = {
  free: '$0',
  pro: '$29',
  business: '$79',
}

const planColors: Record<string, { bg: string; text: string }> = {
  free: { bg: 'bg-gray-100', text: 'text-gray-700' },
  pro: { bg: 'bg-blue-100', text: 'text-blue-700' },
  business: { bg: 'bg-purple-100', text: 'text-purple-700' },
}

const planFeatures = [
  { name: 'Monthly emails', free: '20', pro: '500', business: 'Unlimited' },
  { name: 'Personalization level', free: 'Basic', pro: 'Advanced', business: 'Advanced' },
  { name: 'Email tones', free: 'All', pro: 'All', business: 'All' },
  { name: 'History storage', free: 'No', pro: 'Yes', business: 'Yes' },
  { name: 'Priority support', free: 'No', pro: 'Yes', business: 'Dedicated' },
  { name: 'API access', free: 'No', pro: 'No', business: 'Yes' },
]

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [nextBillingDate] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const client = getSupabase()
        const { data: { user: authUser } } = await client.auth.getUser()
        if (!authUser) {
          window.location.href = '/login'
          return
        }
        setUser(authUser)
      } catch (error) {
        console.error('Failed to check user:', error)
        window.location.href = '/login'
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProfile(user.id)
    }
  }, [user])

  const fetchProfile = async (userId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/profile?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setIsPortalLoading(true)
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success && data.data?.portalUrl) {
        window.location.href = data.data.portalUrl
      } else {
        toast.error(data.error?.message || 'Failed to open billing portal')
      }
    } catch (error) {
      toast.error('Failed to open billing portal')
    } finally {
      setIsPortalLoading(false)
    }
  }

  const getProgressPercentage = () => {
    if (!profile) return 0
    const limit = planLimits[profile.subscription_tier]
    if (limit === Infinity) return 0
    return Math.min((profile.emails_used_this_month / limit) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return 'bg-gradient-to-r from-green-400 to-green-500'
    if (percentage <= 90) return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
    return 'bg-gradient-to-r from-red-400 to-red-500'
  }

  const getFirstDayOfNextMonth = () => {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }

  const getDaysUntilReset = () => {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const tier = profile?.subscription_tier || 'free'
  const used = profile?.emails_used_this_month || 0
  const limit = planLimits[tier]
  const progressPercentage = getProgressPercentage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Subscription</h1>
          <p className="text-gray-600">View and manage your current plan</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Current Plan</h2>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${planColors[tier].bg} ${planColors[tier].text}`}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </span>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {planPrices[tier]}
                  {tier !== 'free' && <span className="text-gray-500 text-lg font-normal">/month</span>}
                </div>
                {nextBillingDate && (
                  <p className="text-gray-500 text-sm mt-1">
                    Next billing: {nextBillingDate}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {profile?.stripe_customer_id && (
                <button
                  onClick={handleManageBilling}
                  disabled={isPortalLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {isPortalLoading ? 'Loading...' : 'Manage Billing'}
                </button>
              )}
              {tier !== 'business' && (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">This Month's Usage</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm">Emails Used</p>
              <p className="text-2xl font-bold text-gray-800">
                {used} / {limit === Infinity ? 'Unlimited' : limit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Progress</p>
              <p className="text-lg font-semibold text-gray-800">
                {limit === Infinity ? '—' : `${Math.round(progressPercentage)}%`}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-gray-500 text-sm">
            Usage resets on {getFirstDayOfNextMonth()} ({getDaysUntilReset()} days)
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Plan Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Free</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Pro</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Business</th>
                </tr>
              </thead>
              <tbody>
                {planFeatures.map((feature, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-3 px-4 text-gray-700">{feature.name}</td>
                    <td className={`py-3 px-4 text-center ${tier === 'free' ? 'bg-blue-50 font-semibold' : ''}`}>
                      {feature.free === 'No' ? (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      ) : (
                        feature.free
                      )}
                    </td>
                    <td className={`py-3 px-4 text-center ${tier === 'pro' ? 'bg-blue-50 font-semibold' : ''}`}>
                      {feature.pro === 'Yes' ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        feature.pro
                      )}
                    </td>
                    <td className={`py-3 px-4 text-center ${tier === 'business' ? 'bg-blue-50 font-semibold' : ''}`}>
                      {feature.business === 'Yes' || feature.business === 'Unlimited' ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        feature.business
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
