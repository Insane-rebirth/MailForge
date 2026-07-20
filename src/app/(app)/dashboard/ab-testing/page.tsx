'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Check, BarChart3, Users, MailOpen, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client'

interface TestVariant {
  id: string
  subject: string
  body: string
  style: string
  sentCount: number
  replyCount: number
  openCount: number
}

interface ABTest {
  id: string
  name: string
  subject: string
  variants: TestVariant[]
  status: 'active' | 'completed' | 'draft'
  createdAt: string
  winnerId: string | null
}

export default function ABTestingPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<ABTest[]>([])
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTestName, setNewTestName] = useState('')
  const [newTestSubject, setNewTestSubject] = useState('')
  const [newVariants, setNewVariants] = useState<Array<{ subject: string; body: string; style: string }>>([
    { subject: '', body: '', style: 'Formal' },
    { subject: '', body: '', style: 'Casual' }
  ])
  const [creatingTest, setCreatingTest] = useState(false)
  const [deletingTest, setDeletingTest] = useState<string | null>(null)

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
        setLoading(false)
      } catch (error) {
        console.error('Failed to check user:', error)
        window.location.href = '/login'
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchTests()
    }
  }, [user])

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/ab-test?action=list')
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests.map((t: any) => ({
          ...t,
          variants: typeof t.variants === 'string' ? JSON.parse(t.variants) : t.variants
        })))
      }
    } catch (error) {
      console.error('Error fetching tests:', error)
    }
  }

  const handleCreateTest = async () => {
    if (!newTestName || !newTestSubject || newVariants.some(v => !v.subject || !v.body)) {
      alert('Please fill in all fields')
      return
    }

    setCreatingTest(true)
    try {
      const response = await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          test: {
            name: newTestName,
            subject: newTestSubject,
            variants: newVariants
          }
        })
      })
      if (response.ok) {
        await fetchTests()
        setShowCreateModal(false)
        setNewTestName('')
        setNewTestSubject('')
        setNewVariants([
          { subject: '', body: '', style: 'Formal' },
          { subject: '', body: '', style: 'Casual' }
        ])
      }
    } catch (error) {
      console.error('Error creating test:', error)
    } finally {
      setCreatingTest(false)
    }
  }

  const handleCompleteTest = async (testId: string, winnerId: string) => {
    try {
      const response = await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          test: { testId, winnerId }
        })
      })
      if (response.ok) {
        await fetchTests()
        setSelectedTest(null)
      }
    } catch (error) {
      console.error('Error completing test:', error)
    }
  }

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return
    
    setDeletingTest(testId)
    try {
      const response = await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          test: { testId }
        })
      })
      if (response.ok) {
        await fetchTests()
        setSelectedTest(null)
      }
    } catch (error) {
      console.error('Error deleting test:', error)
    } finally {
      setDeletingTest(null)
    }
  }

  const addVariant = () => {
    const styles = ['Formal', 'Casual', 'Concise', 'Professional', 'Friendly']
    const nextStyle = styles[(newVariants.length) % styles.length]
    setNewVariants([...newVariants, { subject: '', body: '', style: nextStyle }])
  }

  const removeVariant = (index: number) => {
    if (newVariants.length > 2) {
      setNewVariants(newVariants.filter((_, i) => i !== index))
    }
  }

  const getWinningVariant = (test: ABTest) => {
    if (!test.winnerId) return null
    return test.variants.find(v => v.id === test.winnerId)
  }

  const getBestPerformingVariant = (test: ABTest) => {
    return test.variants.reduce((best, current) => {
      const bestRate = best.replyCount / Math.max(best.sentCount, 1)
      const currentRate = current.replyCount / Math.max(current.sentCount, 1)
      return currentRate > bestRate ? current : best
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 bg-[#1a1a2e] rounded-lg hover:bg-[#2a2a3e] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">A/B Testing</h1>
              <p className="text-white/60">Test different email versions and find what works best</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create New Test
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">My Tests</h2>
              {tests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/40">No tests yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Create your first test
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      onClick={() => setSelectedTest(test)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedTest?.id === test.id
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'bg-[#0a0a0f] hover:bg-[#1a1a2e] border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{test.name}</h3>
                          <p className="text-white/40 text-sm mt-1">{test.variants.length} variants</p>
                          <p className="text-white/40 text-xs mt-1">{formatDate(test.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            test.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            test.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {test.status}
                          </span>
                          {test.winnerId && (
                            <Check className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedTest ? (
              <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTest.name}</h2>
                    <p className="text-white/60 mt-1">Created on {formatDate(selectedTest.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedTest.status === 'active' && (
                      <button
                        onClick={() => handleCompleteTest(selectedTest.id, getBestPerformingVariant(selectedTest).id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Mark Winner
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTest(selectedTest.id)}
                      disabled={deletingTest === selectedTest.id}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingTest === selectedTest.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-[#0a0a0f] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MailOpen className="w-5 h-5 text-blue-400" />
                        <span className="text-white/60 text-sm">Total Opens</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {selectedTest.variants.reduce((sum, v) => sum + v.openCount, 0)}
                      </p>
                    </div>
                    <div className="bg-[#0a0a0f] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-green-400" />
                        <span className="text-white/60 text-sm">Total Sent</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {selectedTest.variants.reduce((sum, v) => sum + v.sentCount, 0)}
                      </p>
                    </div>
                    <div className="bg-[#0a0a0f] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-5 h-5 text-purple-400" />
                        <span className="text-white/60 text-sm">Total Replies</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {selectedTest.variants.reduce((sum, v) => sum + v.replyCount, 0)}
                      </p>
                    </div>
                    <div className="bg-[#0a0a0f] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-orange-400" />
                        <span className="text-white/60 text-sm">Winning Variant</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {getWinningVariant(selectedTest)?.style || 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Variants</h3>
                  {selectedTest.variants.map((variant, index) => {
                    const isWinner = variant.id === selectedTest.winnerId
                    const totalSent = selectedTest.variants.reduce((sum, v) => sum + v.sentCount, 0)
                    const sentPercentage = totalSent > 0 ? (variant.sentCount / totalSent) * 100 : 0
                    const replyRate = variant.sentCount > 0 ? ((variant.replyCount / variant.sentCount) * 100).toFixed(1) : '0'
                    
                    return (
                      <div
                        key={variant.id}
                        className={`bg-[#0a0a0f] rounded-xl p-6 border ${
                          isWinner ? 'border-green-500/50' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                              Variant {index + 1}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              variant.style === 'Formal' ? 'bg-blue-500/20 text-blue-400' :
                              variant.style === 'Casual' ? 'bg-green-500/20 text-green-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {variant.style}
                            </span>
                            {isWinner && (
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                                <Check className="w-4 h-4" />
                                Winner
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">{replyRate}% Reply Rate</p>
                            <p className="text-white/40 text-sm">{variant.sentCount} sent / {variant.openCount} opened / {variant.replyCount} replies</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-white/60">Traffic Distribution</span>
                            <span className="text-white/60">{sentPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isWinner ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${sentPercentage}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white/60 text-sm mb-2">Subject</h4>
                          <p className="text-blue-400 font-medium">{variant.subject}</p>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-white/60 text-sm mb-2">Body Preview</h4>
                          <div className="bg-[#1a1a2e] rounded-lg p-4">
                            <p className="text-white/80 text-sm line-clamp-3">{variant.body}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6">
                  <BarChart3 className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Select a Test</h3>
                <p className="text-white/60 mb-6">Choose a test from the sidebar to view results, or create a new one</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create New Test
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-2xl bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create New A/B Test</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-[#2a2a3e] rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Test Name</label>
                <input
                  type="text"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Q4 Cold Outreach Test"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Base Subject Line</label>
                <input
                  type="text"
                  value={newTestSubject}
                  onChange={(e) => setNewTestSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., How we helped [Company] increase conversions"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-white/60">Test Variants</label>
                  <button
                    onClick={addVariant}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variant
                  </button>
                </div>
                <div className="space-y-4">
                  {newVariants.map((variant, index) => (
                    <div key={index} className="bg-[#0a0a0f] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">Variant {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={variant.style}
                            onChange={(e) => {
                              const updated = [...newVariants]
                              updated[index].style = e.target.value
                              setNewVariants(updated)
                            }}
                            className="px-3 py-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white text-sm"
                          >
                            <option value="Formal">Formal</option>
                            <option value="Casual">Casual</option>
                            <option value="Concise">Concise</option>
                            <option value="Professional">Professional</option>
                            <option value="Friendly">Friendly</option>
                          </select>
                          {newVariants.length > 2 && (
                            <button
                              onClick={() => removeVariant(index)}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={variant.subject}
                          onChange={(e) => {
                            const updated = [...newVariants]
                            updated[index].subject = e.target.value
                            setNewVariants(updated)
                          }}
                          className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Subject line for this variant"
                        />
                        <textarea
                          value={variant.body}
                          onChange={(e) => {
                            const updated = [...newVariants]
                            updated[index].body = e.target.value
                            setNewVariants(updated)
                          }}
                          rows={4}
                          className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Email body for this variant"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTest}
                  disabled={creatingTest}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingTest ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Test</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}