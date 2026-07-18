'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Mail, TrendingUp, Calendar, LogOut, Plus, ArrowUp, XCircle, AlertTriangle, Clock, BarChart3, Target } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  verifySubscriptionWithAPI,
  PLAN_QUOTAS,
  PLAN_NAMES
} from '@/lib/subscription'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<{
    plan: 'free' | 'pro' | 'business'
    usageCount: number
  }>({ plan: 'free', usageCount: 0 })
  const [stats, setStats] = useState<{
    replyRate: number | null
    daysActive: number | null
    nextBillingDate: string | null
    emailsUsed: number | null
    monthlyQuota: number | null
  }>({ replyRate: null, daysActive: null, nextBillingDate: null, emailsUsed: null, monthlyQuota: null })
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<Array<{
    prospectName: string
    prospectCompany: string
    createdAt: string
  }>>([])
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        window.location.href = '/login'
        return
      }
      setUser(authUser)
      setLoading(false)
    }

    checkUser()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user || null)
      if (!session?.user) {
        window.location.href = '/login'
      }
    })

    return () => authSubscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
      fetchStats()
      fetchActivity()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      const verified = await verifySubscriptionWithAPI(user.id)
      setSubscription(verified)
    } catch {
      setSubscription({ plan: 'free', usageCount: 0 })
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/user-usage')
      if (res.ok) {
        const data = await res.json()
        setStats({
          replyRate: data.reply_rate || null,
          daysActive: data.days_active || null,
          nextBillingDate: data.next_billing_date || null,
          emailsUsed: data.emails_used || null,
          monthlyQuota: data.monthly_quota || null
        })
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchActivity = async () => {
    setActivityLoading(true)
    try {
      const res = await fetch(`/api/email-history?userId=${user?.id}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        if (data.data && Array.isArray(data.data)) {
          setRecentActivity(data.data.map((item: any) => ({
            prospectName: item.input_data?.prospectInfo?.name || 'Unknown',
            prospectCompany: item.input_data?.prospectInfo?.company || 'Unknown',
            createdAt: item.created_at || ''
          })))
        }
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err)
    } finally {
      setActivityLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleCancelSubscription = () => {
    setSubscription({ plan: 'free', usageCount: 0 })
    setShowCancelModal(false)
  }

  const handleUpgrade = (targetPlan: string) => {
    router.push(`/checkout?plan=${targetPlan}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>
    )
  }

  const { plan, usageCount } = subscription
  const quota = stats.monthlyQuota ?? PLAN_QUOTAS[plan]
  const used = stats.emailsUsed ?? usageCount
  const remaining = quota === Infinity ? 'Unlimited' : quota - used
  const percentage = quota === Infinity ? 100 : Math.min((used / quota) * 100, 100)
  const planName = PLAN_NAMES[plan]
  const planPrice = plan === 'free' ? 0 : plan === 'pro' ? 29 : 79

  const formatBillingDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    } catch {
      return '—'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          <div className="relative w-full max-w-md bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-4">Confirm Cancellation</h2>
            <p className="text-white/60 text-center mb-6">
              Are you sure you want to cancel your {planName} subscription? You will be downgraded to Free plan.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Welcome Back</h1>
          <p className="text-white/60 text-lg">{user.email}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  plan === 'business'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : plan === 'pro'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {planName}
                </span>
                {planPrice > 0 && (
                  <span className="text-white/60 text-sm">${planPrice}/month</span>
                )}
              </div>
              <p className="text-white/60">
                Next billing: {statsLoading ? 'Loading...' : formatBillingDate(stats.nextBillingDate)}
              </p>
            </div>
            <div className="flex gap-3">
              {plan === 'free' && (
                <button
                  onClick={() => handleUpgrade('pro')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  <ArrowUp className="w-5 h-5" />
                  Upgrade to Pro
                </button>
              )}
              {plan === 'pro' && (
                <button
                  onClick={() => handleUpgrade('business')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  <ArrowUp className="w-5 h-5" />
                  Upgrade to Business
                </button>
              )}
              {plan !== 'free' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2a2a3e] hover:bg-red-500/20 text-white/70 hover:text-red-400 font-medium rounded-xl transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Emails Generated</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? 'Loading...' : stats.emailsUsed !== null ? stats.emailsUsed : '—'}
                </p>
              </div>
            </div>
            <p className="text-white/40 text-sm">This month</p>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Reply Rate</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? 'Loading...' : stats.replyRate !== null ? `${stats.replyRate}%` : '—'}
                </p>
              </div>
            </div>
            <p className="text-white/40 text-sm">{statsLoading ? '' : stats.replyRate !== null ? '+12% from last month' : ''}</p>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Days Active</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? 'Loading...' : stats.daysActive !== null ? stats.daysActive : '—'}
                </p>
              </div>
            </div>
            <p className="text-white/40 text-sm">{statsLoading ? '' : stats.daysActive !== null ? 'Keep it up!' : ''}</p>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Avg Score</p>
                <p className="text-2xl font-bold text-white">
                  {statsLoading ? '—' : '—'}
                </p>
              </div>
            </div>
            <p className="text-white/40 text-sm">Quality analysis coming soon</p>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Best Style</p>
                <p className="text-2xl font-bold text-white">—</p>
              </div>
            </div>
            <p className="text-white/40 text-sm">Based on reply rates</p>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Avg Time</p>
                <p className="text-2xl font-bold text-white">~10s</p>
              </div>
            </div>
            <p className="text-white/40 text-sm">Per email generation</p>
          </div>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Monthly Usage</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Used: {statsLoading ? 'Loading...' : stats.emailsUsed !== null ? stats.emailsUsed : '—'}</span>
              <span className="text-white/60">
                {quota === Infinity ? 'Remaining: Unlimited' : `Remaining: ${statsLoading ? 'Loading...' : (stats.monthlyQuota !== null ? remaining : '—')}/${quota}`}
              </span>
            </div>
            <div className="h-3 bg-[#0a0a0f] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{ width: `${statsLoading ? 0 : percentage}%` }}
              />
            </div>
          </div>
          {!statsLoading && percentage >= 90 && quota !== Infinity && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">
                You&apos;re running low on emails this month! Consider upgrading to {plan === 'free' ? 'Pro' : 'Business'} for more quota.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6">Weekly Email Activity</h3>
            <div className="space-y-4">
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm">Weekly activity data coming soon</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm">Generate emails to see activity</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6">Email Style Distribution</h3>
            <div className="space-y-4">
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm">Style distribution data coming soon</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm">Generate emails to see style distribution</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <Link
                href="/generator"
                className="block bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-xl p-4 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Generate Email</h4>
                    <p className="text-white/60 text-sm">Create personalized cold emails</p>
                  </div>
                </div>
              </Link>
              <Link
                href="/dashboard/ab-testing"
                className="block bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/50 rounded-xl p-4 hover:shadow-lg hover:shadow-orange-500/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">A/B Testing</h4>
                    <p className="text-white/60 text-sm">Test and optimize email performance</p>
                  </div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 hover:bg-red-500/20 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Sign Out</h4>
                    <p className="text-white/60 text-sm">Log out of your account</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                <Mail className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-[#0a0a0f] rounded-xl">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-white font-medium">Generated email for {activity.prospectName} at {activity.prospectCompany}</p>
                    <p className="text-white/40 text-sm">
                      {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40">暂无数据</p>
              <Link href="/generator" className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300 transition-colors">
                <Plus className="w-5 h-5" />
                Generate your first email
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
