'use client'

import { Check, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for trying out',
    features: [
      '20 emails/month',
      'Basic personalization',
      '3 email versions',
      'Standard support',
      'Email scoring (up to 10/day)',
      'Basic subject line suggestions',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '29',
    description: 'For serious sales reps',
    features: [
      '500 emails/month',
      'Advanced personalization',
      'All email tones (5+ styles)',
      'Priority support',
      'Email history',
      'Export to CSV',
      'Unlimited email scoring',
      'AI subject line optimization',
      'Follow-up sequence generator',
      'Spam detection & improvement',
      'Batch generation (up to 50)',
      'A/B testing suggestions',
      'Inbox placement prediction',
      'CRM contact enrichment',
      'Cold email warm-up tracker',
      'Best time to send analysis',
      'Email template library (50+)',
      'Multi-language support',
      'Custom tone training',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Business',
    price: '79',
    description: 'For sales teams',
    features: [
      'Unlimited emails',
      'Custom AI models',
      'Team collaboration',
      'API access',
      'Dedicated support',
      'Custom integrations',
      'Analytics dashboard',
      'All Pro features',
      'Team analytics & reporting',
      'Custom branding',
      'CRM integration',
      'SLA guarantee',
      'Custom onboarding',
      'Unlimited users',
      'White-label options',
      'Custom domain emails',
      'Scheduled email campaigns',
      'Performance analytics API',
      'Custom reporting',
      'Security audit log',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const faqs = [
  {
    question: 'Can I switch plans anytime?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate your billing.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express) through Stripe. Additional payment methods are available through our partner payment provider Creem.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Pro plan comes with a 14-day free trial. No credit card required to start.',
  },
  {
    question: 'What happens if I exceed my email limit?',
    answer: 'We\'ll notify you when you\'re approaching your limit. You can upgrade your plan or purchase additional emails as needed.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied with MailForge, you can request a full refund within 30 days of purchase by contacting support@getmailforge.top.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel your subscription at any time through your account settings. Your subscription will remain active until the end of your current billing period.',
  },
]

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkUser()
  }, [])

  const handlePlanSelect = (planName: string) => {
    router.push(`/checkout?plan=${planName.toLowerCase()}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Choose the plan that fits your needs. Start free, upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.popular 
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50' 
                  : 'bg-[#1a1a2e] border border-[#2a2a3e]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-semibold">
                  Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-white/60 text-sm">/month</span>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 flex-shrink-0 text-blue-400" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.name === 'Free' ? (
                <Link
                  href={isLoggedIn ? '/generator' : '/signup'}
                  className={`block text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  className={`w-full text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 mb-24">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">30-Day Money-Back Guarantee</h3>
              <p className="text-white/60">
                Not satisfied? Get a full refund within 30 days, no questions asked. We're confident you'll love MailForge.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-white/60">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-white/60 mb-8">
            We're here to help. Reach out to our support team.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
