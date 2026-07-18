'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, CreditCard, Lock, ArrowLeft, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'

import { supabase } from '@/lib/supabase/client'

const PLAN_DETAILS = {
  free: { name: 'Free', price: 0, emails: '20 emails/month', features: ['20 emails/month', 'Basic templates', 'Email support'] },
  pro: { name: 'Pro', price: 29, emails: '500 emails/month', features: ['500 emails/month', 'Advanced templates', 'Priority support', 'Analytics'] },
  business: { name: 'Business', price: 79, emails: 'Unlimited emails', features: ['Unlimited emails', 'Custom templates', 'Dedicated support', 'Advanced analytics', 'API access'] },
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const planParam = searchParams.get('plan') as 'free' | 'pro' | 'business' | null

  const [selectedPlan] = useState<'free' | 'pro' | 'business'>(() => {
    if (planParam && ['free', 'pro', 'business'].includes(planParam)) {
      return planParam
    }
    return 'pro'
  })

  const [email, setEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [isEmailPreFilled, setIsEmailPreFilled] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'creem' | 'stripe'>('creem')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.email) {
        setEmail(authUser.email)
        setIsEmailPreFilled(true)
      }
    }
    checkUser()
  }, [])

  const handleStripePayment = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      const priceId = selectedPlan === 'pro'
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID

      if (!priceId) {
        setError('Payment service temporarily unavailable')
        setIsProcessing(false)
        return
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://getmailforge.top'}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://getmailforge.top'}/checkout?plan=${selectedPlan}&canceled=true`,
        }),
      })

      const data = await response.json()

      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl
      } else {
        setError(data.error?.message || 'Failed to create checkout session')
      }
    } catch (error) {
      setError('Payment service temporarily unavailable')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreemPayment = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setIsProcessing(true)

    try {
      const response = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, email }),
      })

      const data = await response.json()

      if (data.success && data.data?.paymentUrl) {
        sessionStorage.setItem('pending_upgrade_plan', selectedPlan)
        sessionStorage.setItem('pending_upgrade_email', email)
        sessionStorage.setItem('pending_payment_id', data.data.paymentId)
        window.open(data.data.paymentUrl, '_blank')
      } else {
        setError(data.error?.message || 'Failed to create payment link')
      }
    } catch (error) {
      setError('Payment service temporarily unavailable')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmPayment = () => {
    if (selectedPlan === 'free') {
      router.push('/success')
      return
    }

    if (paymentMethod === 'stripe') {
      handleStripePayment()
    } else {
      handleCreemPayment()
    }
  }

  const plan = PLAN_DETAILS[selectedPlan]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-[#2a2a3e] bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/pricing')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Pricing
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-2">Complete Your Order</h1>
        <p className="text-white/60 mb-8">Secure checkout powered by trusted payment providers</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-[#2a2a3e]">
                <div>
                  <p className="text-white font-medium">{plan.name} Plan</p>
                  <p className="text-white/40 text-sm">{plan.emails}</p>
                </div>
                <p className="text-white font-bold text-2xl">${plan.price}</p>
              </div>

              <div className="space-y-2">
                <p className="text-white/60 text-sm">Features included:</p>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#2a2a3e]">
                <div className="flex justify-between text-white">
                  <span>Total</span>
                  <span className="font-bold text-xl">${plan.price}/month</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#2a2a3e]">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm mt-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No long-term contract, cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Payment Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => !isEmailPreFilled && setEmail(e.target.value)}
                  placeholder="your@email.com"
                  readOnly={isEmailPreFilled}
                  className={`w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isEmailPreFilled
                      ? 'bg-[#1a1a2e] border border-green-500/50 cursor-not-allowed'
                      : 'bg-[#0a0a0f] border border-[#2a2a3e] focus:ring-purple-500'
                  }`}
                />
                {isEmailPreFilled ? (
                  <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Authenticated email from your account
                  </p>
                ) : (
                  <p className="text-white/40 text-xs mt-2">Receipt will be sent to this email</p>
                )}
              </div>

              {selectedPlan !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                        paymentMethod === 'stripe'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-[#2a2a3e] hover:border-[#3a3a4e]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#635bff] rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">Stripe</p>
                          <p className="text-white/40 text-xs">Visa, MasterCard, Amex</p>
                        </div>
                      </div>
                      {paymentMethod === 'stripe' && (
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setPaymentMethod('creem')}
                      className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                        paymentMethod === 'creem'
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-[#2a2a3e] hover:border-[#3a3a4e]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#10b981] rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">C</span>
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">Creem</p>
                          <p className="text-white/40 text-xs">Supports multiple payment methods</p>
                        </div>
                      </div>
                      {paymentMethod === 'creem' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {selectedPlan !== 'free' && paymentMethod === 'creem' && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <p className="text-yellow-400 text-sm">
                    Click below to complete your payment on Creem secure checkout.
                    You will be automatically redirected and your subscription will be activated.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {selectedPlan === 'free' ? 'Activate Free Plan' : 'Continue to Payment'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-white/40 text-xs mt-4 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Secured by {paymentMethod === 'stripe' ? 'Stripe' : 'Creem'} - 256-bit SSL encryption
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-6 text-white/40">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Secure Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span className="text-sm">256-bit SSL</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
