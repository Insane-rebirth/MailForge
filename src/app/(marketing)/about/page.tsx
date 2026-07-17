'use client'

import { Sparkles, Users, Target, Zap } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            About MailForge
          </h1>
          <p className="text-white/60 text-lg">
            Empowering sales professionals with AI-powered email generation
          </p>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-white/70 leading-relaxed mb-4">
            At MailForge, we believe that every sales professional deserves access to powerful tools that help them connect with prospects effectively. Our mission is to eliminate the time-consuming task of writing cold emails from scratch, allowing you to focus on what matters most - building relationships and closing deals.
          </p>
          <p className="text-white/70 leading-relaxed">
            Founded in 2024, MailForge combines advanced AI technology with proven sales methodologies to generate personalized, high-converting cold emails in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Our Vision</h3>
            <p className="text-white/60">
              To become the go-to platform for sales professionals worldwide, helping them achieve higher reply rates and more meaningful connections with prospects.
            </p>
          </div>

          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Our Team</h3>
            <p className="text-white/60">
              A passionate team of AI engineers, sales experts, and designers working together to build the best cold email tool on the market.
            </p>
          </div>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose MailForge?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Save Hours Every Week</h4>
                <p className="text-white/60 text-sm">Stop spending hours crafting emails. Generate personalized outreach in seconds.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">AI-Powered Quality</h4>
                <p className="text-white/60 text-sm">Our AI understands context and creates emails that actually convert.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Target className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Proven Results</h4>
                <p className="text-white/60 text-sm">Users report 50%+ higher reply rates compared to manually written emails.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
          >
            Start Using MailForge
          </Link>
        </div>
      </div>
    </div>
  )
}
