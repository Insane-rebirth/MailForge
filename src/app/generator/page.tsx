'use client'

import { useState, useEffect, useRef } from 'react'
import UpgradeModal from '@/components/UpgradeModal'
import {
  cacheSubscription,
  verifySubscriptionWithAPI,
  checkCanGenerate,
  syncUsageAfterGenerate,
  PLAN_QUOTAS,
  PLAN_NAMES
} from '@/lib/subscription'
import { supabase } from '@/lib/supabase/client'

interface EmailData {
  style: 'Formal' | 'Casual' | 'Concise' | 'Professional' | 'Friendly'
  subject: string
  body: string
}

interface PreviewEmail extends EmailData {
  index: number
}

interface FollowupEmail {
  day: number
  label: string
  subject: string
  body: string
}

interface BatchResult {
  name: string
  company: string
  email: string
  status: 'success' | 'error'
  subject?: string
  body?: string
  error?: string
}

function formalTemplate(clientName: string, companyName: string, product: string, purpose: string): string {
  return `Dear ${clientName},

I noticed ${companyName} has been expanding its operations recently — congratulations on the growth.

I'm reaching out because we've helped 3 companies in your space solve a specific challenge: ${purpose}. The results have been consistent — a 40% average increase in engagement rates, with one client generating $2.3M in new pipeline within their first quarter.

Here's why ${product} works where others don't:
• Personalization at scale: Each email is tailored to the recipient's industry, role, and pain points
• Data-driven templates: Built on 50,000+ high-performing outreach emails
• Measurable outcomes: Full analytics so you can track what works

I put together a brief 2-minute walkthrough specifically for ${companyName}. Would you like me to send it over?

No strings attached — just a quick look, and you decide if it's worth a conversation.

Best regards`
}

function casualTemplate(clientName: string, companyName: string, product: string, purpose: string): string {
  return `Hey ${clientName}!

Quick question — what would ${companyName} look like if your sales team could ${purpose} without spending hours writing each email by hand?

That's exactly what ${product} does. We've helped teams go from 50 generic emails/day to 500 personalized ones — and their reply rates jumped from 3% to 12%.

Here's the thing most people don't realize: it's not about sending MORE emails. It's about sending the RIGHT ones. Our AI analyzes what works across 50K+ successful outreach campaigns and builds that intelligence into every email.

Want to see it in action? I can set up a personalized demo for ${companyName} in under 10 minutes.

Just reply "demo" and I'll make it happen 👍

Cheers`
}

function conciseTemplate(clientName: string, companyName: string, product: string, purpose: string): string {
  return `Hi ${clientName},

${companyName} + ${product} = 12% reply rates (up from industry avg 3%).

We help sales teams ${purpose} — 500+ companies, $3.70 pipeline per $1 spent.

2-min demo: reply "yes"

Best`
}

function parseCSV(text: string): Array<{name: string; company: string; industry: string; email: string}> {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
  const nameIdx = headers.findIndex(h => h.includes('name'))
  const companyIdx = headers.findIndex(h => h.includes('company'))
  const industryIdx = headers.findIndex(h => h.includes('industry'))
  const emailIdx = headers.findIndex(h => h.includes('email'))
  
  if (nameIdx === -1 || companyIdx === -1) return []
  
  const results = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
    if (values[nameIdx] && values[companyIdx]) {
      results.push({
        name: values[nameIdx] || '',
        company: values[companyIdx] || '',
        industry: industryIdx !== -1 ? values[industryIdx] || 'Technology/SaaS' : 'Technology/SaaS',
        email: emailIdx !== -1 ? values[emailIdx] || '' : ''
      })
    }
  }
  return results
}

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')
  
  const [clientName, setClientName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [product, setProduct] = useState('')
  const [purpose, setPurpose] = useState('Cold Outreach')
  const [industry, setIndustry] = useState('Technology/SaaS')
  const [language, setLanguage] = useState('English')
  const [loading, setLoading] = useState(false)
  const [emails, setEmails] = useState<EmailData[]>([])
  const [followups, setFollowups] = useState<FollowupEmail[]>([])
  const [showFollowups, setShowFollowups] = useState(false)
  const [followupsLoading, setFollowupsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [templateMode, setTemplateMode] = useState(false)
  
  const [batchFile, setBatchFile] = useState<File | null>(null)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchLimit, setBatchLimit] = useState(0)
  const [crmConnected, setCrmConnected] = useState(false)
  const [importingFromCrm, setImportingFromCrm] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [subscription, setSubscription] = useState<{
    plan: 'free' | 'pro' | 'business'
    usageCount: number
  }>({ plan: 'free', usageCount: 0 })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [previewEmail, setPreviewEmail] = useState<PreviewEmail | null>(null)
  const [emailScores, setEmailScores] = useState<Record<number, { score: number; grade: string; estimatedReplyRate: string; factors: { type: string; text: string }[] } | null>>({})

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const verified = await verifySubscriptionWithAPI(user.id)
        setSubscription(verified)
        cacheSubscription(verified)
        setBatchLimit(PLAN_QUOTAS[verified.plan])
        checkCrmConnection()
      } else {
        window.location.href = '/login?redirect=/generator'
      }
    } catch {
      window.location.href = '/login?redirect=/generator'
    }
  }

  const checkCrmConnection = async () => {
    try {
      const response = await fetch('/api/crm?action=get-settings')
      if (response.ok) {
        const data = await response.json()
        setCrmConnected(!!data.settings)
      }
    } catch {
      setCrmConnected(false)
    }
  }

  const handleImportFromCrm = async () => {
    setImportingFromCrm(true)
    try {
      const response = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import-contacts' })
      })
      if (response.ok) {
        const data = await response.json()
        const csvContent = data.contacts.map((c: any) => 
          `${c.name},${c.company},${c.industry},${c.email}`
        ).join('\n')
        
        const blob = new Blob(['name,company,industry,email\n' + csvContent], { type: 'text/csv' })
        const file = new File([blob], 'crm_contacts.csv', { type: 'text/csv' })
        setBatchFile(file)
      }
    } catch {
      console.error('Failed to import from CRM')
    } finally {
      setImportingFromCrm(false)
    }
  }

  const handleGenerate = async (includeFollowups = false) => {
    if (!clientName || !companyName || !product) {
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || ''

    const result = await checkCanGenerate(userId)

    if (!result.canGenerate && !includeFollowups) {
      setShowUpgradeModal(true)
      return
    }

    setSubscription(prev => ({
      ...prev,
      plan: result.plan,
      usageCount: result.remaining === -1 ? 0 : (PLAN_QUOTAS[result.plan] - result.remaining)
    }))

    if (includeFollowups) {
      setFollowupsLoading(true)
    } else {
      setLoading(true)
    }
    setTemplateMode(false)

    let aiGenerated = false

    try {
      const response = await fetch('/api/generate-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          companyName,
          product,
          purpose,
          industry,
          language,
          include_followups: includeFollowups
        })
      })

      const data = await response.json()

      if (includeFollowups && data.initial_emails) {
        const formattedEmails: EmailData[] = data.initial_emails.map((e: EmailData) => ({
          ...e,
          style: e.style === 'Formal' ? 'Formal' : 
                 e.style === 'Casual' ? 'Casual' : 
                 e.style === 'Concise' ? 'Concise' : e.style
        }))
        setEmails(formattedEmails)
        setFollowups(data.followups || [])
        setShowFollowups(true)
        aiGenerated = true
      } else if (data.emails && Array.isArray(data.emails)) {
        const formattedEmails: EmailData[] = data.emails.map((e: EmailData) => ({
          ...e,
          style: e.style === 'Formal' ? 'Formal' : 
                 e.style === 'Casual' ? 'Casual' : 
                 e.style === 'Concise' ? 'Concise' : e.style
        }))
        setEmails(formattedEmails)
        setFollowups([])
        setShowFollowups(false)
        aiGenerated = true
      } else {
        generateWithTemplate()
      }
    } catch {
      generateWithTemplate()
    }

    setLoading(false)
    setFollowupsLoading(false)

    if (aiGenerated && userId) {
      syncUsageAfterGenerate(userId, result.plan).then(newCount => {
        setSubscription(prev => ({
          ...prev,
          usageCount: newCount
        }))
      })
    }

    emails.forEach((email, index) => {
      scoreEmail(index, email.subject, email.body)
    })
  }

  const scoreEmail = async (index: number, subject: string, body: string) => {
    try {
      const response = await fetch('/api/score-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body })
      })
      const data = await response.json()
      setEmailScores(prev => ({
        ...prev,
        [index]: {
          score: data.score,
          grade: data.grade,
          estimatedReplyRate: data.estimatedReplyRate,
          factors: data.factors
        }
      }))
    } catch {
      setEmailScores(prev => ({
        ...prev,
        [index]: null
      }))
    }
  }

  const generateWithTemplate = () => {
    setTemplateMode(true)
    const generatedEmails: EmailData[] = [
      {
        style: 'Formal',
        subject: `Re: ${companyName} - Optimizing ${purpose} workflows`,
        body: formalTemplate(clientName, companyName, product, purpose)
      },
      {
        style: 'Casual',
        subject: `Quick question about ${purpose} at ${companyName}`,
        body: casualTemplate(clientName, companyName, product, purpose)
      },
      {
        style: 'Concise',
        subject: `${product} for ${companyName}?`,
        body: conciseTemplate(clientName, companyName, product, purpose)
      }
    ]
    setEmails(generatedEmails)
  }

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyFollowups = async () => {
    const text = emails.map((e) =>
      `Day 0: ${e.subject}\n${e.body}`
    ).join('\n\n---\n\n') + '\n\n' + followups.map(f => 
      `Day ${f.day}: ${f.subject}\n${f.body}`
    ).join('\n\n---\n\n')
    
    await handleCopy(text, -1)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBatchFile(file)
    }
  }

  const handleBatchGenerate = async () => {
    if (!batchFile) return

    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || ''

    const result = await checkCanGenerate(userId)
    if (!result.canGenerate) {
      setShowUpgradeModal(true)
      return
    }

    const text = await batchFile.text()
    const parsed = parseCSV(text)
    
    if (parsed.length === 0) {
      alert('Invalid CSV format. Please use: name, company, industry, email')
      return
    }

    const limit = PLAN_QUOTAS[result.plan]
    if (limit !== Infinity && parsed.length > limit) {
      alert(`Your ${PLAN_NAMES[result.plan]} plan allows up to ${limit} emails at once. Please reduce the CSV size or upgrade.`)
      return
    }

    setBatchLoading(true)
    setBatchResults([])
    setBatchProgress({ current: 0, total: parsed.length })

    const results: BatchResult[] = []

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i]
      setBatchProgress({ current: i + 1, total: parsed.length })

      try {
        const response = await fetch('/api/generate-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: row.name,
            companyName: row.company,
            product,
            purpose,
            industry: row.industry,
            language
          })
        })

        const data = await response.json()

        if (data.emails && data.emails[0]) {
          results.push({
            name: row.name,
            company: row.company,
            email: row.email,
            status: 'success',
            subject: data.emails[0].subject,
            body: data.emails[0].body
          })
        } else {
          results.push({
            name: row.name,
            company: row.company,
            email: row.email,
            status: 'error',
            error: 'Failed to generate'
          })
        }
      } catch {
        results.push({
          name: row.name,
          company: row.company,
          email: row.email,
          status: 'error',
          error: 'API error'
        })
      }

      setBatchResults([...results])
      
      if (i < parsed.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setBatchLoading(false)
    syncUsageAfterGenerate(userId, result.plan).then(newCount => {
      setSubscription(prev => ({
        ...prev,
        usageCount: newCount
      }))
    })
  }

  const exportBatchCSV = () => {
    const headers = ['name', 'company', 'email', 'status', 'subject', 'body']
    const rows = batchResults.map(r => [
      r.name || '',
      r.company || '',
      r.email || '',
      r.status || '',
      r.status === 'success' ? r.subject || '' : '',
      r.status === 'success' ? r.body || '' : (r.error || '')
    ])
    
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mailforge_batch_emails.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const purposeOptions = [
    'Cold Outreach',
    'Follow Up',
    'Product Demo',
    'Partnership',
    'Re-engagement'
  ]

  const industryOptions = [
    'Technology/SaaS',
    'Finance',
    'Healthcare',
    'E-commerce',
    'Education',
    'Consulting',
    'Other'
  ]

  const languageOptions = [
    'English',
    'Chinese',
    'Japanese',
    'Spanish',
    'French',
    'German'
  ]

  const { plan, usageCount } = subscription
  const quota = PLAN_QUOTAS[plan]
  const remaining = quota === Infinity ? -1 : quota - usageCount
  const planName = PLAN_NAMES[plan]

  const getUpgradeMessage = () => {
    if (plan !== 'free') return null
    
    if (usageCount >= 20) {
      return {
        type: 'limit',
        color: 'red',
        message: `Free limit reached. Upgrade to Pro (500/mo) or Business (unlimited) →`,
        link: '/checkout?plan=pro'
      }
    } else if (usageCount >= 15) {
      return {
        type: 'warning',
        color: 'orange',
        message: `Only ${20 - usageCount} free emails left. Don't lose momentum — upgrade now →`,
        link: '/checkout?plan=pro'
      }
    } else if (usageCount >= 5) {
      return {
        type: 'info',
        color: 'yellow',
        message: `You've used ${usageCount} of 20 free emails. Upgrade to Pro →`,
        link: '/checkout?plan=pro'
      }
    }
    return null
  }

  const upgradeMessage = getUpgradeMessage()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={plan}
      />

      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewEmail(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div>
                  <p className="text-gray-800 font-semibold">MailForge Preview</p>
                  <p className="text-gray-500 text-sm">How your email will appear in inbox</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-white p-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-gray-500 text-sm">Gmail Preview</span>
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-white px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">MailForge</p>
                          <p className="text-gray-500 text-xs">noreply@mailforge.top</p>
                        </div>
                      </div>
                      <span className="text-gray-400 text-xs">Just now</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-blue-600 font-medium mb-2">{previewEmail.subject}</div>
                    <div className="text-gray-800 whitespace-pre-wrap font-sans leading-relaxed text-sm">
                      {previewEmail.body}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    handleCopy(`Subject: ${previewEmail.subject}\n\n${previewEmail.body}`, previewEmail.index)
                    setPreviewEmail(null)
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  Copy & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {upgradeMessage && (
          <div className={`mb-6 p-4 rounded-xl border ${
            upgradeMessage.color === 'red' ? 'bg-red-500/10 border-red-500/30' :
            upgradeMessage.color === 'orange' ? 'bg-orange-500/10 border-orange-500/30' :
            'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${
                upgradeMessage.color === 'red' ? 'text-red-400' :
                upgradeMessage.color === 'orange' ? 'text-orange-400' :
                'text-yellow-400'
              }`}>
                {upgradeMessage.message}
              </p>
              <a
                href={upgradeMessage.link}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  upgradeMessage.color === 'red' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  upgradeMessage.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                  'bg-yellow-500 hover:bg-yellow-600 text-black'
                }`}
              >
                Upgrade Now
              </a>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">Email Generator</h1>
              <p className="text-gray-400 text-lg mt-1">Generate high-converting B2B sales emails powered by AI</p>
            </div>
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              plan === 'business'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400'
                : 'bg-[#1a1a2e] text-gray-300'
            }`}>
              {plan === 'business'
                ? `Unlimited (${planName})`
                : `Remaining: ${remaining}/${quota} (${planName})`}
            </div>
          </div>

          <div className="flex space-x-1 bg-[#1a1a2e] p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'single'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'batch'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Batch
            </button>
          </div>
        </div>

        {activeTab === 'single' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-6 text-white">Email Details</h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-300 mb-2">Client Name</label>
                  <input
                    type="text"
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corporation"
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-gray-300 mb-2">Your Product</label>
                  <input
                    type="text"
                    id="product"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="AI-powered email assistant"
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-300 mb-2">Email Purpose</label>
                  <select
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {purposeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {industryOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
                    Language 
                    <span className="text-xs text-purple-400 ml-2">
                      {language === 'Chinese' ? '✓ 中文' : 
                       language === 'Japanese' ? '✓ 日本語' :
                       language === 'Spanish' ? '✓ Español' :
                       language === 'French' ? '✓ Français' :
                       language === 'German' ? '✓ Deutsch' :
                       '✓ English'}
                    </span>
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {languageOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleGenerate(false)}
                  disabled={loading || !clientName || !companyName || !product}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>AI is crafting your personalized emails...</span>
                    </>
                  ) : (
                    <span>Generate Emails</span>
                  )}
                </button>
                {templateMode && (
                  <p className="text-center text-xs text-yellow-500 mt-2">
                    ⚠️ Using template mode - Connect your DeepSeek API key for AI-generated emails
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {emails.length === 0 ? (
                <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Your Emails Will Appear Here</h3>
                  <p className="text-gray-400">Fill in the form and click generate to create personalized emails</p>
                </div>
              ) : (
                <>
                  {emails.map((email, index) => (
                    <div key={index} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-200">
                      <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 px-6 py-4 border-b border-[#2a2a3e]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              email.style === 'Formal' || email.style === 'Professional' ? 'bg-blue-500/20 text-blue-400' :
                              email.style === 'Casual' || email.style === 'Friendly' ? 'bg-green-500/20 text-green-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {email.style}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPreviewEmail({ ...email, index })}
                              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-sm font-medium rounded-lg transition-all duration-200"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleCopy(`Subject: ${email.subject}\n\n${email.body}`, index)}
                              className="px-4 py-2 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white text-sm font-medium rounded-lg transition-all duration-200"
                            >
                              {copiedIndex === index ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Subject</h4>
                          <p className="text-blue-400 font-medium text-lg">{email.subject}</p>
                        </div>

                        {emailScores[index] && (
                          <div className="mb-4 bg-[#0a0a0f] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-400">Email Quality Score</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-2xl font-bold ${
                                  emailScores[index]!.grade === 'A' ? 'text-green-400' :
                                  emailScores[index]!.grade === 'B' ? 'text-blue-400' :
                                  emailScores[index]!.grade === 'C' ? 'text-yellow-400' :
                                  emailScores[index]!.grade === 'D' ? 'text-orange-400' : 'text-red-400'
                                }`}>
                                  {emailScores[index]!.score}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  emailScores[index]!.grade === 'A' ? 'bg-green-500/20 text-green-400' :
                                  emailScores[index]!.grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                  emailScores[index]!.grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                                  emailScores[index]!.grade === 'D' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {emailScores[index]!.grade}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Estimated Reply Rate</span>
                              <span className="text-green-400 font-medium">{emailScores[index]!.estimatedReplyRate}%</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[#2a2a3e]">
                              <div className="flex flex-wrap gap-2">
                                {emailScores[index]!.factors.slice(0, 4).map((factor, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded ${
                                      factor.type === 'positive' ? 'bg-green-500/10 text-green-400' :
                                      factor.type === 'negative' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                                    }`}
                                  >
                                    {factor.text}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Body</h4>
                          <div className="bg-[#0a0a0f] rounded-lg p-4">
                            <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleGenerate(true)}
                    disabled={followupsLoading || emails.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {followupsLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating follow-up sequence...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Follow-up Sequence</span>
                      </>
                    )}
                  </button>

                  {showFollowups && followups.length > 0 && (
                    <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 px-6 py-4 border-b border-[#2a2a3e]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                              Follow-up Sequence
                            </span>
                          </div>
                          <button
                            onClick={handleCopyFollowups}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
                          >
                            {copiedIndex === -1 ? <span>Copy Entire Sequence</span> : <span>Copied!</span>}
                          </button>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-pink-500"></div>
                          
                          <div className="space-y-6">
                            {[
                              { day: 0, label: 'Initial Email', emails: emails },
                              ...followups.map(f => ({ day: f.day, label: f.label, emails: [{ subject: f.subject, body: f.body, style: f.label as any }] }))
                            ].map((item, idx) => (
                              <div key={idx} className="relative pl-10">
                                <div className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                                  idx === 0 ? 'bg-purple-500 border-purple-500' :
                                  item.day === 21 ? 'bg-pink-500 border-pink-500' :
                                  'bg-indigo-500 border-indigo-500'
                                }`}></div>
                                <div className="bg-[#0a0a0f] rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-white font-medium">Day {item.day}</span>
                                      <span className="text-gray-500">•</span>
                                      <span className="text-gray-400 text-sm">{item.label}</span>
                                    </div>
                                  </div>
                                  {item.emails.map((email, emailIdx) => (
                                    <div key={emailIdx}>
                                      <p className="text-blue-400 font-medium">{email.subject}</p>
                                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{email.body.substring(0, 100)}...</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-6 text-white">Batch Email Generation</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Description (shared across all emails)
                  </label>
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="AI-powered email assistant"
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="batchPurpose" className="block text-sm font-medium text-gray-300 mb-2">Email Purpose</label>
                  <select
                    id="batchPurpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {purposeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="batchLanguage" className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                  <select
                    id="batchLanguage"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {languageOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">CSV File</label>
                  <div className="border-2 border-dashed border-[#2a2a3e] rounded-lg p-6 text-center hover:border-purple-500/50 transition-all cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {batchFile ? (
                      <div>
                        <p className="text-white font-medium">{batchFile.name}</p>
                        <p className="text-gray-400 text-sm mt-1">Click to change file</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400">Click or drag CSV file here</p>
                        <p className="text-gray-500 text-sm mt-1">Format: name, company, industry, email</p>
                      </div>
                    )}
                  </div>
                </div>

                {crmConnected && (
                  <button
                    onClick={handleImportFromCrm}
                    disabled={importingFromCrm}
                    className="w-full py-3 bg-blue-600/20 border border-blue-600/50 hover:bg-blue-600/30 text-blue-400 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {importingFromCrm ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Import Contacts from CRM</span>
                      </>
                    )}
                  </button>
                )}

                <div className="bg-[#0a0a0f] rounded-lg p-4">
                  <p className="text-gray-400 text-sm">
                    <span className="text-white font-medium">Batch Limit:</span> {batchLimit === Infinity ? 'Unlimited' : `${batchLimit} emails`}
                  </p>
                  {batchProgress.total > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{batchProgress.current}/{batchProgress.total}</span>
                      </div>
                      <div className="w-full bg-[#2a2a3e] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                          style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBatchGenerate}
                  disabled={batchLoading || !batchFile || !product}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {batchLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating {batchProgress.current}/{batchProgress.total}...</span>
                    </>
                  ) : (
                    <span>Generate All Emails</span>
                  )}
                </button>
              </div>
            </div>

            <div>
              {batchResults.length === 0 ? (
                <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Batch Results Will Appear Here</h3>
                  <p className="text-gray-400">Upload a CSV and click generate to create personalized emails for all contacts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      Results ({batchResults.filter(r => r.status === 'success').length}/{batchResults.length})
                    </h3>
                    <button
                      onClick={exportBatchCSV}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all"
                    >
                      Export CSV
                    </button>
                  </div>
                  
                  <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-[#0a0a0f] sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Subject</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a3e]">
                        {batchResults.map((result, idx) => (
                          <tr key={idx} className="hover:bg-[#0a0a0f]/50">
                            <td className="px-4 py-3 text-white text-sm">{result.name}</td>
                            <td className="px-4 py-3 text-gray-400 text-sm">{result.company}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.status === 'success' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {result.status === 'success' ? 'Success' : 'Error'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-[200px]">
                              {result.subject || result.error || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      </div>
  )
}
