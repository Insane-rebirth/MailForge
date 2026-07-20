'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Sparkles, AlertTriangle } from 'lucide-react'
import { getSupabase } from '@/lib/supabase/client'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [activatedPlan, setActivatedPlan] = useState<string>('pro')
  const [paymentVerification, setPaymentVerification] = useState<{ checkout_id?: string; stripe_session_id?: string }>({})

  useEffect(() => {
    const checkUser = async () => {
      try {
        const client = getSupabase()
        const { data: { user: authUser } } = await client.auth.getUser()
        setUser(authUser)
      } catch (error) {
        console.error('Failed to check user:', error)
        setUser(null)
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    const checkoutId = searchParams.get('checkout_id')
    const creemCheckoutId = searchParams.get('creem_checkout_id')
    const stripeSessionId = searchParams.get('session_id')
    const paymentId = searchParams.get('payment_id')

    if (stripeSessionId) {
      verifyStripeSession(stripeSessionId)
    } else if (paymentId) {
      verifyPayment(paymentId)
    } else if (creemCheckoutId) {
      verifyCreemCheckout(creemCheckoutId)
    } else if (checkoutId) {
      verifyCheckout(checkoutId)
    } else {
      const pendingPaymentId = sessionStorage.getItem('pending_payment_id')
      const pendingPlan = sessionStorage.getItem('pending_upgrade_plan')
      
      if (pendingPaymentId && pendingPlan) {
        verifyPayment(pendingPaymentId)
      } else {
        setStatus('error')
        setMessage('Invalid payment verification')
        setTimeout(() => router.push('/'), 3000)
      }
    }
  }, [searchParams, router])

  const verifyStripeSession = async (sessionId: string) => {
    try {
      setStatus('loading')
      setMessage('Verifying your payment...')

      const response = await fetch('/api/verify-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripe_session_id: sessionId }),
      })

      const data = await response.json()

      if (data.success && data.plan) {
        setPaymentVerification({ stripe_session_id: sessionId })
        activateSubscription(data.plan)
      } else {
        setStatus('error')
        setMessage(data.error || 'Payment verification failed, please try again')
      }
    } catch (error) {
      console.error('Stripe verification error:', error)
      setStatus('error')
      setMessage('Payment verification failed, please contact support')
    }
  }

  const verifyCreemCheckout = async (creemCheckoutId: string) => {
    try {
      setStatus('loading')
      setMessage('Verifying your payment...')

      const response = await fetch('/api/verify-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkout_id: creemCheckoutId }),
      })

      const data = await response.json()

      if (data.success && data.plan) {
        setPaymentVerification({ checkout_id: creemCheckoutId })
        activateSubscription(data.plan)
      } else {
        setStatus('error')
        setMessage(data.error || 'Payment verification failed, please try again')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('Payment verification failed, please contact support')
    }
  }

  const verifyCheckout = async (checkoutId: string) => {
    try {
      setStatus('loading')
      setMessage('Verifying your payment...')

      const response = await fetch('/api/verify-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkout_id: checkoutId }),
      })

      const data = await response.json()

      if (data.success && data.plan) {
        setPaymentVerification({ checkout_id: checkoutId })
        activateSubscription(data.plan)
      } else {
        setStatus('error')
        setMessage(data.error || 'Payment verification failed, please try again')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('Payment verification failed, please contact support')
    }
  }

  const verifyPayment = async (paymentId: string) => {
    try {
      setStatus('loading')
      setMessage('Verifying your payment...')

      const pendingPlan = sessionStorage.getItem('pending_upgrade_plan')
      const pendingEmail = sessionStorage.getItem('pending_upgrade_email')

      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, plan: pendingPlan, email: pendingEmail }),
      })

      const data = await response.json()

      if (data.success && data.plan) {
        setPaymentVerification({ checkout_id: paymentId })
        activateSubscription(data.plan)
      } else {
        setStatus('error')
        setMessage(data.error || 'Payment verification failed, please try again')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('Payment verification failed, please contact support')
    }
  }

  const activateSubscription = async (plan: string) => {
    if (user?.id) {
      try {
        await fetch('/api/update-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            plan: plan as 'free' | 'pro' | 'business',
            ...paymentVerification
          }),
        })
      } catch {
        console.error('Failed to update subscription')
      }
    }
    
    setActivatedPlan(plan)
    setStatus('success')
    setMessage('Your subscription is now active')

    sessionStorage.removeItem('pending_upgrade_plan')
    sessionStorage.removeItem('pending_upgrade_email')
    sessionStorage.removeItem('pending_upgrade_token')

    setTimeout(() => {
      router.push('/dashboard')
    }, 5000)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{message || 'Verifying your payment...'}</h1>
          <p className="text-white/60">Please wait...</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{message}</h1>
          <p className="text-white/60 mb-8">If the issue persists, please contact our support team.</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-medium rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const planNames: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-[#2a2a3e] bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-white">MailForge</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">
            Payment Successful!
          </h1>

          <p className="text-xl text-white/80 mb-8">
            {message}
          </p>

          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-2xl p-8 max-w-md mx-auto mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {planNames[activatedPlan] || 'Pro'} Plan Activated
              </span>
            </div>
            <p className="text-white/60">
              Welcome to MailForge {planNames[activatedPlan]} Plan!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/generator')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Start Generating
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-medium rounded-xl transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          <p className="text-white/40 text-sm mt-12">
            Page will automatically redirect to Dashboard in 5 seconds...
          </p>
        </div>
      </main>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
