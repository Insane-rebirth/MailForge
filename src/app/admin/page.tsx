'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  email: string | null
  full_name: string | null
  subscription_tier: 'free' | 'pro' | 'business'
  emails_used_this_month: number
  last_usage_reset: string
  created_at: string
  updated_at: string
}

interface Statistics {
  overview: {
    totalUsers: number
    totalEmails: number
    avgEmailsPerUser: number
    proUsers: number
    businessUsers: number
    freeUsers: number
  }
  daily: {
    date: string
    users: number
    emails: number
  }[]
  topUser: User
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, statsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/statistics'),
        ])

        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'business':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'Pro'
      case 'business':
        return 'Business'
      default:
        return 'Free'
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="bg-[#1a1a2e] border-b border-[#2a2a3e] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">MailForge Admin Dashboard</h1>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Go to Website
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <p className="text-sm text-gray-400 mb-2">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats?.overview.totalUsers || 0}</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <p className="text-sm text-gray-400 mb-2">Pro Users</p>
            <p className="text-3xl font-bold text-blue-400">{stats?.overview.proUsers || 0}</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <p className="text-sm text-gray-400 mb-2">Total Emails</p>
            <p className="text-3xl font-bold text-green-400">{stats?.overview.totalEmails || 0}</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <p className="text-sm text-gray-400 mb-2">Avg Emails/User</p>
            <p className="text-3xl font-bold text-yellow-400">{stats?.overview.avgEmailsPerUser || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <h3 className="text-lg font-semibold text-white mb-4">Subscription Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Free</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500"
                      style={{ width: `${((stats?.overview.freeUsers || 0) / (stats?.overview.totalUsers || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white w-12 text-right">
                    {stats?.overview.freeUsers || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Pro</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${((stats?.overview.proUsers || 0) / (stats?.overview.totalUsers || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white w-12 text-right">
                    {stats?.overview.proUsers || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Business</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${((stats?.overview.businessUsers || 0) / (stats?.overview.totalUsers || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white w-12 text-right">
                    {stats?.overview.businessUsers || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Activity (Last 7 Days)</h3>
            <div className="space-y-2">
              {stats?.daily.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-16">
                    {formatDate(day.date)}
                  </span>
                  <div className="flex-1 flex items-end gap-1 h-12">
                    <div
                      className="flex-1 bg-blue-500/60 rounded-t-sm"
                      style={{ height: `${Math.max((day.users / (stats?.daily?.reduce((max, d) => Math.max(max, d.users), 0) || 1)) * 100, 5)}%` }}
                      title={`${day.users} users`}
                    ></div>
                    <div
                      className="flex-1 bg-green-500/60 rounded-t-sm"
                      style={{ height: `${Math.max((day.emails / (stats?.daily?.reduce((max, d) => Math.max(max, d.emails), 0) || 1)) * 100, 5)}%` }}
                      title={`${day.emails} emails`}
                    ></div>
                  </div>
                  <span className="text-white text-sm w-24">
                    {day.users} users, {day.emails} emails
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
          <h3 className="text-lg font-semibold text-white mb-4">User List</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a3e]">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Tier</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Emails Used</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[#2a2a3e]/50 hover:bg-[#2a2a3e]/30 transition-colors">
                    <td className="py-3 px-4 text-white">{user.email || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">{user.full_name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTierColor(user.subscription_tier)}`}>
                        {getTierLabel(user.subscription_tier)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{user.emails_used_this_month || 0}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No users found
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-[#1a1a2e] rounded-xl p-6 border border-[#2a2a3e]">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0a0a0f] rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Website</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-400">Online</span>
              </div>
            </div>
            <div className="p-4 bg-[#0a0a0f] rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Database</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-400">Connected</span>
              </div>
            </div>
            <div className="p-4 bg-[#0a0a0f] rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Payment Gateway</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
