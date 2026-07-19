'use client'

import { ArrowRight, Play, Check } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const features = [
  {
    emoji: '🎯',
    title: 'Smart Personalization',
    description: 'AI analyzes your prospect and crafts highly personalized emails that resonate.',
  },
  {
    emoji: '✍️',
    title: 'Multiple Versions',
    description: 'Get 3 different email versions to choose from - professional, friendly, and casual.',
  },
  {
    emoji: '🌍',
    title: 'Multi-Language',
    description: 'Generate emails in multiple languages to reach global prospects effectively.',
  },
  {
    emoji: '📊',
    title: 'Email Scoring',
    description: 'AI scores your emails for spam likelihood, readability, and reply potential.',
  },
  {
    emoji: '🔥',
    title: 'Subject Line Optimization',
    description: 'Get AI-generated subject lines proven to boost open rates by 3x.',
  },
  {
    emoji: '🔄',
    title: 'Follow-Up Sequences',
    description: 'Generate complete multi-touch follow-up sequences that keep prospects engaged.',
  },
  {
    emoji: '📈',
    title: 'Performance Analytics',
    description: 'Track which emails get replies and optimize your outreach strategy.',
  },
  {
    emoji: '🚀',
    title: 'Batch Generation',
    description: 'Generate personalized emails for entire prospect lists at once.',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Enter Client Info',
    description: "Input your prospect's name, company, and what you're offering.",
  },
  {
    step: '02',
    title: 'AI Generates 3 Versions',
    description: 'Our AI creates three unique email variations tailored to your prospect.',
  },
  {
    step: '03',
    title: 'Pick & Send',
    description: 'Choose the best version, copy it, and send it to start closing deals.',
  },
]

const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    badge: 'Most Popular Start',
    description: 'Perfect for testing cold outreach',
    features: [
      '20 emails/month',
      'Basic personalization',
      '3 email versions',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29',
    badge: 'Best Value',
    description: 'Most sales pros choose this plan',
    features: [
      '500 emails/month',
      'Advanced personalization',
      'All email tones',
      'Priority support',
      'Email history',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '79',
    badge: 'For Teams',
    description: 'Unlimited scale for growing teams',
    features: [
      'Unlimited emails',
      'Custom AI models',
      'Team collaboration',
      'API access',
      'Dedicated support',
    ],
    cta: 'Get Started',
    popular: false,
  },
]

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkUser()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f]" />
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="transform transition-all duration-1000 translate-y-0 opacity-100">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Stop Writing Cold Emails.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Let AI Write Ones That Get Replies.
              </span>
            </h1>

            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
              Generate personalized B2B cold emails in 10 seconds. 3 styles. Multi-language.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href={isLoggedIn ? '/generator' : '/signup'}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
              >
                Start Free — No Credit Card
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </button>
            </div>
            <p className="text-white/40 text-sm mb-12">
              Free forever plan available. Upgrade anytime.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#111118] to-transparent" />
      </section>

      <section id="features" className="py-24 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How MailForge Works
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Powerful features designed to supercharge your cold email outreach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="text-4xl mb-4">
                  {feature.emoji}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#111118]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple 3-Step Process
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              From prospect info to ready-to-send email in under 30 seconds
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {howItWorks.map((item, index) => (
              <div key={index} className="flex items-start gap-8">
                <div className="flex-shrink-0">
                  <div className="text-7xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent opacity-30">
                    {item.step}
                  </div>
                </div>
                <div className="flex-grow pt-4">
                  <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-white/60 text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="inline-block bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl px-8 py-4">
              <p className="text-yellow-400 font-semibold text-lg">
                🎉 Launch Special: First 100 Pro users get 1 month free
              </p>
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20' 
                    : 'bg-[#1a1a2e] border border-[#2a2a3e]'
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-[#2a2a3e] text-white/70'
                  }`}>
                    {plan.badge}
                  </div>
                )}
                
                <div className="mb-4 mt-2">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
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

                {plan.id === 'free' ? (
                  <Link
                    href="/signup"
                    className={`block text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <Link
                    href={`/checkout?plan=${plan.id}`}
                    className={`block text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#111118]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by Sales Teams Worldwide
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Trusted by thousands of sales professionals across 50+ countries
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                50K+
              </div>
              <div className="text-white/60">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
                12%
              </div>
              <div className="text-white/60">Avg Reply Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
                2M+
              </div>
              <div className="text-white/60">Emails Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-2">
                50+
              </div>
              <div className="text-white/60">Countries</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                role: 'VP of Sales',
                company: 'TechStartup Inc.',
                quote: 'MailForge has cut our email writing time by 80%. Our reply rates went from 3% to 18% in the first month.',
                avatar: 'SC'
              },
              {
                name: 'Marcus Rodriguez',
                role: 'Sales Director',
                company: 'CloudScale',
                quote: 'The AI understands our brand voice perfectly. Our prospects think these are handwritten emails from our reps.',
                avatar: 'MR'
              },
              {
                name: 'Emily Watson',
                role: 'Founder',
                company: 'GrowthLabs',
                quote: 'As a solo founder, MailForge lets me compete with bigger companies. Worth every penny.',
                avatar: 'EW'
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-2xl p-8 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-white/60 text-sm">{testimonial.role} @ {testimonial.company}</p>
                  </div>
                </div>
                <p className="text-white/80 leading-relaxed italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Closing More Deals Today
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Join sales professionals who have transformed their outreach with MailForge.
          </p>
          <Link
            href={isLoggedIn ? '/generator' : '/signup'}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
          >
            Start Free — No Credit Card
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-white/40 text-sm">
            Free forever plan available. Upgrade anytime.
          </p>
        </div>
      </section>
    </div>
  )
}