'use client'

import Link from 'next/link'

const features = [
  {
    emoji: '🎯',
    title: 'Smart Personalization',
    description: 'AI analyzes your prospect and crafts highly personalized emails that resonate with their specific needs and pain points.',
  },
  {
    emoji: '✍️',
    title: 'Multiple Versions',
    description: 'Get 3 different email versions to choose from - professional, friendly, and casual. Find the perfect tone for each prospect.',
  },
  {
    emoji: '🌍',
    title: 'Multi-Language',
    description: 'Generate emails in multiple languages to reach global prospects effectively. Support for English, Chinese, Spanish, and more.',
  },
  {
    emoji: '📊',
    title: 'Proven Templates',
    description: 'Based on successful cold emails with high reply rates. Our templates are battle-tested and optimized.',
  },
  {
    emoji: '⚡',
    title: 'Lightning Fast',
    description: 'Generate personalized emails in seconds, not hours. Save time and focus on what matters - closing deals.',
  },
  {
    emoji: '🔒',
    title: 'Privacy First',
    description: 'Your data stays secure. We never store your prospects\' information or share your email content.',
  },
  {
    emoji: '📈',
    title: 'Analytics Dashboard',
    description: 'Track your email generation history and see which approaches work best for your audience.',
  },
  {
    emoji: '🤖',
    title: 'AI-Powered',
    description: 'Powered by advanced AI models that understand context, tone, and what makes a great cold email.',
  },
  {
    emoji: '🔗',
    title: 'CRM Integration',
    description: 'Connect HubSpot, Salesforce, or Pipedrive to import contacts and sync email activity seamlessly.',
  },
  {
    emoji: '🧪',
    title: 'A/B Testing',
    description: 'Test different email variants to find what works best. Measure opens, clicks, and reply rates to optimize your outreach.',
  },
  {
    emoji: '📱',
    title: 'Email Preview',
    description: 'See exactly how your email will appear in Gmail inbox before sending. Catch formatting issues early.',
  },
  {
    emoji: '⭐',
    title: 'Quality Scoring',
    description: 'AI analyzes your email quality and predicts reply rates. Get actionable insights to improve performance.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Powerful Features
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Everything you need to supercharge your cold email outreach and close more deals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="text-5xl mb-6">
                {feature.emoji}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Outreach?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Transform your outreach with AI-powered cold emails and close more deals.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}
