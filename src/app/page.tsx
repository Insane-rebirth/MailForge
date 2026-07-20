'use client'

import { ArrowRight, Play, Check } from 'lucide-react'
import Link from 'next/link'

const features = [
  { emoji: '🎯', title: 'Smart Personalization', description: 'AI crafts highly personalized emails' },
  { emoji: '✍️', title: 'Multiple Versions', description: 'Get 3 email versions - professional, friendly, casual' },
  { emoji: '🌍', title: 'Multi-Language', description: 'Generate emails in multiple languages' },
  { emoji: '📊', title: 'Email Scoring', description: 'AI scores emails for spam likelihood and readability' },
]

const pricingPlans = [
  {
    id: 'free', name: 'Free', price: '0', features: ['20 emails/month', 'Basic personalization', '3 email versions'],
    cta: 'Start Free', popular: false,
  },
  {
    id: 'pro', name: 'Pro', price: '29', features: ['500 emails/month', 'Advanced personalization', 'All email tones', 'Priority support'],
    cta: 'Get Started', popular: true,
  },
  {
    id: 'business', name: 'Business', price: '79', features: ['Unlimited emails', 'Custom AI models', 'Team collaboration', 'API access'],
    cta: 'Get Started', popular: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Stop Writing Cold Emails.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Let AI Write Ones That Get Replies.
            </span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Generate personalized B2B cold emails in 10 seconds. 3 styles. Multi-language.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/signup" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all">
              Start Free — No Credit Card
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-xl border border-white/20 hover:bg-white/10 transition-all">
              <Play className="w-5 h-5" />
              See How It Works
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Everything you need to supercharge your cold email outreach</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6 hover:border-blue-500/50 transition-all">
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Choose the plan that fits your needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-8 flex flex-col ${plan.popular ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50' : 'bg-[#1a1a2e] border border-[#2a2a3e]'}`}>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/60 text-sm">/month</span>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-blue-400" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === 'free' ? (
                  <Link href="/signup" className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {plan.cta}
                  </Link>
                ) : (
                  <Link href={`/checkout?plan=${plan.id}`} className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Start Closing More Deals Today</h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Join sales professionals who have transformed their outreach with MailForge.
          </p>
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all">
            Start Free — No Credit Card
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}