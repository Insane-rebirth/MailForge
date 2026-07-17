'use client'

import { X, Sparkles, Check, Zap, ExternalLink } from 'lucide-react'
import { CREEM_PAYMENT_LINKS } from '@/lib/subscription'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: 'free' | 'pro' | 'business'
}

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    period: '/mo',
    quota: '20 emails/mo',
    features: ['20 emails/month', 'Basic templates', 'Email support'],
    recommended: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$29',
    period: '/mo',
    quota: '500 emails/mo',
    features: ['500 emails/month', 'Advanced templates', 'Priority support', 'Analytics'],
    recommended: true,
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: '$79',
    period: '/mo',
    quota: 'Unlimited',
    features: ['Unlimited emails', 'Custom templates', 'Dedicated support', 'Advanced analytics', 'API access'],
    recommended: false,
  },
]

export default function UpgradeModal({ isOpen, onClose, currentPlan }: UpgradeModalProps) {
  if (!isOpen) return null

  const handleSelectPlan = (planId: 'free' | 'pro' | 'business') => {
    if (planId === 'free') {
      // Free方案直接返回
      onClose()
      return
    }

    // 跳转到Creem支付页面
    const creemLink = planId === 'pro' ? CREEM_PAYMENT_LINKS.pro : CREEM_PAYMENT_LINKS.business
    const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://spiffy-marigold-663661.netlify.app'}/success`
    const paymentUrl = `${creemLink}?return_url=${encodeURIComponent(returnUrl)}`
    window.open(paymentUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Upgrade to Unlock More</h2>
          <p className="text-white/60">
            {currentPlan === 'free'
              ? "You've used all 20 free emails. Upgrade to Pro for 500/month"
              : currentPlan === 'pro'
              ? "You've used all 500 emails. Upgrade to Business for unlimited"
              : ''}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan
            const isRecommended = plan.recommended || (currentPlan === 'free' && plan.id === 'pro') || (currentPlan === 'pro' && plan.id === 'business')

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-6 transition-all ${
                  isRecommended
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500 scale-105'
                    : isCurrent
                    ? 'bg-[#0a0a0f] border border-[#2a2a3e] opacity-60'
                    : 'bg-[#0a0a0f] border border-[#2a2a3e] hover:border-purple-500/50'
                }`}
              >
                {/* Recommended badge */}
                {isRecommended && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-semibold text-white flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Recommended
                  </div>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-500 rounded-full text-xs font-semibold text-white">
                    Current Plan
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-4 mt-2">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/60">{plan.period}</span>
                  </div>
                  <p className="text-purple-400 text-sm mt-2">{plan.quota}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                      : isRecommended
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white'
                  }`}
                >
                  {isCurrent ? (
                    'Current Plan'
                  ) : plan.id === 'free' ? (
                    'Start Free'
                  ) : (
                    <>
                      Select Plan
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/40 text-sm mt-6">
          Cancel anytime · Secure payment · 14-day money back guarantee
        </p>
      </div>
    </div>
  )
}
